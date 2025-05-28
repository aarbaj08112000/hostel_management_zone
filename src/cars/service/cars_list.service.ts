interface AuthObject { user: any; }
import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { ConfigService } from '@nestjs/config';
import { CarWishlistEntity } from '../entities/cars.entity';
// import { CustomerEntity } from '../entities/customer.entity';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
@Injectable()
export class CarListService {
  protected readonly log = new LoggerHandler(CarListService.name).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  private keycloakUrl: string;
  private keycloakRealm: string;
  protected requestObj: AuthObject = {
    user: {},
  };
  @InjectDataSource()
  protected dataSource: DataSource;
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly response: ResponseLibrary;
  @Inject()
  protected readonly moduleService: ModuleService;

  constructor(
    protected readonly configService: ConfigService,
    protected readonly elasticService: ElasticService,

    @InjectRepository(CarWishlistEntity)
    private readonly carWishlistRepo: Repository<CarWishlistEntity>,

    @InjectRepository(LookupEntity)
    private readonly modCustomerRepo: Repository<LookupEntity>,

    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_BASE_URL');
    this.keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');
  }

  async startCarList(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      inputParams = await this.getCarList(inputParams);
      if (!_.isEmpty(inputParams.get_car_list)) {
        outputResponse = this.carFinishedSuccess(inputParams);
      } else {
        outputResponse = this.carFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_lists >>', err);
    }
    return outputResponse;
  }
  async getCarList(inputParams: any) {
    let fileConfig: FileFetchDto;
    let currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX')
    fileConfig = {};
    fileConfig.source = 'amazon';
    fileConfig.extensions =
      await this.general.getConfigItem('allowed_extensions');
    this.blockResult = {};
    try {
      let index = 'nest_local_cars';
      if ('is_front' in inputParams && (inputParams?.is_front == 'Yes' || inputParams?.is_front == 'yes')) {
        if ('filters' in inputParams) {
          inputParams.filters = { ...inputParams.filters, status: 'Active', isListed: 'Yes' };
        } else {
          inputParams = { ...inputParams, filters: { status: 'Active', isListed: 'Yes' } };
        }
      }
      let search_params = this.general.createElasticSearchQuery(inputParams);
      let pageIndex = 1;
      if ('page' in inputParams) {
        pageIndex = Number(inputParams.page);
      } else if ('page_index' in inputParams) {
        pageIndex = Number(inputParams.page_index);
      }
      pageIndex = pageIndex > 0 ? pageIndex : 1;
      const recLimit = Number(inputParams.limit);
      const startIdx = custom.getStartIndex(pageIndex, recLimit);
      const results = await this.elasticService.search(
        index,
        search_params,
        startIdx,
        recLimit,
      );
      if (!_.isObject(results) || _.isEmpty(results)) {
        throw new Error('No records found.');
      }
      const totalCount = results['total']['value'];
      this.settingsParams = custom.getPagination(
        totalCount,
        pageIndex,
        recLimit,
      );
      if (totalCount <= 0) {
        throw new Error('No records found.');
      }
      const querySize = recLimit && recLimit > 0 ? recLimit : 1000;
      let test_drive_index = 'nest_local_test_drive_list'
      let test_drive_query = {
        "size": 0,
        "aggs": {
          "car_ids": {
            "terms": {
              "field": "car_id",
              "size": querySize
            }
          }
        }
      }
      let test_drive_res : any  = await this.elasticService.searchAggrregate(test_drive_index, test_drive_query, 'Yes')
      let test_drive_data = [];
      if('car_ids' in test_drive_res){
        if(test_drive_res?.car_ids?.buckets.length > 0){
          test_drive_data = test_drive_res?.car_ids?.buckets
        }
      }
      const testDriveMap = new Map(test_drive_data.map(item => [item.key, item.doc_count]));
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      const data = await Promise.all(
        results.hits.map(async (hit) => {


          hit._source['trimId'] = hit._source['variantId'];
          hit._source['trimName'] = hit._source['variant_name'];

          hit._source['is_wishlist'] = 'No';

          const accessToken = this.request.cookies['front-access-token'];
          if (accessToken) {
            const userInfoUrl = `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`;
            const headers = { Authorization: `Bearer ${accessToken}` };

            const userInfoResponse = await this.general.callThirdPartyApi('GET', userInfoUrl, '', headers);
            if (userInfoResponse.data) {
                const userInfo = userInfoResponse.data;
                const user = await this.modCustomerRepo
                .createQueryBuilder('mod_customer')
                .where("JSON_UNQUOTE(JSON_EXTRACT(mod_customer.entityJson, '$.phoneNumber')) = :phoneNumber", {
                  phoneNumber: userInfo.preferred_username,
                }).andWhere("mod_customer.entityName = :entityName", {
                  entityName: 'customer', 
                })
                .getOne();
                if (user) {
                    const wishlist_data = await this.carWishlistRepo.findOne({
                      where: { carId: hit._source['carId'], userId: user.entityId }
                    });
                    hit._source['is_wishlist'] = wishlist_data ? 'Yes' : 'No';
                }
            }
          }
          fileConfig.image_name = hit._source['car_image'];
          fileConfig.path = `car_images_${aws_folder}/${hit._source['carId']}`;
          hit._source['db_price'] = this.general.numberFormat(
            hit._source['price'],
            'currency',
            'AED'
          );
          hit._source['price'] = this.general.numberFormat(
            hit._source['price'],
            'currency',
            'AED'
          )+ ' '+ 'AED';
          hit._source['drivenDistance'] = this.general.numberFormat( hit._source['drivenDistance']).replace(".00", "")
          hit._source['created_date'] = hit._source['added_date'];
          hit._source['added_date'] = this.general.timeAgo(
            hit._source['added_date'],
          );
          hit._source['currency_code'] = currency_code,
            hit._source['car_image'] = hit._source['car_image']
              ? await this.general.getFile(fileConfig, inputParams)
              : '';
          hit._source['carOtherImage'] = await this.getAWSFiles(
            hit._source['carOtherImage'],
            hit._source['carId'],
          );
          hit._source['publish_status'] = hit._source['isListed'] == 'Yes' ? 'Published' : 'Unpublished'
          hit._source['test_drive_count'] = testDriveMap.get(hit._source['carId']) || 0;
          return hit._source;
        }),
      );

      if (_.isObject(data) && data.length > 0) {
        const success = 1;
        const message = 'Records found.';
        const queryResult = {
          success,
          message,
          data,
        };
        this.blockResult = queryResult;
      } else {
        throw new Error('No records found.');
      }
    } catch (err) {
      console.log(err);
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.get_car_list = this.blockResult.data;
    return inputParams;
  }
  async getAWSFiles(obj, car_id) {
    let carId = car_id;
    const aws_folder = await this.general.getConfigItem('AWS_SERVER');
    let fileConfig: FileFetchDto;
    fileConfig = {};
    fileConfig.source = 'amazon';
    fileConfig.path = `car_images_${aws_folder}/${carId}`;
    fileConfig.extensions =
      await this.general.getConfigItem('allowed_extensions');
    for (let key in obj) {
      if (Array.isArray(obj[key])) {
        obj[key] = await Promise.all(
          obj[key].map(async (value) => {
            fileConfig.image_name = value;
            const result = await this.general.getFile(fileConfig);
            return result;
          }),
        );
      } else if (typeof obj[key] === 'object') {
        await this.getAWSFiles(obj[key], carId);
      }
    }
    return obj;
  }
  async carFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Cars list found.'),
      fields: [],
    };
    settingFields.fields = [
      'carId',
      'trimId',
      'trimName',
      'locationAddress',
      'carCode',
      'carName',
      'price',
      'negotiable',
      'carCondition',
      'status',
      'vinNumber',
      'chassisNumber',
      'brandName',
      'modelName',
      'bodyType',
      'bodyId',
      'location_id',
      'fuelType',
      'manufactureYear',
      'transmissionType',
      'engineCapacity',
      'horsePower',
      'batteryCapacity',
      'chargingTime',
      'range',
      'exteriorColor',
      'interiorColor',
      'brand_id',
      'car_model',
      'interior_color',
      'exterior_color',
      'registrationNumber',
      'registrationDate',
      'registrationExpiry',
      'insuranceType',
      'insuranceExpiry',
      'accidentHistory',
      'insurancePolicyNumber',
      'isColetral',
      'coletralWith',
      'locationName',
      'zipCode',
      'address',
      'latitude',
      'longitude',
      'car_image',
      'drivenDistance',
      'car_slug',
      'car_tag',
      'added_date',
      'carOtherImage',
      'overviewTitle',
      'regionalSpecsId',
      'regionName',
      'monthlyEMIAmount',
      'added_date',
      'updated_by',
      'added_by',
      'updated_date',
      'added_name',
      'updated_name',
      'currency_code',
      'carCode',
      'created_date',
      'analytics',
      'exteriorColorName',
      'interiorColorName',
      'is_wishlist',
      'export_status',
      'bodyName',
      'db_price',
      'display_title',
      'isListed',
      'publish_status',
      'analytics',
      'test_drive_count'
    ];
    const outputKeys = ['get_car_list'];

    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'car_list';

    funcData.output_keys = outputKeys;
    funcData.multiple_keys = this.multipleKeys;
    return this.response.outputResponse(outputData, funcData);
  }
  async carFinishedFailure(inputParams: any) {
    let settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Cars list not found.'),
      fields: [],
    };
    settingFields = { ...settingFields, ...this.settingsParams };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'cars_list',
      },
    );
  }
}

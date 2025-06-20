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
export class CarListFrontService {
  protected readonly log = new LoggerHandler(CarListFrontService.name).getInstance();
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
          inputParams.filters = { ...inputParams.filters, status: ['Available', 'Booked', 'Sold'], isListed: 'Yes' };
        } else {
          inputParams = { ...inputParams, filters: { status: ['Available', 'Booked' , 'Sold'], isListed: 'Yes' } };
        }
      }
      let search_params = this.general.createElasticSearchQuery(inputParams);
      let _source = [
        "carId",
        "bodyType",
        "carName",
        "price",
        "drivenDistance",
        "car_slug",
        "fuelType",
        "transmissionType",
        "car_image",
        "added_date",
        "body_code",
        "analytics",
        "status",
        "display_title"
      ]
      search_params['_source'] = _source;
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
      console.log(JSON.stringify(results,null,2))
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

      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      const data = await Promise.all(
        results.hits.map(async (hit) => {

          hit._source['isWishlist'] = 'No';

          const accessToken = this.request.cookies['front-access-token'];
          if (accessToken) {
            const userInfoUrl = `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`;
            const headers = { Authorization: `Bearer ${accessToken}` };

            const userInfoResponse = await this.general.callThirdPartyApi('GET', userInfoUrl, '', headers);
            if (userInfoResponse.data) {
              const userInfo = userInfoResponse.data;

              // const user = await this.modCustomerRepo.findOne({ where: { phoneNumber: userInfo.preferred_username } });
              const user = await this.modCustomerRepo
            .createQueryBuilder('mod_customer')
          .where("JSON_UNQUOTE(JSON_EXTRACT(mod_customer.entityJson, '$.phoneNumber')) = :phoneNumber", {
            phoneNumber: userInfo.preferred_username,
          })
            .andWhere("mod_customer.entityName = :entityName", {
    entityName: 'customer', 
  })
          .getOne();
              if (user) {
                const wishlist_data = await this.carWishlistRepo.findOne({
                  where: { carId: hit._source['carId'], userId: user.entityId }
                });

                hit._source['isWishlist'] = wishlist_data ? 'Yes' : 'No';
              }
            }
          }

          fileConfig.image_name = hit._source['car_image'];
          fileConfig.path = `car_images_${aws_folder}/${hit._source['carId']}`;
          hit._source['raw_price'] = hit._source['price'];
          hit._source['price'] = this.general.numberFormat(
            hit._source['price'],
            'currency',
            'AED'
          );
          hit._source['added_date'] = this.timeAgo(
            hit._source['added_date_raw'],
          );
          hit._source['drivenDistance'] = this.general.numberFormat(
            hit._source['drivenDistance'],
            'numerical',
          ),
            hit._source['distanceSuffix'] = 'km';
          hit._source['carSlug'] = hit._source['car_slug']
          hit._source['currency_code'] = currency_code,
            hit._source['carImage'] = hit._source['car_image']
              ? await this.general.getFile(fileConfig, inputParams)
              : '';
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
      'fuelType',
      'manufactureYear',
      'transmissionType',
      'engineCapacity',
      'horsePower',
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
      'carImage',
      'drivenDistance',
      'carSlug',
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
      'isWishlist',
      'distanceSuffix',
      "status",
      "display_title",
      "raw_price"
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
    timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 },
        ];
        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
            }
        }
        return 'just now';
    }
}

interface AuthObject {
  user: any;
}
import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ConfigService } from '@nestjs/config';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { CarWishlistEntity } from '../entities/cars.entity';
import { CustomerEntity } from '@repo/source/entities/customer.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
@Injectable()
export class CarDetailsService {
  protected readonly log = new LoggerHandler(
    CarDetailsService.name,
  ).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
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
    protected readonly elasticService: ElasticService,
    protected readonly configService: ConfigService,
    @InjectRepository(CarWishlistEntity)
    private readonly carWishlistRepo: Repository<CarWishlistEntity>,
    @InjectRepository(CustomerEntity)
    private readonly modCustomerRepo: Repository<CustomerEntity>,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_BASE_URL');
    this.keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');
  }
  async startCarDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.getCarDetails(inputParams);

      if (!_.isEmpty(inputParams.car_details)) {
        outputResponse = this.carDetailsFinishedSuccess(inputParams);
      } else {
        outputResponse = this.carDetailsFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_details >>', err);
    }
    return outputResponse;
  }
  async getCarDetails(inputParams: any) {
    this.blockResult = {};
    try {
      let fileConfig: FileFetchDto;
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions =
        await this.general.getConfigItem('allowed_extensions');

      let { search_key, search_by, index } = inputParams;
      const data = await this.elasticService.getById(
        search_key,
        index,
        search_by,
      );
      data['is_wishlist'] = 'No';

      const accessToken = this.request.headers ? this.request.headers['front-access-token'] : null;
      if (accessToken) {
        const userInfoUrl = `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`;
        const headers = { Authorization: `Bearer ${accessToken}` };

        const userInfoResponse = await this.general.callThirdPartyApi('GET', userInfoUrl, '', headers);
        if (userInfoResponse.data) {
          const userInfo = userInfoResponse.data;

          const user = await this.modCustomerRepo.findOne({ where: { phoneNumber: userInfo.preferred_username } });
          if (user) {
            const wishlist_data = await this.carWishlistRepo.findOne({
              where: { carId: data['carId'], userId: user.id }
            });

            data['is_wishlist'] = wishlist_data ? 'Yes' : 'No';
          }
        }
      }

      if (data?.car_image != '') {
        fileConfig.image_name = data['car_image'];
        fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
        data.car_image = await this.general.getFile(fileConfig, inputParams);
      }

      if (data['interiorImages'] && Array.isArray(data['interiorImages'])) {
        data['interiorImages'] = await Promise.all(
          data['interiorImages'].map(async (imageName) => {
            fileConfig.image_name = imageName.split(':')[1];
            fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
            return { image_id: imageName.split(':')[0], image_name: await this.general.getFile(fileConfig, inputParams) };
          }),
        );

      }
      if (data['exteriorImages'] && Array.isArray(data['exteriorImages'])) {
        data['exteriorImages'] = await Promise.all(
          data['exteriorImages'].map(async (imageName) => {
            fileConfig.image_name = imageName.split(':')[1];
            fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
            return { image_id: imageName.split(':')[0], image_name: await this.general.getFile(fileConfig, inputParams) };
          }),
        );
      }

      if (data?.tag_information) {
        const pairs = data.tag_information.split(",");
        const tags = pairs.map(pair => {
          const [tag_id, tag_code] = pair.split(":");
          return { tag_id: Number(tag_id), tag_code };
        });
        data.tag_information = tags;
      }
      if (data?.car_documents) {
        const pairs = data.car_documents.split(",");
        const docTags = await Promise.all(pairs.map(async pair => {
          fileConfig.image_name = pair.split(':')[1];
          fileConfig.path = `car_documents_${aws_folder}/${data['carId']}`;
          return { doc_id: pair.split(':')[0], doc_name: await this.general.getFile(fileConfig, inputParams) };
        }));
        data.car_documents = docTags
      }
      if (_.isObject(data) && !_.isEmpty(data)) {
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
    inputParams.car_details = this.blockResult.data;
    return inputParams;
  }
  carDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('car details found.'),
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
      'negotiableRange',
      'carDescription',
      'monthlyEMIAmount',
      'remarks',
      'manufactureMonth',
      'serialNumber',
      'countryId',
      'carCategory',
      'engineType',
      'engineSize',
      'steeringSide',
      'regionalSpecsId',
      'serviceHistory',
      'warranty',
      'ownerNumber',
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
      'car_image',
      'drivenDistance',
      'car_slug',
      'car_tag',
      'exteriorImages',
      'interiorImages',
      'shortDescription',
      'contactDetails',
      'seatingCapacity',
      'numberOfDoors',
      'ownerNumber',
      'accidentalHistory',
      'afterMarketModification',
      'regionalSpecsId',
      'monthlyEMIAmount',
      'is_wishlist',
    ];
    const outputKeys = ['car_details'];

    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'car_details';

    funcData.output_keys = outputKeys;
    funcData.singleKeys = this.singleKeys;
    return outputData;
    return this.response.outputResponse(outputData, funcData);
  }
  carDetailsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('car details not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_details',
      },
    );
  }
}

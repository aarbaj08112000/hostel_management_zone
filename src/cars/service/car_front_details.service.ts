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
// import { CustomerEntity } from '../entities/customer.entity';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
@Injectable()
export class CarFrontDetailsService {
  protected readonly log = new LoggerHandler(
    CarFrontDetailsService.name,
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
    @InjectRepository(LookupEntity)
    private readonly modCustomerRepo: Repository<LookupEntity>,
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
      console.log(err)
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
      let _source = [
        "engineSize",
        "tag_information",
        "carId",
        "carName",
        "price",
        "drivenDistance",
        "car_slug",
        "transmissionType",
        "discountEnabled",
        "discountValue",
        "booked_by_details",
        "car_image",
        "added_date",
        "bodyName",
        "analytics",
        "interiorImages",
        "exteriorImages",
        "fuelType",
        "engineCapacity",
        "manufactureYear",
        "seatingCapacity",
        "overviewTitle",
        "overviewTitle",
        "shortDescription",
        "features",
        "carDescription",
        "horsePower",
        "exteriorColorName",
        "numberOfDoors",
        "latitude",
        "longitude",
        "locationAddress",
        "contactDetails",
        "warranty",
        "isListed",
        "brandName",
        "modelName",
        "model_name",
        "location_id",
        "operating_hours",
        "status",
        "display_title",
        "batteryCapacity",
        "chargingTime",
        "range",
        "locationName",
        "zipCode",
        "driveType",
        "open_time",
        "export_status",
        "close_time",
        "car_documents",
        "views",
        "wishlistCount",
        "car_booking_status"
      ]
      let { search_key, search_by, index } = inputParams;
      let images = {};
      const data = await this.elasticService.getById(
        search_key,
        index,
        search_by,
        '',
        _source
      );

      if (data['isListed'] == 'No') {
        if (inputParams?.dev_publish.toLowerCase() != 'yes') {
          throw new Error('No records found.');
        }
      }
      data['isWishList'] = 'No';
      data['wishlist_count'] = 0;
      data['allow_test_drive'] = 'Yes';
      let booked_by_id;
      if (['Sold', 'Booked'].includes(data['status'])) {
        data['allow_test_drive'] = 'No';
        if(data.booked_by_details){
          data.booked_by_details = JSON.parse(data.booked_by_details);
          booked_by_id = data.booked_by_details.id;
        }
      }

      if (data?.status == 'Booked' && data?.car_booking_status == 'Reserved') {
        data['status'] = 'Reserved';
      }

      const [wishlist, count] = await this.carWishlistRepo.findAndCount({
        where: { carId: data['carId'] },
      });
      if('wishlistCount' in data){
        let wishList = typeof data['wishlistCount'] != 'undefined' && data['wishlistCount'] != '' ? data['wishlistCount'] : 0 ;
        data['wishlist_count'] = data['wishlist_count'] + count;
        data['wishlist_count'] = data['wishlist_count'] +  wishList
      }else{
        data['wishlist_count'] = data['wishlist_count'] + count;
      }

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
            .andWhere("mod_customer.entityName = :entityName", {entityName: 'customer'})
          .getOne();
          if (user) {

            const wishlist_data = await this.carWishlistRepo.findOne({
              where: { carId: data['carId'], userId: user.entityId}
            });

            data['isWishList'] = wishlist_data ? 'Yes' : 'No';
            
            if (user.entityId == booked_by_id){
              data['status'] = data['status'] == 'Sold' ? 'Purchased' : data['status']; 
              data['allow_test_drive'] = 'Yes';
            }
          }
        }
      }

      if (['Sold', 'Purchased'].includes(data['status'])) {
        data['allow_test_drive'] = 'No';
      }

      if (data?.contactDetails != '') {
        fileConfig.image_name = data.contactDetails?.contactPersonProfile;
        fileConfig.path = `user_${aws_folder}`;
        data.contactDetails.contactPersonProfile = await this.general.getFile(fileConfig, inputParams);
      }
      if (data?.car_image != '') {
        fileConfig.image_name = data['car_image'];
        fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
        data.primaryImage = await this.general.getFile(fileConfig, inputParams);
        images['primaryImage'] = data.primaryImage
      }

      if (data['interiorImages'] && Array.isArray(data['interiorImages'])) {
        data['interiorImages'] = await Promise.all(
          data['interiorImages'].map(async (imageName) => {
            fileConfig.image_name = imageName.split(':')[1];
            fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
            return await this.general.getFile(fileConfig, inputParams);
          }),
        );
        images['interiorImages'] = data['interiorImages'];
      }
      if (data['exteriorImages'] && Array.isArray(data['exteriorImages'])) {
        data['exteriorImages'] = await Promise.all(
          data['exteriorImages'].map(async (imageName) => {
            fileConfig.image_name = imageName.split(':')[1];
            fileConfig.path = `car_images_${aws_folder}/${data['carId']}`;
            return await this.general.getFile(fileConfig, inputParams);
          }),
        );
        images['exteriorImages'] = data['exteriorImages'];
      }

      if (data?.tag_information) {
        const pairs = data.tag_information.split(",");
        const tags = pairs.map(pair => {
          const [tag_id, tag_code , tag_name] = pair.split(":");
          return { tag_code  , tag_name};
        });
        data.tag_information = tags;
      }
      data['is_insp_rep'] = 'No';
      if (data?.car_documents) {
        let doc_index = 'nest_local_document_type_list';
        // inputParams['filters'] = { code: 'INSPREPORT' } ;
        inputParams['filters'] = [{ key: "code", value : "INSPREPORT", operator : "equal" }] ;
        let search_params = this.general.createElasticSearchQuery(inputParams);
        let pageIndex = 1;
        const recLimit = 100;
        const startIdx = custom.getStartIndex(pageIndex, recLimit);
        const results = await this.elasticService.search(
          doc_index,
          search_params,
          startIdx,
          recLimit,
        );

        const document_data = await Promise.all(results.hits.map(async (hit) => {
            return hit._source;
          }),
        );

        const document_id =  document_data[0]['id'];

        let docTags;
        const car_documents = data?.car_documents;
        if(car_documents){
          const pairs = car_documents.match(/{[^}]+}/g);
          docTags = await Promise.all(pairs.map(async (pair) => {
            const doc = {} as {
              doc_id: string | null;
              doc_title: string | null;
              doc_type: string | null;
            };
            const idMatch = pair.match(/id:(\d+)/);
            const titleMatch = pair.match(/title:"([^"]+)"/);
            const typeMatch = pair.match(/type:(\d+)/);

            doc.doc_id = idMatch ? idMatch[1] : null;
            doc.doc_title = titleMatch ? titleMatch[1] : null;
            doc.doc_type = typeMatch ? typeMatch[1] : null;
            fileConfig.image_name = doc.doc_title;
            fileConfig.path = `car_documents_${aws_folder}/${data['carId']}`;

            return {
              doc_id: doc.doc_id,
              doc_name: await this.general.getFile(fileConfig, inputParams),
              key: doc.doc_type
            };
          }));
        }
        data.car_documents = docTags
        const matchingDoc = docTags.find((doc) => doc.key === document_id.toString());
        const insp_report_url = matchingDoc ? matchingDoc.doc_name : null;
        if(insp_report_url){
          data['is_insp_rep'] = 'Yes'
        }
      }
      data.images = images;
      data.modelName = data.model_name
      data.engineCapacity = data?.engineCapacity ? this.general.numberFormat(data?.engineCapacity, 'numerical') : '';
      data.drivenDistance = data?.drivenDistance ? this.general.numberFormat(data?.drivenDistance, 'numerical') : '';
      let features = {
        key_features: [],
        all_features: []
      };
      if (data?.features != null) {
        const categoryAccumulator = {};

        data.features.forEach(value => {
          features.key_features.push(value.featureName);
          if (!categoryAccumulator[value.featureCategoryName]) {
            categoryAccumulator[value.featureCategoryName] = [];
          }
          categoryAccumulator[value.featureCategoryName].push(value.featureName);
        });
        for (const categoryCode in categoryAccumulator) {
          features.all_features.push({
            category: categoryCode,
            values: categoryAccumulator[categoryCode]
          });
        }
        data.features = features;
      }

      data.distanceSuffix = 'km';
      data.carSlug = data.car_slug;
      data.currencyCode = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX')
      data.raw_price = data.price
      data.formattedPrice = data?.price ? this.general.numberFormat(
        data.price,
        'currency',
        'AED'
      ) : '';
      data.rating = "4.4"
      data.horsePowerSuffix = 'HP';
      data.transmissionSuffix = 'Transmission'
      data.seatingCapacitySuffix = 'Seater'
      const open_time = data?.open_time ? data.open_time : '10:00:00';
      const close_time = data?.close_time ? data.close_time : '20:00:00';

      data.locationTiming = this.convertTimeRange(open_time , close_time)
      data.engineSuffix = 'CC';
      data.noOfCylinders = '6';
      data.added_date = this.general.timeAgo(data.added_date)
      data.engineSizeSuffix = "L"
      if(data?.views){
          if(data?.analytics){
            data.originalView = data?.analytics?.views
            data.analytics.views = data?.analytics?.views + data?.views
            data.analytics.visitors = data.analytics.views
          }else{
            data.analytics = {}
            data.analytics.visitors = data?.views;
            data.analytics.views = data?.views
          }
      }
      if(data['fuelType'] == 'Electric'){
        data.vehicleType = 'ev';
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
  convertTimeRange(startTime: string, endTime: string): string {
    function formatTime(timeStr: string): string {
        const [hourStr, minute] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const isPM = hour >= 12;
        const period = isPM ? 'PM' : 'AM';
        hour = hour % 12 || 12; 
        return `${hour}:${minute} ${period}`;
    }

    const startFormatted = formatTime(startTime);
    const endFormatted = formatTime(endTime);

    return `${startFormatted} to ${endFormatted}`;
}

  carDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('car details found.'),
      fields: [],
    };
    settingFields.fields = [
      "carName",
      "price",
      "drivenDistance",
      "carSlug",
      "fuelType",
      "transmissionType",
      "bodyName",
      "analytics",
      "interiorImages",
      "exteriorImages",
      "engineCapacity",
      "manufactureYear",
      "seatingCapacity",
      "overviewTitle",
      "overviewTitle",
      "shortDescription",
      "features",
      "carDescription",
      "horsePower",
      "discountEnabled",
      "discountValue",
      "allow_test_drive",
      "exteriorColorName",
      "numberOfDoors",
      "primaryImage",
      "formattedPrice",
      "distanceSuffix",
      "currencyCode",
      "latitude",
      "longitude",
      "locationAddress",
      "contactDetails",
      "isWishList",
      "rating",
      "horsePowerSuffix",
      "transmissionSuffix",
      "seatingCapacitySuffix",
      "locationTiming",
      "engineSuffix",
      "noOfCylinders",
      "warranty",
      "brandName",
      "modelName",
      "status",
      "added_date",
      "display_title",
      "batteryCapacity",
      "chargingTime",
      "range",
      "vehicleType",
      "tag_information",
      "locationName",
      "zipCode",
      "engineSize",
      "engineSizeSuffix",
      "driveType",
      "export_status",
      "is_insp_rep",
      "wishlist_count",
      "raw_price",
      "isListed",
      "wishlistCount",
      "car_booking_status"
    ];
    if ('location_enabled' in inputParams && inputParams.location_enabled == 'Yes') {
      settingFields.fields.push('location_id', 'carId', 'operating_hours')
    }
    const outputKeys = ['car_details'];

    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;
    const funcData: any = {};
    funcData.name = 'car_details';
    let analaytics_res = outputData.data?.car_details?.analytics
    let booked_by_details = outputData.data?.car_details?.booked_by_details
    delete outputData.data?.car_details?.analytics
    delete outputData.data?.car_details?.booked_by_details
    funcData.output_keys = outputKeys;
    funcData.singleKeys = this.singleKeys;
    let response = this.response.outputResponse(outputData, funcData);
    delete response?.data[0]?.exteriorImages
    delete response?.data[0]?.interiorImages
    delete response?.data[0]?.primaryImage
    response.data = response.data[0]
    if(!('analytics' in response.data)){
      response.data['analytics'] = {}
    }
    response.data['analytics'] = analaytics_res
    response.data['booked_by_details'] = booked_by_details
    return response
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
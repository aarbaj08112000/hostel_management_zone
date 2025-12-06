interface AuthObject { user: any; }
import { Injectable, Inject, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import * as custom from '@repo/source/utilities/custom-helper';
import { Repository, DataSource, In } from 'typeorm';
import { Request } from 'express';
import { CarWishlistEntity } from '../entities/cars.entity';
// import { CustomerEntity } from '../entities/customer.entity';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { CarEntity } from '../entities/cars.entity';
import { CarDetailsEntity } from '../entities/cars-detail.entity';
import { ElasticService } from '@repo/source/services/elastic.service';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import * as _ from 'lodash';
import { CarMicroserviceService } from './car_microservice.service';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import * as moment from 'moment';
import { CarsAddService } from './cars_add.service';
@Injectable()
export class CarWishlistService {
  protected readonly log = new LoggerHandler(CarWishlistService.name).getInstance();
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
  private readonly dataSource: DataSource;
  @Inject()
  protected readonly response: ResponseLibrary;

  constructor(
    protected readonly elasticService: ElasticService,
    private readonly general: CitGeneralLibrary,
    private readonly configService: ConfigService,
    private readonly carsAddService: CarsAddService,
    @InjectRepository(CarWishlistEntity)
    private readonly carWishlistRepo: Repository<CarWishlistEntity>,
    @InjectRepository(LookupEntity)
    private readonly modCustomerRepo: Repository<LookupEntity>,
    @InjectRepository(CarEntity)
    private readonly carRepo: Repository<CarEntity>,
    @Inject()
    private readonly carMicroService : CarMicroserviceService
  ) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_BASE_URL');
    this.keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');
  }

  private async getUserFromAccessToken(request: Request) {
    const accessToken = request.cookies['front-access-token'];
    if (!accessToken) {
      throw new UnauthorizedException('Access token not found in cookies');
    }

    const userInfoUrl = `${this.keycloakUrl}/realms/${this.keycloakRealm}/protocol/openid-connect/userinfo`;
    const headers = { Authorization: `Bearer ${accessToken}` };

    const userInfoResponse = await this.general.callThirdPartyApi('GET', userInfoUrl, '', headers);
    const userInfo = userInfoResponse.data;

    if (!userInfo?.email) {
      throw new UnauthorizedException('Invalid access token.');
    }
    await this.carMicroService.processLookupDataFromBody({phone:userInfo.preferred_username})
    // const user = await this.modCustomerRepo.findOne({ where: { phoneNumber: userInfo.preferred_username } });
    const user = await this.modCustomerRepo
    .createQueryBuilder('mod_customer')
    .where("JSON_UNQUOTE(JSON_EXTRACT(mod_customer.entityJson, '$.phoneNumber')) = :phoneNumber", {
      phoneNumber: userInfo.preferred_username,
    }).andWhere("mod_customer.entityName = :entityName", {
      entityName: 'customer', 
    })
    .getOne();
    if (!user) {
      throw new UnauthorizedException('User not found in the system.');
    }

    return user;
  }

  async addToWishlist(request: Request, inputParams: { car_slug: string }) {
    try {
      const user = await this.getUserFromAccessToken(request);
      const carData = await this.carRepo.findOne({
        where: { slug: inputParams.car_slug },
      });

      if (!carData) {
        throw new NotFoundException('Car not found.');
      }

      const existingEntry = await this.carWishlistRepo.findOne({
        where: { carId: carData.carId, userId: user.entityId },
      });

      if (existingEntry) {
        throw new ConflictException('Car is already in your wishlist.');
      }

      const wishlistEntry = this.carWishlistRepo.create({
        carId: carData.carId,
        userId: user.entityId,
      });

      let res = await this.carWishlistRepo.save(wishlistEntry);
      if(res.id){
        let value_json = {
          "CAR_NAME": await this.carsAddService.fetchDisplayName(carData.carId),
          "TYPE": "front",
          "CAR_ID": carData.carId,
          "ADDED_BY": user?.entityJson?.first_name +' '+ user?.entityJson?.last_name,
          "ADDED_BY_ID": user.entityId
        }
        await this.general.addActivity('car', 'wishlist_added', user.entityId, value_json, carData.carId);
      }
   
      let job_data = {
        job_function: 'sync_elastic_data',
        job_params: {
          module: 'customer_wishlist',
          data: user.entityId
        },
      };
      await this.general.submitGearmanJob(job_data);
      return { success: 1, message: 'Car added to your wishlist.' };
    } catch (err) {
      return { success: 0, message: err.message, data: [] };
    }
  }

  async removeFromWishlist(request: Request, inputParams: { car_slug: string }) {
    try {
      const user = await this.getUserFromAccessToken(request);

      const carData = await this.carRepo.findOne({
        where: { slug: inputParams.car_slug },
      });

      if (!carData) {
        throw new NotFoundException('Car not found.');
      }

      const existingEntry = await this.carWishlistRepo.findOne({
        where: { carId: carData.carId, userId: user.entityId},
      });

      if (!existingEntry) {
        throw new NotFoundException('Car is not in your wishlist.');
      }

      let wishlist_delete_res = await this.carWishlistRepo.delete({ carId: carData.carId, userId: user.entityId });
      let job_data = {
        job_function: 'sync_elastic_data',
        job_params: {
          module: 'customer_wishlist',
          data: user.entityId
        },
      };
      if(wishlist_delete_res?.affected){
        let value_json = {
          "CAR_NAME": await this.carsAddService.fetchDisplayName(carData.carId),
          "TYPE": "front",
          "CAR_ID": carData.carId,
          "REMOVED_BY": user?.entityJson?.first_name +' '+ user?.entityJson?.last_name,
          "REMOVED_BY_ID": user.entityId
        }
        await this.general.addActivity('car', 'wishlist_deleted', user.entityId, value_json, carData.carId);
   
      }
      await this.general.submitGearmanJob(job_data);
      return { success: 1, message: 'Car removed from your wishlist.' };
    } catch (err) {
      return { success: 0, message: err.message, data: [] };
    }
  }

  async startCarWishlist(request: Request, inputParams: any, query?: any) {
    let outputResponse = {};
    try {
      if(inputParams.is_front != 'Yes') {
        inputParams['customer_id'] = query.id;
      }
      inputParams = await this.getWishlist(request, inputParams);
      if (!_.isEmpty(inputParams.get_car_list)) {
        outputResponse = this.carFinishedSuccess(inputParams);
      } else {
        outputResponse = this.carFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_wishlist >>', err);
    }
    return outputResponse;
  }

  async getWishlist(request, inputParams) {
    this.blockResult = {};
    try {
      let user: any = {};
      let is_front = inputParams.is_front;
      if(inputParams.is_front == 'Yes') {
        user = await this.getUserFromAccessToken(request);
        inputParams['customer_id'] = user.entityId;
      }
      // Fetch wishlist entries using the userId
      const wishlistEntries = await this.carWishlistRepo.find({
        where: { userId: inputParams.customer_id },
      });

      if (!wishlistEntries.length) {
        throw new NotFoundException('No cars found in your wishlist.');
      }

      const carIds = wishlistEntries.map(entry => entry.carId);
      let fileConfig: FileFetchDto;
      let currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX')
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');
      let index = 'nest_local_cars';
      let search_params = this.general.createElasticSearchQuery({
        "is_front" : "Yes",
        filters : {carId : carIds}
      });
      let _source = [
        "carId",
        "bodyType",
        "carName",
        "price",
        "drivenDistance",
        "car_slug",
        "fuelType",
        "transmissionType",
        "manufactureYear",
        "carCode",
        "location_id",
        "locationName",
        "car_image",
        "added_date",
        "body_code",
        "analytics",
        "status",
        "display_title",
        "isListed",
        "views",
        "booked_by_details",
        "car_booking_status"
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
      inputParams['is_front'] = is_front == 'Yes' ? 'Yes' : 'No';
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      const data = await Promise.all(
        results.hits.map(async (hit) => {
          hit._source['isWishlist'] = 'Yes';
          fileConfig.image_name = hit._source['car_image'];
          fileConfig.path = `car_images_${aws_folder}/${hit._source['carId']}`;
          hit._source['raw_price'] = hit._source['price'];
          hit._source['price'] = this.general.numberFormat(hit._source['price'], 'currency', 'AED');
          if (inputParams.is_front == 'Yes') {
            hit._source['added_date'] = this.general.timeAgo(hit._source['added_date']);
          }else{
            hit._source['added_date'] = moment(hit._source['added_date'], 'YYYY-MM-DD HH:mm A').format('dddd, DD MMMM YYYY hh:mm A');
          }
          hit._source['drivenDistance'] = this.general.numberFormat(hit._source['drivenDistance'], 'numerical'),
          hit._source['distanceSuffix'] = 'km';
          hit._source['carSlug'] = hit._source['car_slug']
          hit._source['currency_code'] = currency_code,
          hit._source['carImage'] = hit._source['car_image']
            ? await this.general.getFile(fileConfig, inputParams)
            : '';
          let booked_by_id = 0;
          if(hit._source['booked_by_details']){
              hit._source['booked_by_details'] = JSON.parse(hit._source['booked_by_details']);
              booked_by_id = hit._source['booked_by_details']?.id;
          }
          if(inputParams.is_front == 'Yes') {
              if(inputParams['customer_id'] == booked_by_id){
                  hit._source['status'] = hit._source['status'] == 'Sold' ? 'Purchased' : hit._source['status'];
              }
          }
          if(typeof hit._source['views'] != 'undefined' && hit._source['views'] != null){
            if(typeof hit._source['analytics'] != 'undefined' && hit._source['analytics'] != null){
              if(typeof hit._source['analytics']?.views != 'undefined'){
                  hit._source['analytics']['views'] = hit._source['analytics']?.views + hit._source['views']
                 hit._source['analytics']['visitors'] = hit._source['analytics']['views']
              }
            }else{
              hit._source['analytics'] = {}
              hit._source['analytics']['visitors'] = hit._source['views'] ? hit._source['views'] : 0;
              hit._source['analytics']['views'] = hit._source['views']
            }
          }
          if(hit._source['status'] == 'Booked' && hit._source['car_booking_status'] == 'Reserved'){
            hit._source['status'] = 'Reserved';
          }
          return hit._source;
        }),
      );

      if (_.isObject(data) && data.length > 0) {
        const success = 1;
        const message = 'Wishlist found.';
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

  async carFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Wishlist found.'),
      fields: [],
    };
    settingFields.fields = [
      'carId',
      'carName',
      'carCode',
      'price',
      'bodyType',
      'fuelType',
      'transmissionType',
      'manufactureYear',
      'location_id',
      'locationName',
      'carImage',
      'drivenDistance',
      'carSlug',
      'added_date',
      'currency_code',
      'analytics',
      'isWishlist',
      'distanceSuffix',
      'status',
      'display_title',
      'isListed',
      "raw_price",
      "car_booking_status"
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
    return {
      "settings": {
        "status": 200,
        "success": 0,
        "message": "Wishlist not found."
      },
      "data": []
    }
  }
}

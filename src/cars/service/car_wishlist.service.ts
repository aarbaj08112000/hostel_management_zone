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
    @InjectRepository(CarWishlistEntity)
    private readonly carWishlistRepo: Repository<CarWishlistEntity>,
    @InjectRepository(LookupEntity)
    private readonly modCustomerRepo: Repository<LookupEntity>,
    @InjectRepository(CarEntity)
    private readonly carRepo: Repository<CarEntity>,
    @InjectRepository(CarDetailsEntity)
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

      await this.carWishlistRepo.save(wishlistEntry);
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

      await this.carWishlistRepo.delete({ carId: carData.carId, userId: user.entityId });

      return { success: 1, message: 'Car removed from your wishlist.' };
    } catch (err) {
      return { success: 0, message: err.message, data: [] };
    }
  }

  async startCarWishlist(request: Request, inputParams: any) {
    let outputResponse = {};
    try {
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
      const user = await this.getUserFromAccessToken(request);

      // Fetch wishlist entries using the userId
      const wishlistEntries = await this.carWishlistRepo.find({
        where: { userId: user.entityId},
      });

      if (!wishlistEntries.length) {
        throw new NotFoundException('No cars found in your wishlist.');
      }

      const carIds = wishlistEntries.map(entry => entry.carId);
      inputParams['filters'] = {carId : carIds}
      inputParams['is_front'] = 'Yes'
      let fileConfig: FileFetchDto;
      let currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX')
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');
      let index = 'nest_local_cars';
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
          hit._source['isWishlist'] = 'Yes';
          fileConfig.image_name = hit._source['car_image'];
          fileConfig.path = `car_images_${aws_folder}/${hit._source['carId']}`;

          hit._source['price'] = this.general.numberFormat(hit._source['price'], 'currency', 'AED');
          hit._source['added_date'] = this.general.timeAgo(hit._source['added_date']);
          hit._source['drivenDistance'] = this.general.numberFormat(hit._source['drivenDistance'], 'numerical'),
          hit._source['distanceSuffix'] = 'km';
          hit._source['carSlug'] = hit._source['car_slug']
          hit._source['currency_code'] = currency_code,
          hit._source['carImage'] = hit._source['car_image']
            ? await this.general.getFile(fileConfig, inputParams)
            : '';
          return hit._source;
        }),
      );


      // const cars = await this.carRepo.find({
      //   where: { carId: In(carIds) },
      // });

      // const carDetails = await this.carDetailsRepo.find({
      //   where: { carId: In(carIds) },
      // });

      // const bodyTypes = await this.bodyRepo.find({
      //   where: { bodyTypeId: In(carDetails.map(detail => detail.bodyTypeid)) },
      // });

      // const bodyTypesMap: { [key: number]: any } = {};
      // bodyTypes.forEach(body => {
      //   bodyTypesMap[body.bodyTypeId] = body;
      // });

      // const carDetailsMap: { [key: number]: CarDetailsEntity } = {};
      // carDetails.forEach(detail => {
      //   carDetailsMap[detail.carId] = detail;
      // });

      // const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      // let fileConfig: FileFetchDto = {};
      // fileConfig.source = 'amazon';
      // fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');

      // const wishlistDetails = await Promise.all(
      //   cars.map(async (car) => {
      //     const details = carDetailsMap[car.carId] ?? {};
      //     const bodyType = bodyTypesMap[details['bodyTypeid']] ?? {};

      //     fileConfig.path = `car_images_${aws_folder}/${car.carId}`;
      //     fileConfig.image_name = car.carImage;
      //     const carImageUrl = await this.general.getFile(fileConfig, {});

      //     let addedDate = this.general.timeAgo(car.addedDate);
      //     let price = this.general.numberFormat(car.price, 'currency');
      //     let currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX');

      //     details['drivenDistance'] = this.general.numberFormat(details['drivenDistance'], 'numerical');

      //     return {
      //       carId: car.carId,
      //       carSlug: car.slug,
      //       carName: car.carName,
      //       carImage: carImageUrl,
      //       price: price,
      //       isWishlist: 'Yes',
      //       currency_code: currency_code,
      //       added_date: addedDate,
      //       fuelType: details['fuelType'] ?? null,
      //       drivenDistance: details['drivenDistance'] ?? null,
      //       distanceSuffix: 'km',
      //       transmissionType: details['transmissionType'] ?? null,
      //       bodyType: bodyType.bodyType ?? null,
      //       bodyCode: bodyType.bodyCode ?? null,
      //     };
      //   })
      // );

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
      'price',
      'bodyType',
      'fuelType',
      'transmissionType',
      'carImage',
      'drivenDistance',
      'carSlug',
      'added_date',
      'currency_code',
      'analytics',
      'isWishlist',
      'distanceSuffix',
      'status',
      'display_title'
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
      message: custom.lang('Wishlist not found.'),
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

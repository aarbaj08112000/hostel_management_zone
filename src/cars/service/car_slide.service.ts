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
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { ConfigService } from '@nestjs/config';
import { distance } from 'mathjs';
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { CarWishlistEntity } from '../entities/cars.entity';
// import { CustomerEntity } from '../entities/customer.entity';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
@Injectable()
export class CarSlideService {
  protected readonly log = new LoggerHandler(
    CarSlideService.name,
  ).getInstance();
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
  async startCarSlide(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.getCarSlide(inputParams);

      if (!_.isEmpty(inputParams.car_slide)) {
        outputResponse = this.carSlideFinishedSuccess(inputParams);
      } else {
        outputResponse = this.carSlideFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_slide >>', err);
    }
    return outputResponse;
  }
  async getCarSlide(inputParams: any) {
    this.blockResult = {};
    try {
      let index = 'cars';
      let image_path =
        process.env.BASE_URL +
        '/' +
        this.configService.get('app.upload_url') +
        'images';
      let cartagName = inputParams.tagName ? inputParams.tagName.split(',') : '';
      let body_type = inputParams.body_code;
      let search_params = {
        size: 0,
        query: cartagName
          ? {
            bool: {
              filter: [
                Array.isArray(cartagName)
                  ? { terms: { car_tag: cartagName } }
                  : { term: { car_tag: cartagName } },
                ...(Array.isArray(cartagName) &&
                  cartagName.includes('trending_cars') &&
                  body_type
                  ? [{ term: { body_code: body_type } }]
                  : cartagName === 'trending_cars' && body_type
                    ? [{ term: { body_code: body_type } }]
                    : []),
                { terms: { status: ['Available', 'Booked', 'Sold'] } },
                { term: { isListed: "Yes" } },
              ],
            },
          }
          : {
            bool: {
              filter: [
                { terms: { status: ['Available', 'Booked','Sold'] } },
                { term: { isListed: "Yes" } },
              ],
            },
          },
        aggs: cartagName
          ? Object.fromEntries(
            (Array.isArray(cartagName) ? cartagName : [cartagName]).map((tag) => [
              `${tag}_cars`,
              {
                filter: {
                  bool: {
                    must: [{ term: { car_tag: tag } }],
                    ...(tag === 'trending_cars' && body_type
                      ? { filter: [{ term: { body_code: body_type } }] }
                      : {}),
                    filter: [
                      { terms: { status: ['Available', 'Booked','Sold'] } },
                      { term: { isListed: "Yes" } },
                    ],
                  },
                },
                aggs: {
                  cars: {
                    top_hits: {
                      size: 6,
                      _source: [
                        'carId',
                        'bodyType',
                        'carName',
                        'price',
                        'drivenDistance',
                        'car_slug',
                        'fuelType',
                        'transmissionType',
                        'car_image',
                        'added_date',
                        'body_code',
                        'analytics',
                        'status',
                        "display_title"
                      ],
                      sort: [
                        {
                          added_date: {
                            order: 'desc',
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ])
          )
          : {
            group_by_car_tag: {
              terms: {
                field: 'car_tag',
                size: 100,
              },
              aggs: {
                cars: {
                  top_hits: {
                    size: 18,
                    _source: [
                      'carId',
                      'bodyType',
                      'carName',
                      'price',
                      'drivenDistance',
                      'car_slug',
                      'fuelType',
                      'transmissionType',
                      'car_image',
                      'added_date',
                      'body_code',
                      'analytics',
                      'status',
                      "display_title"
                    ],
                    sort: [
                      {
                        added_date: {
                          order: 'desc',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
      };
      const results = await this.elasticService.searchGlobalData(
        index,
        search_params,
        'Yes',
      );
      if (!_.isObject(results) || _.isEmpty(results)) {
        throw new Error('No records found.');
      }
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      let fileConfig: FileFetchDto;
      let currency_code = await this.general.getConfigItem('ADMIN_CURRENCY_PREFIX')
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions =
        await this.general.getConfigItem('allowed_extensions');
      let data = cartagName
        ? await Promise.all(
          cartagName.map(async (element) => {
            const carResults = results[`${element}_cars`]?.cars.hits.hits || [];

            const processedCars = await Promise.all(
              carResults.map(async (hit) => {

                hit._source['is_wishlist'] = 'No';

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
          
                      // data['is_wishlist'] = wishlist_data ? 'Yes' : 'No';
                      hit._source['is_wishlist'] = wishlist_data ? 'Yes' : 'No';
                    }
                  }
                }

                let carImage = '';
                if (hit._source['car_image']) {
                  fileConfig.path = `car_images_${aws_folder}/${hit._source['carId']}`;
                  fileConfig.image_name = hit._source['car_image'];
                  carImage = await this.general.getFile(fileConfig, inputParams);
                }

                return {
                  ...hit._source,
                  carSlug: hit._source['car_slug'],
                  added_date: this.timeAgo(hit._source['added_date']),
                  addedDate: this.timeAgo(hit._source['added_date']),
                  raw_price : hit._source["price"],
                  price: this.general.numberFormat(
                    hit._source['price'],
                    'currency',
                    'AED',
                  ),
                  currency_code: currency_code,
                  carImage,
                  drivenDistance:
                    this.general.numberFormat(
                      hit._source['drivenDistance'],
                      'numerical',
                    ),
                  distanceSuffix: 'km',
                  isWishlist: hit._source['is_wishlist']
                };
              })
            );
            return { [element]: processedCars };
          })
        )
        : Object.assign(
          {},
          ...(await Promise.all(
            results['group_by_car_tag'].buckets.map(async (key) => {
              const cars = await Promise.all(
                key.cars.hits.hits.map(async (hit) => {
                  const { _source } = hit;

                  _source['is_wishlist'] = 'No';

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
                          where: { carId: _source['carId'], userId: user.entityId}
                        });

                        _source['is_wishlist'] = wishlist_data ? 'Yes' : 'No';
                      }
                    }
                  }

                  let carImage = '';

                  if (_source['car_image']) {
                    fileConfig.path = `car_images_${aws_folder}/${hit._source['carId']}`;
                    fileConfig.image_name = _source['car_image'];
                    carImage = await this.general.getFile(fileConfig, inputParams);
                  }

                  return {
                    ..._source,
                    added_date: this.timeAgo(_source['added_date']),
                    addedDate: this.timeAgo(_source['added_date']),
                    carSlug: _source['car_slug'],
                     raw_price : hit._source["price"],
                    price: this.general.numberFormat(
                      _source['price'],
                      'currency',
                      'AED',
                    ),
                    currency_code: currency_code,
                    carImage,
                    drivenDistance:
                      this.general.numberFormat(
                        _source['drivenDistance'],
                        'numerical',
                      ),
                    distanceSuffix: 'km',
                    isWishlist: _source['is_wishlist']
                  };
                }),
              );

              if (key.key === 'trending_cars') {
                const groupedByBodyType = cars.reduce((acc, car) => {
                  const bodyType = car.body_code || 'Unknown';
                  acc[bodyType] = acc[bodyType] || [];
                  acc[bodyType].push(car);
                  return acc;
                }, {} as Record<string, any[]>);

                return { trending_cars: groupedByBodyType };
              }
              return { [key.key]: cars.slice(0, 6) };
            }),
          )),
        );
      if (data.length > 0) {
        let finalResult = Object.assign({}, ...data);
        const output = Object.keys(finalResult).length === 1
          ? Object.values(finalResult)[0]
          : finalResult;
        data = output
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
      console.log(err)
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.car_slide = this.blockResult.data;
    return inputParams;
  }

  carSlideFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('car slide list found.'),
      fields: [],
    };
    const outputKeys = ['car_slide'];
    settingFields.fields = [
      'tagName',
      'carName',
      'price',
      'drivenDistance',
      'carSlug',
      'fuelType',
      'transmissionType',
      'bodyType',
      'addedDate',
      'carImage',
      'carId',
      'body_code',
      'currency_code',
      'analytics',
      'isWishlist',
      'distanceSuffix',
      'status',
      "display_title",
      "raw_price"
    ];
    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'car_slide';

    funcData.output_keys = outputKeys;
    funcData.multiple_keys = this.multipleKeys;
    return this.response.outputResponse(outputData, funcData);
  }
  carSlideFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('car slide list not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_slide',
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

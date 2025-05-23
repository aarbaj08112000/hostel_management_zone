require('dotenv').config();
interface AuthObject {
  user: any;
}
const CUSTOMER_URL = process.env.CUSTOMER_URL || '127.0.0.1';
const CUSTOMER_PORT = parseInt(process.env.CUSTOMER_PORT || '6002', 10);

const USER_URL = process.env.USER_URL || '127.0.0.1';
const USER_PORT = parseInt(process.env.USER_PORT || '6005', 10);

const MASTER_URL = process.env.MASTER_URL || '127.0.0.1';
const MASTER_PORT = parseInt(process.env.MASTER_PORT || '6003', 10);

const TRANSACTION_URL = process.env.TRANSACTION_URL || '127.0.0.1';
const TRANSACTION_PORT = parseInt(process.env.TRANSACTION_PORT || '6004', 10);

import { Inject, Injectable} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {BlockResultDto,SettingsParamsDto,} from '@repo/source/common/dto/common.dto';
import { ElasticService } from '@repo/source/services/elastic.service';
import { Client,ClientTCP} from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { firstValueFrom } from 'rxjs';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { CarEntity } from '../entities/cars.entity';
import * as custom from '@repo/source/utilities/custom-helper';
import { forEach } from 'mathjs';
import { sub } from 'date-fns';
type LookupFieldConfig = {
  field: string;
  subType?: string;
  selFields?: Record<string, string>;
  fetch_from? : string,
  sub_field? : string;
};
@Injectable()
export class CarMicroserviceService {
  protected readonly log = new LoggerHandler(CarMicroserviceService.name).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @InjectDataSource() protected dataSource: DataSource;
  @InjectRepository(LookupEntity) protected lookupEntityRepo: Repository<LookupEntity>;
  @InjectRepository(CarEntity) protected carEntityRepo: Repository<CarEntity>;

  constructor(protected readonly elasticService: ElasticService) {
  }

  @Client({ transport: Transport.TCP, options: { port: CUSTOMER_PORT , host : CUSTOMER_URL} }) public customerClient: ClientTCP;
  @Client({ transport: Transport.TCP, options: { port: MASTER_PORT , host : MASTER_URL} }) public masterClient: ClientTCP;
  @Client({ transport: Transport.TCP, options: { port: USER_PORT , host : USER_URL } }) public userClient: ClientTCP;
  @Client({ transport: Transport.TCP, options: { port: TRANSACTION_PORT  , host : TRANSACTION_URL} }) public tranClient: ClientTCP;
  private lookup_mapping: Record<string, LookupFieldConfig[]> = {
    customer : [
      {field : 'customer_id' , subType : 'customer' , selFields : {id : 'id' , firstName : 'first_name' , middleName : 'middle_name', 'lastName' : 'last_name' ,email : 'email',phoneNumber:'phoneNumber'}},
      {field : 'phone' , subType : 'customer' ,fetch_from : "phoneNumber",selFields : {id : 'id' , firstName : 'first_name' , middleName : 'middle_name', 'lastName' : 'last_name' ,email : 'email',phoneNumber:'phoneNumber'}}
    ],
    user: [
      { field: 'added_by', subType: 'user', selFields: { id: 'id', name: 'name', email: 'email', dialCode: 'dial_code', phoneNumber: 'phone_number' } },
      { field: 'updated_by', subType: 'user', selFields: { id: 'id', name: 'name', email: 'email' } },
      { field: 'contact_person_id', subType: 'user', selFields: { id: 'id', name: 'name', email: 'email', dialCode: 'dial_code', phoneNumber: 'phone_number' } },
    ],
    master: [
      {
        field: 'exterior_colorId', subType: 'color', selFields: {
          colorId: 'id', colorName: 'color_name', colorCode: 'color_code'
        }
      },
      {
        field: 'interior_colorId', subType: 'color', selFields: {
          colorId: 'id', colorName: 'color_name', colorCode: 'color_code'
        }
      },
      {
        field: 'tag_ids', subType: 'tag', selFields: {
          tagId: 'tag_id', tagName: 'tag_name', tagCode: 'tag_code' , isTrending : 'is_trending'
        }
      },
      {
        field: 'feature_id', subType: 'feature', selFields: {
          featureId: 'feature_id', featureName: 'feature_name', featureCode: 'feature_code',
          featureType: 'feature_type', featureValues: 'feature_values', featureCategoryId: 'feature_category_id'
        }
      },
      {
        field: 'insurance_provider_id', subType: 'insurance', selFields: {
          insuranceProviderId: 'insurance_provider_id', providerName: 'provider_name', providerCode: 'provider_code'
        }
      },
      {
        field: 'regional_specsId', subType: 'regional', selFields: {
          regionalSpecsId: 'region_id', regionName: 'region_name', regionCode: 'region_code'
        }
      },
      {
        field: 'country_id', subType: 'country', selFields: {
          id: 'mc_id', country: 'country', countryCode: 'country_code',
        }
      },
      {
        field: 'location_id', subType: 'location', selFields: {
          locationId: 'location_id', locationName: 'location_name', locationCode: 'location_code',
          latitude: 'latitude', longitude: 'longitude', address: 'address',openTime : 'open_time' , closeTime : 'close_time' , zipCode : 'zipCode'
        }
      },
      {
        field: 'state_id', subType: 'state', selFields: {
          id: 'ms_id', state: 'country', stateCode: 'country_code',
        }
      },
      {
        field: 'feature_ids', subType: 'feature', selFields: {
          featureCategoryId: 'featureCategoryId', featureCategoryCode: 'featureCategoryCode', featureCategoryName: 'featureCategoryName',
          featureName: 'featureName', featureId: 'featureId', featureCode: 'featureCode',featureValue: 'featureValue'
        }
      },
      {
        field: 'car_services', subType: 'services', sub_field : 'service_id' ,selFields: {
          serviceId: 'serviceId', serviceName: 'serviceName', price: 'price' , type: 'type', description : 'description'
        }
      },
      {
        field: 'car_charges', subType: 'charges', sub_field : 'charge_id' ,selFields: {
          id: 'id', chargeName: 'chargeName', chargeFor: 'chargeFor',type : 'type',value : 'value',isOptional : 'isOptional' , description : 'description'
        }
      }
    ],
  };  
  private tableFieldLookup: Record<string,Record<string,
    {
      actualField: string;
      subType: string;
      type? : string;
      selFields: Record<string, string>;
      fetch_from?: string;
    }>> = {
  car_tags : {
    tag_ids : {
      actualField: 'tagId',
      subType: 'tag',
      type : 'master',
      selFields: {
        tagId: 'tag_id', tagName: 'tag_name', tagCode: 'tag_code'
      },
    }
  },
  cars: {
    contact_person_id: {
      actualField: 'contactPersonId',
      subType: 'user',
      type : 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
    location_id: {
      actualField: 'locationId',
      subType: 'location',
      type : 'master',
      selFields: {
        locationId: 'location_id',
        locationName: 'location_name',
        locationCode: 'location_code',
        latitude: 'latitude',
        longitude: 'longitude',
        address: 'address',
      },
    },
    added_by: {
      actualField: 'addedBy',
      subType: 'user',
      type : 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
    updated_by: {
      actualField: 'updatedBy',
      subType: 'user',
      type : 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
  },
  cars_details: {
    exterior_colorId: {
      actualField: 'exteriorColorId',
      subType: 'color',
      type : 'master',
      selFields: {
        colorId: 'id',
        colorName: 'color_name',
        colorCode: 'color_code',
      },
    },
    interior_colorId: {
      actualField: 'interiorColorId',
      subType: 'color',
      type : 'master',
      selFields: {
        colorId: 'id',
        colorName: 'color_name',
        colorCode: 'color_code',
      },
    },
    regional_specsId: {
      actualField: 'regionalSpecsId',
      subType: 'regional',
      type : 'master',
      selFields: {
        regionalSpecsId: 'region_id',
        regionName: 'region_name',
        regionCode: 'region_code',
      },
    },
    added_by: {
      actualField: 'addedBy',
      type : 'user',
      subType: 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
    updated_by: {
      actualField: 'updatedBy',
      type : 'user',
      subType: 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
  },
  car_feature: {
    feature_id: {
      actualField: 'featureId',
      subType: 'feature',
      type : 'master',
      selFields: {
        featureId: 'feature_id',
        featureName: 'feature_name',
        featureCode: 'feature_code',
        featureType: 'feature_type',
        featureValues: 'feature_values',
        featureCategoryId: 'feature_category_id',
      },
    },
    added_by: {
      actualField: 'addedBy',
      subType: 'user',
      type : 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
    updated_by: {
      actualField: 'updatedBy',
      subType: 'user',
      type : 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
  },
  car_history: {
    insurance_provider_id: {
      actualField: 'insuranceProvideId',
      subType: 'insurance',
      type : 'master',
      selFields: {
        insuranceProviderId: 'insurance_provider_id',
        providerName: 'provider_name',
        providerCode: 'provider_code',
      },
    },
    added_by: {
      actualField: 'addedBy',
      subType: 'user',
      type : 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
    updated_by: {
      actualField: 'updatedBy',
      subType: 'user',
      type : 'user',
      selFields: { id: 'id', name: 'name', email: 'email' },
    },
  },
  car_wishlist: {
    customer_id: {
      actualField: 'userId', 
      subType: 'customer',
      type : 'customer',
      selFields: {
        id: 'id',
        firstName: 'first_name',
        middleName: 'middle_name',
        lastName: 'last_name',
        email: 'email',
        phoneNumber: 'phoneNumber',
      },
    },
  },
};
  private clients = [
    { code: 'customer', instance: () => this.customerClient, pattern: 'get-data' },
    { code: 'master', instance: () => this.masterClient, pattern: 'get-data' },
    { code: 'user', instance: () => this.userClient, pattern: 'get-data' },
    { code: 'transaction', instance: () => this.tranClient, pattern: 'get-data' },
  ];
  async onModuleInit() {
    // for (const { code, instance } of this.clients) {
    //   await this.connectWithRetry(code, instance());
    // }
  }
  private async connectWithRetry(name: string, client: ClientTCP, retries = 5) {
    while (retries) {
      try {
        await client.connect();
        console.log(`${name} Client connected successfully!`);
        break;
      } catch (error) {
        console.error(`Failed to connect ${name} Client, retrying...`, error);
        if (--retries === 0) {
          console.error(`Failed to connect ${name} Client after multiple retries`);
        }
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }
  async sendAndStoreData(payload: any, entityType: string, subType?: string) {
    const clientConfig = this.clients.find(c => c.code === entityType);
    if (!clientConfig) {
      return { success: 0, message: `No client configured for entity type: ${entityType}`, data: [] };
    }
    const client = clientConfig.instance();
    const pattern = clientConfig.pattern;
    if (!client['isConnected']) {
      await client.connect();
    }
  
    if (subType) {
      const config = this.lookup_mapping[entityType]?.find(item => item.subType === subType);
      if (config) {
        payload = { id: payload.id, type: subType, selFields: config.selFields, delete: payload.delete };
        entityType = subType;
      }
    }
  
    try {
      const entityId = payload.id;
      if (payload.delete === true) {
        const deleteResult = await this.lookupEntityRepo.delete({ entityId, entityName: payload.type });
        return {
          success: 1,
          message: deleteResult.affected ? 'Record deleted.' : 'No record found to delete.',
          data: { affected_rows: deleteResult.affected },
        };
      }
      const response = await firstValueFrom(client.send(pattern, payload));
  
      if (('success' in response && response.success !== 1) ||
          (!('success' in response) && response?.settings?.success !== 1)) {
        return response;
      }
  
      const existedData = await this.fetchExistingData(entityType, entityId);
      const queryColumns = {
        entityId : payload.fetch_from ? response.entityId : entityId,
        entityName: payload.type,
        entityJson: response.data,
        remarks: response.message,
      };
  
      if (!_.isEmpty(existedData)) {
        const lookupid = existedData.lookupid
        const result = await this.lookupEntityRepo.update({ lookupid }, queryColumns);
        return {
          success: 1,
          message: 'Record updated.',
          data: { affected_rows: result.affected },
        };
      } else {
        const result = await this.lookupEntityRepo.insert(queryColumns);
        return {
          success: 1,
          message: 'Record inserted.',
          data: { insert_id: result.raw.insertId },
        };
      }
    } catch (err) {
      console.error('Error in sendAndStoreData:', err);
      return {
        success: 0,
        message: err.message || 'Internal error',
        data: [],
      };
    }
  }
  async processLookupDataFromBody(body: any) {
    try{
     
      const sections = ['car_data', 'car_details', 'car_history', 'car_tags'];

      for (const [entityType, fieldConfigs] of Object.entries(this.lookup_mapping)) {
        for (const { field, subType, fetch_from , selFields , sub_field } of fieldConfigs) {
          let rawValue: any = null;
  
          rawValue = body?.[field];
          if(!rawValue){
            for (const section of sections) {
              rawValue = body?.[section]?.[field];
              if (rawValue) break;
            }
          }
          if (!rawValue) continue;
  
          const entityIds = Array.isArray(rawValue)
            ? rawValue
            : typeof rawValue === 'object'
              ? [rawValue]
              : [{ id: rawValue }];
              for (const item of entityIds) {
                let id

                if (sub_field && typeof item === 'object' && sub_field in item) {
                  id = item[sub_field];
                }
                else if (subType === 'feature' && typeof item === 'object' && 'feature_id' in item) {
                  id = item.feature_id;
                } else {
                  id = typeof item === 'object' ? item.id : item;
                }
                if(id != '' && typeof id != 'undefined' && id != null && id > 0){
                  const existingData = await this.fetchExistingData(subType, id , fetch_from);
                
                  if (_.isEmpty(existingData)) {
                    const payload = { id, ...(subType && { type: subType }), selFields ,fetch_from};
                    console.log(payload)
                    const result = await this.sendAndStoreData(payload, entityType);
                    console.log(`Processed entity [${entityType}] (subType: ${subType || 'N/A'}) with ID ${id}:`, result.message);
                  }
                }
              }
        }
      }
    }catch(err){
      console.log(err)
    }
  }
  async fetchExistingData(type: string, master_id: any, fetch_from?: string) {
    const qb = this.lookupEntityRepo
      .createQueryBuilder('lookup')
      .where('lookup.entityName = :entityName', { entityName: type });
  
    if (fetch_from) {
      qb.andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(lookup.entityJson, :jsonPath)) = :masterId`,
        {
          jsonPath: `$.${fetch_from}`,
          masterId: String(master_id), 
        }
      );
    } else {
      qb.andWhere('lookup.entityId = :masterId', { masterId: master_id });
    }
  
    return await qb.getOne();
  }
  async getData(inputParams: any) {
    let repoObject = {
      "car": { entity: this.carEntityRepo, alias: 'c', where: inputParams.fetch_from ? `c.${inputParams.fetch_from} = :id` :  'c.carId = :id' }
      }
    let currentRepo = repoObject[inputParams['type']];
    this.blockResult = {};
    try {
      let selFields = inputParams['selFields']
      const queryObject = currentRepo.entity.createQueryBuilder(currentRepo.alias);
      // await this.general.applyDynamicSelectsFromLookup(queryObject, selFields, currentRepo.alias);
      switch(inputParams['type']){
        case 'car' : 
        queryObject
        .select([
          'c.carId as carId',
          'c.carName as name',
          'c.slug as slug',
          'c.carImage as carImage',
          'c.price as price',
          'c.locationId as locationId',
          'c.contactPersonId as contactPersonId',
          'cd.manufactureYear as manufactureYear',
          'cd.drivenDistance as drivenDistance',
          'cd.fuelType as fuelType',
          'cd.transmissionType as transmissionType',
        ])
        .leftJoin('cars_details', 'cd', 'c.carId = cd.carId')
        break;
        default:
          await this.general.applyDynamicSelectsFromLookup(queryObject, selFields, currentRepo.alias);
        break;
      }
      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere(currentRepo.where, { id: inputParams.id });
      }
      const data: any = await queryObject.getRawOne();
      if (!_.isObject(data) || _.isEmpty(data)) {
        throw new Error('No records found.');
      }
      const success = 1;
      const message = 'Records found.';

      let queryResult : any  = {
        success,
        message,
        data,
      };
      if('fetch_from' in inputParams){
        queryResult = {...queryResult ,entityId : data.carId}
      }
      this.blockResult = queryResult;
    } catch (err) {
      console.log(err)
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }

    return this.blockResult;
  }
  async sendData(inputParams: any) {

    let set_delete = false;
    if ('mode' in inputParams && inputParams.mode === 'delete') {
      set_delete = true;
    }
    inputParams.data = {...inputParams.data , id : inputParams.id}
    const payload = {
      id: inputParams.id,
      entity: inputParams.module,
      masterModule: 'car',
      delete: set_delete,
      data : inputParams.data
    };
    for (const clientConfig of this.clients) {
      const clientInstance = clientConfig.instance();
      const pattern = clientConfig.pattern;
  
      if (clientInstance && typeof clientInstance.emit === 'function') {
        clientInstance.emit('set-data', payload);
      } else {
        console.warn(`Client for ${clientConfig.code} is not initialized correctly.`);
      }
    }
  }
  async setData(inputParams : any){
    {
      let entityType = inputParams.masterModule;
      const config = this.lookup_mapping[entityType]?.find(item => item.subType === inputParams.entity);
      try {
        const entityId = inputParams.id;
        if (inputParams.delete === true) {
          const deleteResult = await this.lookupEntityRepo.delete({ entityId, entityName: inputParams.entity });
          return {
            success: 1,
            message: deleteResult.affected ? 'Record delete emaild.' : 'No record found to delete.',
            data: { affected_rows: deleteResult.affected },
          };
        }
        let set_data : any = {}
        for(const [key,value] of Object.entries(config.selFields)){
          if(value in inputParams.data){
            set_data[value] = inputParams.data[value]
          }
        }
        const existedData = await this.fetchExistingData(inputParams.entity, entityId);
        const queryColumns = {
          entityId,
          entityName: inputParams.entity,
          entityJson: set_data,
          remarks: '',
        };
        if (!_.isEmpty(existedData)) {
          for (const key in existedData.entityJson) {
            if (!queryColumns.entityJson.hasOwnProperty(key)) {
              queryColumns.entityJson[key] = existedData.entityJson[key];
            }
          }
          const lookupid = existedData.lookupid
          const result = await this.lookupEntityRepo.update({ lookupid }, queryColumns);
          return {
            success: 1,
            message: 'Record updated.',
            data: { affected_rows: result.affected },
          };
        } else {
          const result = await this.lookupEntityRepo.insert(queryColumns);
          return {
            success: 1,
            message: 'Record inserted.',
            data: { insert_id: result.raw.insertId },
          };
        }
      }catch(err){
        console.log(err)
      } 
    }
  }
  async firstTimeSyncLookup() {
    const tableToRepo: Record<string, Repository<any>> = {
      cars: this.carEntityRepo,
      cars_details: this.dataSource.getRepository('cars_details'),
      car_feature: this.dataSource.getRepository('car_feature'),
      car_history: this.dataSource.getRepository('car_history'),
      car_wishlist: this.dataSource.getRepository('car_wishlist'),
      car_tags: this.dataSource.getRepository('car_tags'),
    };
  
    for (const [table, fields] of Object.entries(this.tableFieldLookup)) {
      const repo = tableToRepo[table];
      if (!repo) {
        this.log.warn(`No repository found for table: ${table}`);
        continue;
      }
  
      for (const [logicalField, config] of Object.entries(fields)) {
        const { actualField, subType, selFields, fetch_from } = config;
  
        const alias = 't';
        let rows: { id: any }[];
  
        try {
          rows = await repo
            .createQueryBuilder(alias)
            .select(`DISTINCT ${alias}.${actualField}`, 'id')
            .where(`${alias}.${actualField} IS NOT NULL`)
            .getRawMany();
        } catch (error) {
          this.log.error(`Error querying ${table}.${actualField}: ${error}`);
          continue;
        }
  
        this.log.log(`Processing ${rows.length} values for ${actualField} in ${table}`);
  
        for (const row of rows) {
          const id = row.id;
  
          try {
            const existing = await this.fetchExistingData(subType, id, fetch_from);
            if (!existing) {
              const payload = {
                id,
                type: subType,
                selFields,
                fetch_from,
              };
              const result = await this.sendAndStoreData(
                payload,
                this.getClientTypeForSubType(subType)
              );
  
              this.log.log(`Synced ${subType} [ID=${id}]: ${result.message}`);
            }
          } catch (err) {
            this.log.error(`Failed to sync ${subType} [ID=${id}]: ${err.message}`);
          }
        }
      }
    }
    return {
      message : 'Processing done'
    }
  }
  private getClientTypeForSubType(subType: string): string {
    for (const [entityType, fields] of Object.entries(this.tableFieldLookup)) {
      for (const fieldConfig of Object.values(fields)) {
        if (fieldConfig.subType === subType) {
          return fieldConfig.type
        }
      }
    }
    return '';
  }  
  
} 
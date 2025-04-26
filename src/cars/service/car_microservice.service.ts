interface AuthObject {
  user: any;
}
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
type LookupFieldConfig = {
  field: string;
  subType?: string;
  selFields?: Record<string, string>;
  fetch_from? : string
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
  constructor(protected readonly elasticService: ElasticService) {}

  @Client({ transport: Transport.TCP, options: { port: 6002 } }) public customerClient: ClientTCP;
  @Client({ transport: Transport.TCP, options: { port: 6003 } }) public masterClient: ClientTCP;
  @Client({ transport: Transport.TCP, options: { port: 6005 } }) public userClient: ClientTCP;

  private lookup_mapping: Record<string, LookupFieldConfig[]> = {
    customer : [
      {field : 'customer_id' , subType : 'customer' , selFields : {id : 'id' , firstName : 'first_name' , middleName : 'middle_name', 'lastName' : 'last_name' ,email : 'email',phoneNumber:'phoneNumber'}},
      {field : 'phone' , subType : 'customer' ,fetch_from : "phoneNumber",selFields : {id : 'id' , firstName : 'first_name' , middleName : 'middle_name', 'lastName' : 'last_name' ,email : 'email',phoneNumber:'phoneNumber'}}
    ],
    user: [
      { field: 'added_by', subType: 'user', selFields: { id: 'id', name: 'name', email: 'email' } },
      { field: 'updated_by', subType: 'user', selFields: { id: 'id', name: 'name', email: 'email' } },
      { field: 'contact_person_id', subType: 'user', selFields: { id: 'id', name: 'name', email: 'email' } },
    ],
    location: [
      {
        field: 'country_id', subType: 'country', selFields: {
          id: 'mc_id', country: 'country', countryCode: 'country_code',
        }
      },
      {
        field: 'location_id', subType: 'location', selFields: {
          locationId: 'location_id', locationName: 'location_name', locationCode: 'location_code',
          latitude: 'latitude', longitude: 'longitude', address: 'address',
        }
      },
      {
        field: 'state_id', subType: 'state', selFields: {
          id: 'ms_id', state: 'country', stateCode: 'country_code',
        }
      }
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
          tagId: 'tag_id', tagName: 'tag_name', tagCode: 'tag_code'
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
          latitude: 'latitude', longitude: 'longitude', address: 'address',
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
      }
    ],
  };

  private clients = [
    { code: 'customer', instance: () => this.customerClient, pattern: 'get-data' },
    { code: 'master', instance: () => this.masterClient, pattern: 'get-data' },
    { code: 'user', instance: () => this.userClient, pattern: 'get-data' },
  ];

  async onModuleInit() {
    for (const { code, instance } of this.clients) {
      await this.connectWithRetry(code, instance());
    }
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
        entityId,
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
        for (const { field, subType, fetch_from , selFields } of fieldConfigs) {
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
                if (subType === 'feature' && typeof item === 'object' && 'feature_id' in item) {
                  id = item.feature_id;
                } else {
                  id = typeof item === 'object' ? item.id : item;
                }
              
                const existingData = await this.fetchExistingData(subType, id , fetch_from);
                
                if (_.isEmpty(existingData)) {
                  const payload = { id, ...(subType && { type: subType }), selFields };
                  console.log(payload)
                  const result = await this.sendAndStoreData(payload, entityType);
                  console.log(`Processed entity [${entityType}] (subType: ${subType || 'N/A'}) with ID ${id}:`, result.message);
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
      await this.general.applyDynamicSelectsFromLookup(queryObject, selFields, currentRepo.alias);
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
            message: deleteResult.affected ? 'Record deleteemaild.' : 'No record found to delete.',
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
} 
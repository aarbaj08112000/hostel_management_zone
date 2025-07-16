import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { CarServicesEntity } from '../entities/car_services.entity';
import { CarEntity } from '../entities/cars.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
import { ElasticService } from '@repo/source/services/elastic.service';
interface AuthObject {
  user: any;
}

@Injectable()
export class CarServicesAdd extends BaseService {
  protected readonly log = new LoggerHandler(CarServicesAdd.name).getInstance();
  protected inputParams: any = {};
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject()
  protected readonly response: ResponseLibrary;

  @Inject()
  protected elasticService : ElasticService

  @Inject()
  protected readonly general: CitGeneralLibrary;

  @InjectRepository(CarServicesEntity)
  protected carServicesRepo: Repository<CarServicesEntity>;

  @InjectRepository(CarEntity)
  protected carEntity: Repository<CarEntity>;

  constructor() {
    super();
    this.moduleName = 'car_services';
    this.moduleAPI = '';
  }

  async startCarServicesAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams;
      
      let no_insert = false;
      let existed_services_data = await this.fetchCarServicesData(reqParams);
      inputParams = {...inputParams,car_id : reqParams.car_id}
      if (existed_services_data.success === 0) {
           inputParams = await this.insertCarServicesData(reqParams);
      }else{
        const existingData = existed_services_data.data;
        const updates = [];
        const inserts = [];

        const existingMap = new Map();
        if(Array.isArray(existingData)){
           existingData.forEach(item => 
            existingMap.set(item.serviceId, item)
          );
        }
        reqParams.car_services.forEach(param => {
          const existing = existingMap.get(param.service_id);
          const formattedRate = parseFloat(param.rate_value).toFixed(2);

          if (existing) {
            updates.push({
              ...param,
              rate_value: formattedRate,
              car_services_id: existing.carServiceId,
            });
          } else {
            inserts.push({
              ...param,
              rate_value: formattedRate,
            });
          }
        });

        if (inserts.length > 0) {
          reqParams.car_services = inserts;
          inputParams = await this.insertCarServicesData(reqParams);
        }else{
          no_insert = true
         }
        if (updates.length > 0) {
         let updated_data = await this.updateCarServicesData({ car_services: updates });
          if(no_insert){
            inputParams = {...inputParams,insert_car_services_data:updated_data}
          }
        }
      }

      if (!_.isEmpty(inputParams.insert_car_services_data)) {
        outputResponse = await this.carServicesFinishSuccess(inputParams, 'Car Services Added Successfully.');
      } else {
        outputResponse = await this.carServicesFinishFailure(inputParams);
      }
    } catch (err) {
      console.log(err)
      this.log.error('API Error >> car_services_add >>', err);
    }
    return outputResponse;
  }

  async startCarServicesUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');

      const inputParams = await this.updateCarServicesData(reqParams);

      if (!_.isEmpty(inputParams.update_car_services_data)) {
        outputResponse = this.carServicesFinishSuccess(inputParams, 'Car Services Updated Successfully.');
      } else {
        outputResponse = this.carServicesFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_services_update >>', err);
    }
    return outputResponse;
  }

  async deleteCarService(id: number) {
    let outputResponse = {};
    try {
      this.setModuleAPI('delete');
      let service_data = await this.carServicesRepo.findOne({
        where: { carServiceId: id },
     })
      const deleteResult = await this.carServicesRepo.delete({ carServiceId: id });

      if(service_data != null){
        let allChargesData = await this.carServicesRepo.find({
          where : {carId : service_data?.carId}
        })
        if(allChargesData.length <= 0){
           await this.elasticService.deleteDocument('nest_local_car_services_details',service_data?.carId.toString() )
        }
     }

      if (deleteResult.affected === 0) {
        return this.carServicesFinishFailure({ message: 'No Car Service found.' });
      }
      let job_data = {
        job_function: 'sync_elastic_data',
        job_params: {
          module: 'car_services_details',
          data: service_data.carId
        },
      };
      await this.general.submitGearmanJob(job_data);
      outputResponse = this.carServicesFinishSuccess({ deleted_id: id }, 'Car Service Deleted Successfully.');
    } catch (err) {
      this.log.error('API Error >> car_services_delete >>', err);
    }
    return outputResponse;
  }

  async insertCarServicesData(inputParams: any) {
    const records = Array.isArray(inputParams.car_services) ? inputParams.car_services : [inputParams.car_services];
    const insertedData = [];

    try {
      for (const record of records) {
        const insertData: Partial<CarServicesEntity> = {
          carId: inputParams.car_id,
          serviceId: record.service_id,
          rateValue: record.rate_value,
          isOptional : record.is_optional,
          addedBy: record.added_by,
        };
        const res = await this.carServicesRepo.insert(insertData);
        const insertId = res.identifiers?.[0]?.carServiceId || res.raw?.insertId;

        insertedData.push({ ...record, insert_id: insertId });
      }

      inputParams.insert_car_services_data = insertedData;
    } catch (err) {
      inputParams.message = err.message;
      this.log.error('Insert Error >>', err);
    }

    return inputParams;
  }

  async updateCarServicesData(inputParams: any) {
    const records = Array.isArray(inputParams.car_services) ? inputParams.car_services : [inputParams.car_services];
    const updatedData = [];

    try {
      for (const record of records) {
        const updateData: Partial<CarServicesEntity> = {
          carId: record.car_id,
          serviceId: record.service_id,
          rateValue: record.rate_value,
          isOptional : record.is_optional,
          updatedBy: record.updated_by,
        };

        const res = await this.carServicesRepo.update(
          { carServiceId: record.car_services_id },
          updateData
        );

        updatedData.push({
          car_services_id: record.car_services_id,
          affected_rows: res.affected,
        });
      }

      inputParams.update_car_services_data = updatedData;
    } catch (err) {
      inputParams.message = err.message;
      this.log.error('Update Error >>', err);
    }

    return inputParams;
  }

  async fetchCarServicesData(inputParams: any) {
    try {
      const existed_car_data = await this.carEntity.findOne({
        where: { carId: inputParams.car_id },
      });
      if (!existed_car_data) {
        return { success: 0, message: 'Invalid car id', data: {} };
      }

      const existed_services_data = await this.carServicesRepo.find({
        where: { carId: inputParams.car_id },
      });

      return { success: existed_services_data.length > 0 ? 1 : 0 , data: existed_services_data, message: 'data found' };
    } catch (err) {
      inputParams.message = err.message;
      throw new Error(err);
    }
  }

  async carServicesFinishSuccess(inputParams: any, message: string) {
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_services_details',
        data: inputParams.car_id
      },
    };
    await this.general.submitGearmanJob(job_data);
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_car_services_data', 'update_car_services_data'],
        },
        data: inputParams,
      },
      { name: 'car_services' }
    );
  }

  async carServicesFinishFailure(inputParams: any) {
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: inputParams.message ?? custom.lang('Something went wrong, Please try again.'),
          fields: [],
        },
        data: inputParams,
      },
      { name: 'car_services' }
    );
  }
  async startCarServiceDetails(id) {
    let outputResponse = {};

    try {
      this.setModuleAPI('fetch');
      outputResponse = await this.getServiceDetails(id);
    } catch (err) {
      this.log.error('API Error >> services_details >>', err);
    }
    return outputResponse;
  }

  async getServiceDetails(id) {
    try {
      const data = await this.elasticService.getById(
        id,
        'nest_local_car_services_details',
        'id',
      );
      if (!data) {
        return { success: 0, message: 'No Services found.' };
      }

      return { status: 200, success: 1, message: 'Car Services Details Retrieved Successfully.', data };
    } catch (err) {
      return { status: 200, success: 0, message: err.message };
    }
  }
}

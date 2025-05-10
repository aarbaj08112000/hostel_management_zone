import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { CarChargesEntity } from '../entities/car_charges.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
import { CarEntity } from '../entities/cars.entity';
interface AuthObject {
  user: any;
}
import { ElasticService } from '@repo/source/services/elastic.service';
@Injectable()
export class CarChargesService extends BaseService {
  protected readonly log = new LoggerHandler(CarChargesService.name).getInstance();
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

  @InjectRepository(CarChargesEntity)
  protected carChargesRepo: Repository<CarChargesEntity>;

  @InjectRepository(CarEntity)
  protected carEntity : Repository<CarEntity>
  constructor() {
    super();
    this.moduleName = 'car_charges';
    this.moduleAPI = '';
  }

  async startCarChargesAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add'); 
      let inputParams;
      let no_insert = false;
      let existed_charges_data = await this.fetchCarChargesData(reqParams);
      if(existed_charges_data.success == 0){
       inputParams = await this.insertCarChargesData(reqParams);
      }else{
        if(Object(existed_charges_data.data).length > 0){
          let existingData = existed_charges_data.data
          const updates = [];
          const inserts = [];

          const existingMap = new Map();
          if(Array.isArray(existingData)){
            existingData.forEach(item => {
              existingMap.set(item.chargeId, item);
            });
          }
          reqParams.car_charges.forEach(param => {
            const existing = existingMap.get(param.charge_id);
            const formattedRate = parseFloat(param.rate_value).toFixed(2);

            if (existing) {
                updates.push({
                  ...param,
                  rate_value: formattedRate,
                  car_charges_id: existing.carChargesId
                });
            } else {
              inserts.push({
                ...param,
                rate_value: formattedRate
              });
            }
          });
           if(inserts.length > 0){
              reqParams.car_charges = inserts;
              inputParams = await this.insertCarChargesData(reqParams);
           }else{
              no_insert = true
           }
           
           if(updates.length > 0){
                let updated_data = await this.updateCarChargesData({car_charges : updates})
             if(no_insert){
                inputParams = {...inputParams,insert_car_charges_data:updated_data}
             }
           }
        }
      }
      if (!_.isEmpty(inputParams.insert_car_charges_data)) {
        outputResponse = this.carChargesFinishSuccess(inputParams, 'Car Charges Added Successfully.');
      } else {
        outputResponse = this.carChargesFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_charges_add >>', err);
    }
    return outputResponse;
  }

  async startCarChargesUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');

      const inputParams = await this.updateCarChargesData(reqParams);

      if (!_.isEmpty(inputParams.update_car_charges_data)) {
        outputResponse = this.carChargesFinishSuccess(inputParams, 'Car Charges Updated Successfully.');
      } else {
        outputResponse = this.carChargesFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_charges_update >>', err);
    }
    return outputResponse;
  }

  async deleteCarCharges(id: number) {
    let outputResponse = {};
    try {
      this.setModuleAPI('delete');

      const deleteResult = await this.carChargesRepo.delete({ carChargesId: id });

      if (deleteResult.affected === 0) {
        return this.carChargesFinishFailure({ message: 'No Car Charge found.' });
      }

      outputResponse = this.carChargesFinishSuccess(
        { deleted_id: id },
        'Car Charge Deleted Successfully.'
      );
    } catch (err) {
      this.log.error('API Error >> car_charges_delete >>', err);
    }
    return outputResponse;
  }

  async insertCarChargesData(inputParams: any) {
    console.log('here',inputParams)
    const records = Array.isArray(inputParams.car_charges) ? inputParams.car_charges : [inputParams.car_charges];
    const insertedData = [];
    
    try {
      for (const record of records) {
        const insertData: Partial<CarChargesEntity> = {
          carId: inputParams.car_id,
          chargeId: record.charge_id,
          rateValue: record.rate_value,
          addedBy: record.added_by,
        };
        const res = await this.carChargesRepo.insert(insertData);
        const insertId = res.identifiers?.[0]?.carChargesIdPrimary || res.raw?.insertId;

        insertedData.push({ ...record, insert_id: insertId });
      }

      inputParams.insert_car_charges_data = insertedData;
    } catch (err) {
      inputParams.message = err.message
      this.log.error('Insert Error >>', err);
    }

    return inputParams;
  }

  async updateCarChargesData(inputParams: any) {
    const records = Array.isArray(inputParams.car_charges) ? inputParams.car_charges : [inputParams.car_charges];
    const updatedData = [];
    try {
      for (const record of records) {
        const updateData: Partial<CarChargesEntity> = {
          carId: record.car_id,
          chargeId: record.charge_id,
          rateValue: record.rate_value,
          updatedBy: record.updated_by,
        };

        const res = await this.carChargesRepo.update(
          { carChargesId: record.car_charges_id },
          updateData,
        );

        updatedData.push({
          car_charges_id: record.car_charges_id,
          affected_rows: res.affected,
        });
      }

      inputParams.update_car_charges_data = updatedData;
    } catch (err) {
      inputParams.message = err.message
      this.log.error('Update Error >>', err);
    }

    return inputParams;
  }
  async fetchCarChargesData(inputParams){
    try{
        const existed_car_data = await this.carEntity.findOne({
            where: { carId: inputParams.car_id },
        });
        
        if (!existed_car_data){
           return {success : 0 , message : "Invalid car id" , data : {}}
        }
        const existed_charges_data = await  this.carChargesRepo.find({
            where : {carId : inputParams.car_id}
        })
       
        return {success : existed_charges_data.length > 0 ? 1 : 0 , data : existed_charges_data,message : 'data found'}
    }catch(err){
      inputParams.message = err.message
       throw new Error(err)
    }
  }
  carChargesFinishSuccess(inputParams: any, message: string) {
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_car_charges_data', 'update_car_charges_data'],
        },
        data: inputParams,
      },
      { name: 'car_charges' },
    );
  }

  carChargesFinishFailure(inputParams: any) {
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
      { name: 'car_charges' },
    );
  }
  async startCarChargesDetails(id) {
    let outputResponse = {};

    try {
      this.setModuleAPI('fetch');
      outputResponse = await this.getChargesDetails(id);
    } catch (err) {
      this.log.error('API Error >> charges_details >>', err);
    }
    return outputResponse;
  }

  async getChargesDetails(id) {
    try {
      const data = await this.elasticService.getById(
        id,
        'nest_local_car_charges_details',
        'id',
      );
      if (!data) {
        return { success: 0, message: 'No Charges found.' };
      }

      return { status: 200, success: 1, message: 'Car Charges Details Retrieved Successfully.', data };
    } catch (err) {
      return { status: 200, success: 0, message: err.message };
    }
  }
}

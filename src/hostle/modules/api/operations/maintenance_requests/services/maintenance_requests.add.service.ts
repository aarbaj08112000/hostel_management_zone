import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { MaintenanceRequestsEntity } from '../entities/maintenance_requests.entity';
import { BaseService } from '@repo/source/services/base.service';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class MaintenanceRequestsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    MaintenanceRequestsAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(MaintenanceRequestsEntity)
  protected maintenanceRepo: Repository<MaintenanceRequestsEntity>;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = ['insert_maintenance_data', 'update_maintenance_data'];
    this.moduleName = 'maintenance_request';
    this.serviceConfig = {
      module_name: 'maintenance_request',
      table_name: 'maintenance_requests',
      table_alias: 'm',
      primary_key: 'maintenanceId',
      primary_alias: 'm_maintenance_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startMaintenanceAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');
      let inputParams = await this.insertMaintenanceData(reqParams);
      if (inputParams.insert_maintenance_data.insert_id) {
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'maintenance_request';
          reqParams.entity_id = inputParams.insert_maintenance_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }
      }
      return !_.isEmpty(inputParams.insert_maintenance_data)
        ? await this.maintenanceFinishSuccess(
            inputParams,
            'Maintenance Request Added Successfully.',
          )
        : await this.maintenanceFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> maintenance_add >>', err);
      return {};
    }
  }

  async insertMaintenanceData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'hostel_id',
        'room_id',
        'reported_by',
        'issue_description',
        'status',
        'reported_date',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';
      const res = await this.maintenanceRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Maintenance Request Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_maintenance_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startMaintenanceUpdate(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');
      let inputParams = await this.updateMaintenanceData(reqParams);
      if (!_.isEmpty(inputParams.update_maintenance_data)) {
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'maintenance_request';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }
      }
      return !_.isEmpty(inputParams.update_maintenance_data)
        ? await this.maintenanceFinishSuccess(
            inputParams,
            'Maintenance Request Updated Successfully.',
          )
        : await this.maintenanceFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> maintenance_update >>', err);
      return {};
    }
  }

  async updateMaintenanceData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'hostel_id',
        'room_id',
        'reported_by',
        'issue_description',
        'status',
        'resolved_date',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';
      const queryObject = this.maintenanceRepo
        .createQueryBuilder()
        .update(MaintenanceRequestsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('maintenance_id = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Maintenance Request Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.update_maintenance_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteMaintenance(id: number) {
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteMaintenanceData(id);
      return inputParams.deleted_maintenance
        ? await this.maintenanceFinishSuccess(inputParams, inputParams.message)
        : await this.maintenanceFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> maintenance_delete >>', err);
      return {};
    }
  }

  async deleteMaintenanceData(id: any) {
    try {
      const deleteResult = await this.maintenanceRepo.delete({
        maintenance_id: id,
      });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Maintenance Request found.' };
      return {
        success: 1,
        message: 'Maintenance Request Deleted Successfully.',
        deleted_maintenance: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async maintenanceFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_maintenance_data'],
        },
        data: inputParams,
      },
      { name: 'maintenance_add', single_keys: this.singleKeys },
    );
  }
  async maintenanceFinishFailure(inputParams: any) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: custom.lang('Something went wrong, Please try again.'),
          fields: [],
        },
        data: inputParams,
      },
      { name: 'maintenance_add' },
    );
  }
}

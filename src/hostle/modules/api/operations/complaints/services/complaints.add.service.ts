// src/services/complaints-add.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ComplaintsEntity } from '../entities/complaints.entity';
import { BaseService } from '@repo/source/services/base.service';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class ComplaintsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    ComplaintsAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(ComplaintsEntity)
  protected complaintRepo: Repository<ComplaintsEntity>;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = [
      'custom_unique_condition',
      'insert_complaint_data',
      'update_complaint_data',
    ];
    this.moduleName = 'complaint';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'complaint',
      table_name: 'complaints',
      table_alias: 'c',
      primary_key: 'complaintId',
      primary_alias: 'c_complaint_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startComplaintAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = reqParams;
      inputParams = await this.customUniqueCondition(inputParams);

      inputParams = await this.insertComplaintData(inputParams);
      if (inputParams.insert_complaint_data.insert_id) {
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'complaint';
          reqParams.entity_id = inputParams.insert_complaint_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }
      }
      if (!_.isEmpty(inputParams.insert_complaint_data))
        outputResponse = await this.complaintFinishSuccess(
          inputParams,
          'Complaint Added Successfully.',
        );
      else outputResponse = await this.complaintFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> complaint_add >>', err);
    }
    return outputResponse;
  }

  async insertComplaintData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('student_id' in inputParams)
        queryColumns.student_id = inputParams.student_id;
      if ('description' in inputParams)
        queryColumns.description = inputParams.description;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('created_date' in inputParams)
        queryColumns.created_date = inputParams.created_date;
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';
      const res = await this.complaintRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Complaint Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_complaint_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startComplaintUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;
      inputParams = await this.updateComplaintData(inputParams);
      if (!_.isEmpty(inputParams.update_complaint_data)) {
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'complaint';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }
      }
      if (!_.isEmpty(inputParams.update_complaint_data))
        outputResponse = await this.complaintFinishSuccess(
          inputParams,
          'Complaint Updated Successfully.',
        );
      else outputResponse = await this.complaintFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> complaint_update >>', err);
    }
    return outputResponse;
  }

  async updateComplaintData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('description' in inputParams)
        queryColumns.description = inputParams.description;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('resolved_date' in inputParams)
        queryColumns.resolved_date = inputParams.resolved_date;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';
      const queryObject = this.complaintRepo
        .createQueryBuilder()
        .update(ComplaintsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('complaint_id = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Complaint Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_complaint_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteComplaint(id: number) {
    let outputResponse = {};
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteComplaintData(id);
      if (inputParams.deleted_complaint)
        outputResponse = await this.complaintFinishSuccess(
          inputParams,
          inputParams.message,
        );
      else outputResponse = await this.complaintFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> complaint_delete >>', err);
    }
    return outputResponse;
  }

  async deleteComplaintData(id: any) {
    try {
      const deleteResult = await this.complaintRepo.delete({
        complaint_id: id,
      });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Complaint found.' };
      return {
        success: 1,
        message: 'Complaint Deleted Successfully.',
        deleted_complaint: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async customUniqueCondition(inputParams: any) {
    return inputParams;
  }

  async complaintFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_complaint_data'],
        },
        data: inputParams,
      },
      { name: 'complaint_add', single_keys: this.singleKeys },
    );
  }

  async complaintFinishFailure(inputParams: any) {
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
      { name: 'complaint_add' },
    );
  }
}

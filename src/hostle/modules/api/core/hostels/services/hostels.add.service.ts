import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { BaseService } from '@repo/source/services/base.service';
import { HostelsEntity } from '../entities/hostels.entity';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class HostelAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    HostelAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };
  protected blockResult: BlockResultDto;

  @InjectRepository(HostelsEntity)
  protected hostelRepo: Repository<HostelsEntity>;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = [
      'custom_unique_condition',
      'insert_hostel_data',
      'update_hostel_data',
    ];
    this.moduleName = 'hostel';
    this.serviceConfig = {
      module_name: 'hostel',
      table_name: 'hostels',
      table_alias: 'h',
      primary_key: 'hostelId',
      primary_alias: 'h_hostel_id',
      unique_fields: {
        type: 'and',
        fields: { hostel_name: 'hostelName' },
        message: 'Hostel name already exists',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  // =================== ADD HOSTEL ===================
  async startHostelAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');

      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.hostelUniqueFailure(reqParams);
      } else {
        reqParams = await this.insertHostelData(reqParams);

        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'hostel';
          reqParams.entity_id = reqParams.insert_hostel_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }

        outputResponse = !_.isEmpty(reqParams.insert_hostel_data)
          ? await this.hostelFinishSuccess(
              reqParams,
              'Hostel Added Successfully.',
            )
          : await this.hostelFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> hostel_add >>', err);
    }
    return outputResponse;
  }

  // =================== UPDATE HOSTEL ===================
  async startHostelUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');

      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.hostelUniqueFailure(reqParams);
      } else {
        reqParams = await this.updateHostelData(reqParams);

        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'hostel';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }

        outputResponse = !_.isEmpty(reqParams.update_hostel_data)
          ? await this.hostelFinishSuccess(
              reqParams,
              'Hostel Updated Successfully.',
            )
          : await this.hostelFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> hostel_update >>', err);
    }
    return outputResponse;
  }

  // =================== INSERT HOSTEL DATA ===================
  async insertHostelData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('hostel_name' in inputParams)
        queryColumns.hostel_name = inputParams.hostel_name;
      if ('address' in inputParams) queryColumns.address = inputParams.address;
      if ('city' in inputParams) queryColumns.city = inputParams.city;
      if ('state' in inputParams) queryColumns.state = inputParams.state;
      if ('pincode' in inputParams) queryColumns.pincode = inputParams.pincode;
      if ('contact_number' in inputParams) queryColumns.contact_number = inputParams.contact_number;
      if ('category' in inputParams) queryColumns.category = inputParams.category;
      if ('description' in inputParams) queryColumns.description = inputParams.description;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';

      const res = await this.hostelRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Hostel Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_hostel_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UPDATE HOSTEL DATA ===================
  async updateHostelData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('hostel_name' in inputParams)
        queryColumns.hostel_name = inputParams.hostel_name;
      if ('address' in inputParams) queryColumns.address = inputParams.address;
      if ('city' in inputParams) queryColumns.city = inputParams.city;
      if ('state' in inputParams) queryColumns.state = inputParams.state;
      if ('pincode' in inputParams) queryColumns.pincode = inputParams.pincode;
      if ('contact_number' in inputParams) queryColumns.contact_number = inputParams.contact_number;
      if ('category' in inputParams) queryColumns.category = inputParams.category;
      if ('description' in inputParams) queryColumns.description = inputParams.description;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.hostelRepo
        .createQueryBuilder()
        .update(HostelsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('hostel_id = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Hostel Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_hostel_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UNIQUE CHECK ===================
  async customUniqueCondition(inputParams: any) {
    try {
      const result = await this.checkUniqueCondition(inputParams);
      const formatData = this.response.assignFunctionResponse(result);
      inputParams.custom_unique_condition = formatData;
      inputParams = this.response.assignSingleRecord(inputParams, formatData);
    } catch (err) {
      this.log.error(err);
    }
    return inputParams;
  }

  // =================== SUCCESS / FAILURE ===================
  async hostelFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message,
      fields: ['insert_hostel_data', 'update_hostel_data'],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'hostel_add', single_keys: this.singleKeys },
    );
  }

  async hostelFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'hostel_add' },
    );
  }

  // =================== UNIQUE FAILURE ===================
  hostelUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Hostel name already exists'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'hostel_add' },
    );
  }

  // =================== DELETE ATTACHMENT ===================
  async deleteAttachment(attachment_id: number) {
    try {
      const res = await this.hostelRepo.manager.query(
        'DELETE FROM attachments WHERE attachment_id = ?',
        [attachment_id]
      );
      return {
        settings: {
          status: 200,
          success: 1,
          message: 'Attachment deleted successfully.',
          fields: [],
        },
        data: {},
      };
    } catch (err) {
      return {
        settings: {
          status: 200,
          success: 0,
          message: err.message,
          fields: [],
        },
        data: {},
      };
    }
  }
}

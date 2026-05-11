import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { BaseService } from '@repo/source/services/base.service';
import { UsersEntity } from '../entities/users.entity';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class UserAddService extends BaseService {
  protected readonly log = new LoggerHandler(UserAddService.name).getInstance();
  protected inputParams: any = {};
  protected singleKeys: any[] = [];
  protected blockResult: any = {};
  protected requestObj: AuthObject = { user: {} };

  @InjectRepository(UsersEntity) protected userRepo: Repository<UsersEntity>;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = [
      'custom_unique_condition',
      'insert_user_data',
      'update_user_data',
    ];
    this.moduleName = 'user';
    this.serviceConfig = {
      module_name: 'user',
      table_name: 'users',
      table_alias: 'u',
      primary_key: 'userId',
      primary_alias: 'u_user_id',
      unique_fields: {
        type: 'and',
        fields: { email: 'email' },
        message: 'Record already exists with this email',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  // =================== ADD USER ===================
  async startUserAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');

      // Unique check
      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.userUniqueFailure(reqParams);
      } else {
        // Insert user data
        reqParams = await this.insertUserData(reqParams);

        // Handle attachments
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'user';
          reqParams.entity_id = reqParams.insert_user_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }

        outputResponse = !_.isEmpty(reqParams.insert_user_data)
          ? await this.userFinishSuccess(reqParams, 'User Added Successfully.')
          : await this.userFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> user_add >>', err);
    }
    return outputResponse;
  }

  // =================== UPDATE USER ===================
  async startUserUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');

      // Unique check
      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.userUniqueFailure(reqParams);
      } else {
        // Update user data
        reqParams = await this.updateUserData(reqParams);

        // Handle attachments
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'user';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }

        outputResponse = !_.isEmpty(reqParams.update_user_data)
          ? await this.userFinishSuccess(
              reqParams,
              'User Updated Successfully.',
            )
          : await this.userFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> user_update >>', err);
    }
    return outputResponse;
  }

  // =================== INSERT USER DATA ===================
  async insertUserData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('name' in inputParams) queryColumns.name = inputParams.name;
      if ('email' in inputParams) queryColumns.email = inputParams.email;
      if ('password_hash' in inputParams)
        queryColumns.password_hash = inputParams.password_hash;
      if ('role' in inputParams) queryColumns.role = inputParams.role;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';

      const res = await this.userRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'User Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_user_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UPDATE USER DATA ===================
  async updateUserData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('name' in inputParams) queryColumns.name = inputParams.name;
      if ('email' in inputParams) queryColumns.email = inputParams.email;
      if ('role' in inputParams) queryColumns.role = inputParams.role;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.userRepo
        .createQueryBuilder()
        .update(UsersEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('userId = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'User Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_user_data = this.blockResult.data;
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
  async userFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message,
      fields: ['insert_user_data', 'update_user_data'],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'user_add', single_keys: this.singleKeys },
    );
  }

  async userFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'user_add' },
    );
  }

  // =================== UNIQUE FAILURE ===================
  userUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Record already exists with this email'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'user_add' },
    );
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { BaseService } from '@repo/source/services/base.service';
import { PropertyManagersEntity } from '../entities/property_managers.entity';
import { UsersEntity } from '../../users/entities/users.entity';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class PropertyManagersAddService extends BaseService {
  protected readonly log = new LoggerHandler(PropertyManagersAddService.name).getInstance();
  protected inputParams: any = {};
  protected singleKeys: any[] = [];
  protected blockResult: any = {};

  @InjectDataSource() protected dataSource: DataSource;
  @InjectRepository(PropertyManagersEntity) protected managerRepo: Repository<PropertyManagersEntity>;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = ['custom_unique_condition', 'insert_manager_data', 'update_manager_data'];
    this.moduleName = 'property_manager';
    this.serviceConfig = {
      module_name: 'property_manager',table_name: 'property_managers', table_alias: 'pm',
      primary_key: 'managerId', primary_alias: 'pm_manager_id',
      unique_fields: { type: 'and', fields: { email: 'email' }, message: 'Record already exists with this email' },
      expRefer: {}, topRefer: {}
    };
  }

  async startPropertyManagerAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.setModuleAPI('add');

      // Unique check
      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.managerUniqueFailure(reqParams);
      } else {
        reqParams = await this.insertManagerData(reqParams);
        
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'property_manager';
          reqParams.entity_id = reqParams.insert_manager_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(reqObject, reqParams);
        }

        outputResponse = !_.isEmpty(reqParams.insert_manager_data)
          ? await this.managerFinishSuccess(reqParams, 'Manager Added Successfully.')
          : await this.managerFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> manager_add >>', err);
    }
    return outputResponse;
  }

  async startPropertyManagerUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.setModuleAPI('update');

      reqParams = await this.customUniqueCondition(reqParams);
      if (reqParams.unique_status === 1) {
        outputResponse = this.managerUniqueFailure(reqParams);
      } else {
        reqParams = await this.updateManagerData(reqParams);

        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'property_manager';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(reqObject, reqParams);
        }

        outputResponse = !_.isEmpty(reqParams.update_manager_data)
          ? await this.managerFinishSuccess(reqParams, 'Manager Updated Successfully.')
          : await this.managerFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> manager_update >>', err);
    }
    return outputResponse;
  }

  async startPropertyManagerDelete(reqObject, reqParams) {
    try {
      if (!reqParams.id) throw new Error('ID required');
      await this.managerRepo.delete(reqParams.id);
      return this.response.outputResponse({ settings: { status: 200, success: 1, message: 'Deleted Successfully' }, data: reqParams}, {name: 'delete'});
    } catch (err) {
      return this.response.outputResponse({ settings: { status: 200, success: 0, message: err.message }, data: reqParams}, {name: 'delete'});
    }
  }

  async insertManagerData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      const fields = ['first_name', 'last_name', 'email', 'phone', 'alt_phone', 'address', 'city', 'state', 'employee_id', 'designation', 'role', 'status', 'username', 'gender'];
      fields.forEach(f => { if (f in inputParams && inputParams[f] != null) queryColumns[f] = inputParams[f]; });

      // Handle numeric salary safely
      if (inputParams.salary != null && inputParams.salary !== '') {
        const salaryNum = parseFloat(inputParams.salary);
        if (!isNaN(salaryNum)) queryColumns.salary = salaryNum;
      }

      // Handle date fields safely
      if (inputParams.dob && inputParams.dob !== '') queryColumns.dob = inputParams.dob;
      if (inputParams.joining_date && inputParams.joining_date !== '') queryColumns.joining_date = inputParams.joining_date;

      // Serialize assigned_properties
      if (inputParams.assigned_properties) {
        queryColumns.assigned_properties = typeof inputParams.assigned_properties === 'string'
          ? inputParams.assigned_properties
          : JSON.stringify(inputParams.assigned_properties);
      }

      // Hash password
      if (inputParams.password && inputParams.password.trim() !== '') {
        const salt = bcryptjs.genSaltSync(10);
        queryColumns.password_hash = bcryptjs.hashSync(inputParams.password, salt);
      }

      // Audit
      if (inputParams.added_by) queryColumns.added_by = { user_id: Number(inputParams.added_by) };
      queryColumns.added_date = new Date();

      this.log.log('Inserting property manager data:', JSON.stringify(queryColumns));
      const res = await this.managerRepo.save(queryColumns);
      const insertId = res.manager_id;

      // Optionally sync to users table so manager can login
      if (inputParams.email && queryColumns.password_hash) {
        try {
          const userRepo = this.dataSource.getRepository(UsersEntity);
          const exists = await userRepo.findOne({ where: { email: inputParams.email } });
          if (!exists) {
            await userRepo.insert({
              name: `${inputParams.first_name || ''} ${inputParams.last_name || ''}`.trim(),
              email: inputParams.email,
              password_hash: queryColumns.password_hash,
              role: inputParams.role || 'Property Manager',
              status: inputParams.status || 'Active',
              added_date: new Date(),
            });
          }
        } catch (e) {
          this.log.error('Failed to sync user record:', e.message);
        }
      }

      this.blockResult = { success: 1, data: { insert_id: insertId } };
    } catch (err) {
      this.log.error('insertManagerData error:', err.message, err.stack);
      this.blockResult = { success: 0, message: err.message, data: {} };
    }
    inputParams.insert_manager_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async updateManagerData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      const fields = ['first_name', 'last_name', 'email', 'phone', 'alt_phone', 'address', 'city', 'state', 'employee_id', 'designation', 'role', 'status', 'username', 'gender'];
      fields.forEach(f => { if (f in inputParams && inputParams[f] != null) queryColumns[f] = inputParams[f]; });

      if (inputParams.salary != null && inputParams.salary !== '') {
        const salaryNum = parseFloat(inputParams.salary);
        if (!isNaN(salaryNum)) queryColumns.salary = salaryNum;
      }
      if (inputParams.dob && inputParams.dob !== '') queryColumns.dob = inputParams.dob;
      if (inputParams.joining_date && inputParams.joining_date !== '') queryColumns.joining_date = inputParams.joining_date;

      if (inputParams.assigned_properties) {
        queryColumns.assigned_properties = typeof inputParams.assigned_properties === 'string'
          ? inputParams.assigned_properties
          : JSON.stringify(inputParams.assigned_properties);
      }

      if (inputParams.password && inputParams.password.trim() !== '') {
        const salt = bcryptjs.genSaltSync(10);
        queryColumns.password_hash = bcryptjs.hashSync(inputParams.password, salt);
        try {
          if (inputParams.email) {
            const userRepo = this.dataSource.getRepository(UsersEntity);
            const exists = await userRepo.findOne({ where: { email: inputParams.email } });
            if (exists) await userRepo.update(exists.user_id, { password_hash: queryColumns.password_hash });
          }
        } catch (e) {}
      }

      if (inputParams.updated_by) queryColumns.updated_by = { user_id: Number(inputParams.updated_by) };
      queryColumns.updated_date = new Date();

      if (inputParams.id) queryColumns.manager_id = Number(inputParams.id);
      const res = await this.managerRepo.save(queryColumns);

      // Sync proxy user status/role
      try {
        if (inputParams.email) {
          const userRepo = this.dataSource.getRepository(UsersEntity);
          const exists = await userRepo.findOne({ where: { email: inputParams.email } });
          if (exists) {
            await userRepo.update(exists.user_id, {
              status: inputParams.status,
              role: inputParams.role,
              name: `${inputParams.first_name || ''} ${inputParams.last_name || ''}`.trim(),
            });
          }
        }
      } catch (e) {}

      this.blockResult = { success: 1, data: { affected_rows: res.affected } };
    } catch (err) {
      this.log.error('updateManagerData error:', err.message, err.stack);
      this.blockResult = { success: 0, message: err.message, data: {} };
    }
    inputParams.update_manager_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

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

  async managerFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      { settings: { status: 200, success: 1, message, fields: [] }, data: inputParams },
      { name: 'manager_add', single_keys: this.singleKeys }
    );
  }

  async managerFinishFailure(inputParams: any) {
    return await this.response.outputResponse(
      { settings: { status: 200, success: 0, message: custom.lang('Something went wrong'), fields: [] }, data: inputParams },
      { name: 'manager_add' }
    );
  }

  managerUniqueFailure(inputParams: any) {
    return this.response.outputResponse(
      { settings: { status: 200, success: 0, message: 'Existing Email', fields: [] }, data: inputParams },
      { name: 'manager_add' }
    );
  }
}

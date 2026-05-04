import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { UsersEntity } from '../entities/users.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class UsersService {
  protected readonly log = new LoggerHandler(UsersService.name).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;

  constructor(protected readonly elasticService: ElasticService) {}

  async startUsers(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getUsers(this.inputParams);
      if (!_.isEmpty(this.inputParams.users)) {
        outputResponse = this.usersFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.usersFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> users >>', err);
    }
    return outputResponse;
  }

  async getUsers(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(UsersEntity)
        .createQueryBuilder('u');

      if ('user_id' in inputParams) {
        query.where('u.user_id = :uid', { uid: inputParams.user_id });
      }

      if ('role' in inputParams) {
        query.andWhere('u.role = :role', { role: inputParams.role });
      }

      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Records found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.users = this.blockResult.data;
    
    return inputParams;
  }

  usersFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Users found.'),
      fields: [
        'user_id',
        'name',
        'email',
        'role',
        'status',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = { name: 'users', multiple_keys: this.multipleKeys ,
      output_keys: ['users'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startUserDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getUserDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.user_details)) {
        outputResponse = this.userDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.usersFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> user_details >>', err);
    }
    return outputResponse;
  }

  async getUserDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(UsersEntity)
        .createQueryBuilder('u');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('u.user_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.user_details = this.blockResult.data;
    
    return inputParams;
  }

  userDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('User details found.'),
      fields: [
        'user_id',
        'name',
        'email',
        'role',
        'status',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'user_details',
      single_keys: ['user_details'],
      output_keys: ['user_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  usersFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Users not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'users' },
    );
  }
}

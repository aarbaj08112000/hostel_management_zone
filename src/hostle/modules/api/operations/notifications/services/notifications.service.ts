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
import { NotificationsEntity } from '../entities/notifications.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class NotificationsService {
  protected readonly log = new LoggerHandler(
    NotificationsService.name,
  ).getInstance();
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

  async startNotifications(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getNotifications(this.inputParams);
      if (!_.isEmpty(this.inputParams.notifications)) {
        outputResponse = this.notificationsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.notificationsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> notifications >>', err);
    }
    return outputResponse;
  }

  async getNotifications(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(NotificationsEntity)
        .createQueryBuilder('n');

      if ('student_id' in inputParams) {
        query.where('n.student_id = :sid', { sid: inputParams.student_id });
      }

      if ('is_read' in inputParams) {
        query.andWhere('n.is_read = :read', { read: inputParams.is_read });
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

    inputParams.notifications = this.blockResult.data;
    
    return inputParams;
  }

  notificationsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Notifications found.'),
      fields: [
        'notification_id',
        'student_id',
        'title',
        'message',
        'notification_type',
        'is_read',
        'sent_date',
      ],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'notifications',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['notifications'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startNotificationDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getNotificationDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.notification_details)) {
        outputResponse = this.notificationDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.notificationsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> notification_details >>', err);
    }
    return outputResponse;
  }

  async getNotificationDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(NotificationsEntity)
        .createQueryBuilder('n');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('n.notification_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.notification_details = this.blockResult.data;
    
    return inputParams;
  }

  notificationDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Notification details found.'),
      fields: [
        'notification_id',
        'student_id',
        'title',
        'message',
        'notification_type',
        'is_read',
        'sent_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'notification_details',
      single_keys: ['notification_details'],
      output_keys: ['notification_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  notificationsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Notifications not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: inputParams.notification_details ? 'notification_details' : 'notifications' },
    );
  }
}

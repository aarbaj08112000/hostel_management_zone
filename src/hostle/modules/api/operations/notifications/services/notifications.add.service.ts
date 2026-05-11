import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { NotificationsEntity } from '../entities/notifications.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class NotificationsAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    NotificationsAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: any;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(NotificationsEntity)
  protected notificationRepo: Repository<NotificationsEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_notification_data', 'update_notification_data'];
    this.moduleName = 'notification';
    this.serviceConfig = {
      module_name: 'notification',
      table_name: 'notifications',
      table_alias: 'n',
      primary_key: 'notificationId',
      primary_alias: 'n_notification_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startNotificationAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      let inputParams = await this.insertNotificationData(reqParams);
      return !_.isEmpty(inputParams.insert_notification_data)
        ? await this.notificationFinishSuccess(
            inputParams,
            'Notification Added Successfully.',
          )
        : await this.notificationFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> notification_add >>', err);
      return {};
    }
  }

  async insertNotificationData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'student_id',
        'title',
        'message',
        'notification_type',
        'is_read',
        'sent_date',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';
      const res = await this.notificationRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Notification Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_notification_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async notificationFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_notification_data'],
        },
        data: inputParams,
      },
      { name: 'notification_add', single_keys: this.singleKeys },
    );
  }
  async notificationFinishFailure(inputParams: any) {
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
      { name: 'notification_add' },
    );
  }
}

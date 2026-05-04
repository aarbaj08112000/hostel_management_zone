import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { AttachmentEntity } from 'src/hostle/modules/api/users/users/entities/users.entity';
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
import { MaintenanceRequestsEntity } from '../entities/maintenance_requests.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class MaintenanceRequestsService {
  protected readonly log = new LoggerHandler(
    MaintenanceRequestsService.name,
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

  async startMaintenanceRequests(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getMaintenanceRequests(this.inputParams);
      if (!_.isEmpty(this.inputParams.maintenance_requests)) {
        outputResponse = this.maintenanceRequestsFinishedSuccess(
          this.inputParams,
        );
      } else {
        outputResponse = this.maintenanceRequestsFinishedFailure(
          this.inputParams,
        );
      }
    } catch (err) {
      this.log.error('API Error >> maintenance_requests >>', err);
    }
    return outputResponse;
  }

  async getMaintenanceRequests(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(MaintenanceRequestsEntity)
        .createQueryBuilder('m');

      if ('hostel_id' in inputParams) {
        query.where('m.hostel_id = :hid', { hid: inputParams.hostel_id });
      }

      if ('status' in inputParams) {
        query.andWhere('m.status = :status', { status: inputParams.status });
      }

      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const ids = data.map((item) => item.maintenance_id);
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'maintenance_request', reference_id: In(ids) },
      });
      const attachmentMap = _.groupBy(attachments, 'reference_id');

      data.forEach((item) => {
        item['attachments'] = attachmentMap[item.maintenance_id] || [];
      });

      this.blockResult = { success: 1, message: 'Records found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.maintenance_requests = this.blockResult.data;
    
    return inputParams;
  }

  maintenanceRequestsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Maintenance requests found.'),
      fields: [
        'maintenance_id',
        'hostel_id',
        'room_id',
        'reported_by',
        'issue_description',
        'status',
        'reported_date',
        'resolved_date',
        'attachments',
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
      name: 'maintenance_requests',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['maintenance_requests'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startMaintenanceRequestDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getMaintenanceRequestDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.maintenanceRequest_details)) {
        outputResponse = this.maintenanceRequestDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.maintenanceRequestsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> maintenanceRequest_details >>', err);
    }
    return outputResponse;
  }

  async getMaintenanceRequestDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(MaintenanceRequestsEntity)
        .createQueryBuilder('m');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('m.maintenance_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'maintenance_request', reference_id: data.maintenance_id },
      });
      data['attachments'] = attachments;

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.maintenanceRequest_details = this.blockResult.data;
    
    return inputParams;
  }

  maintenanceRequestDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('MaintenanceRequest details found.'),
      fields: [
        'maintenance_id',
        'hostel_id',
        'room_id',
        'reported_by',
        'issue_description',
        'status',
        'reported_date',
        'resolved_date',
        'attachments',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'maintenanceRequest_details',
      single_keys: ['maintenanceRequest_details'],
      output_keys: ['maintenanceRequest_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  maintenanceRequestsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Maintenance requests not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'maintenance_requests' },
    );
  }
}

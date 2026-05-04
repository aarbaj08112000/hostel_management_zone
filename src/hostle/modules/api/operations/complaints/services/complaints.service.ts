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
import { ComplaintsEntity } from '../entities/complaints.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class ComplaintsService {
  protected readonly log = new LoggerHandler(
    ComplaintsService.name,
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

  async startComplaints(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getComplaints(this.inputParams);
      if (!_.isEmpty(this.inputParams.complaints)) {
        outputResponse = this.complaintsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.complaintsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> complaints >>', err);
    }
    return outputResponse;
  }

  async getComplaints(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(ComplaintsEntity)
        .createQueryBuilder('c');

      if ('student_id' in inputParams) {
        query.where('c.student_id = :sid', { sid: inputParams.student_id });
      }

      if ('status' in inputParams) {
        query.andWhere('c.status = :status', { status: inputParams.status });
      }

      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const ids = data.map((item) => item.complaint_id);
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'complaint', reference_id: In(ids) },
      });
      const attachmentMap = _.groupBy(attachments, 'reference_id');

      data.forEach((item) => {
        item['attachments'] = attachmentMap[item.complaint_id] || [];
      });

      this.blockResult = { success: 1, message: 'Records found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.complaints = this.blockResult.data;
    
    return inputParams;
  }

  complaintsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Complaints found.'),
      fields: [
        'complaint_id',
        'student_id',
        'description',
        'status',
        'created_date',
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
      name: 'complaints',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['complaints'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startComplaintDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getComplaintDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.complaint_details)) {
        outputResponse = this.complaintDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.complaintsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> complaint_details >>', err);
    }
    return outputResponse;
  }

  async getComplaintDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(ComplaintsEntity)
        .createQueryBuilder('c');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('c.complaint_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'complaint', reference_id: data.complaint_id },
      });
      data['attachments'] = attachments;

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.complaint_details = this.blockResult.data;
    
    return inputParams;
  }

  complaintDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Complaint details found.'),
      fields: [
        'complaint_id',
        'student_id',
        'description',
        'status',
        'created_date',
        'resolved_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'complaint_details',
      single_keys: ['complaint_details'],
      output_keys: ['complaint_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  complaintsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Complaints not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'complaints' },
    );
  }
}

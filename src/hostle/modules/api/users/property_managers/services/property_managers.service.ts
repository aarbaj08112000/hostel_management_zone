import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { AttachmentEntity } from 'src/hostle/modules/api/users/users/entities/users.entity';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ElasticService } from '@repo/source/services/elastic.service';
import { PropertyManagersEntity } from '../entities/property_managers.entity';

@Injectable()
export class PropertyManagersService {
  protected readonly log = new LoggerHandler(PropertyManagersService.name).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected multipleKeys: any[] = [];

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;

  constructor(protected readonly elasticService: ElasticService) {}

  async startPropertyManagers(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.inputParams = await this.getPropertyManagers(this.inputParams);
      outputResponse = this.propertyManagersFinishedSuccess(this.inputParams);
    } catch (err) {
      this.log.error('API Error >> property_managers_list >>', err);
    }
    return outputResponse;
  }

  async getPropertyManagers(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(PropertyManagersEntity)
        .createQueryBuilder('pm');

      if ('manager_id' in inputParams) {
        query.andWhere('pm.manager_id = :mid', { mid: inputParams.manager_id });
      }

      if ('status' in inputParams) {
        query.andWhere('pm.status = :status', { status: inputParams.status });
      }

      if ('search' in inputParams && inputParams.search) {
        query.andWhere('(pm.first_name LIKE :search OR pm.last_name LIKE :search OR pm.phone LIKE :search OR pm.email LIKE :search)', { search: `%${inputParams.search}%` });
      }

      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      
      const [data, count] = await query.getManyAndCount();
      inputParams.total_count = count;

      // if (_.isEmpty(data)) throw new Error('No records found.');

      // Attachments (like profile image)
      const ids = data.map((d) => d.manager_id);
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'property_manager', reference_id: In(ids) },
      });
      const attachmentMap = _.groupBy(attachments, 'reference_id');

      data.forEach((item) => {
        item['attachments'] = attachmentMap[item.manager_id] || [];
        // deserialize assigned_properties if needed
        try {
          item.assigned_properties = JSON.parse(item.assigned_properties) || [];
        } catch {
          item.assigned_properties = [];
        }
      });

      this.blockResult = { success: 1, message: 'Records found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.property_managers = this.blockResult.data;
    return inputParams;
  }

  propertyManagersFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Property Managers found.'),
      page, limit, total_count, total_pages,
      fields: ['manager_id', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'employee_id', 'salary', 'assigned_properties', 'attachments']
    };

    const outputData = {
      settings: settingFields,
      data: {
        property_managers: inputParams.property_managers
      }
    };
    return outputData;
  }

  async startPropertyManagerDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = await this.getPropertyManagerDetails(reqParams);
      if (!_.isEmpty(this.inputParams.manager_details)) {
        outputResponse = this.managerDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.propertyManagersFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> property_manager_details >>', err);
    }
    return outputResponse;
  }

  async getPropertyManagerDetails(inputParams: any) {
    this.blockResult = {};
    try {
      this.log.log(`Fetching details for ID: ${inputParams.id}`);
      
      const data = await this.dataSource.getRepository(PropertyManagersEntity).findOneBy({
        manager_id: Number(inputParams.id)
      });
      
      this.log.log(`Data found: ${data ? 'Yes' : 'No'}`);

      if (!data) throw new Error('No records found.');

      // Fetch attachments separately
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'property_manager', reference_id: data.manager_id },
      });
      data['attachments'] = attachments;
      
      try {
        if (typeof data.assigned_properties === 'string') {
          data.assigned_properties = JSON.parse(data.assigned_properties) || [];
        }
      } catch {
        data.assigned_properties = [];
      }

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.log.error('getPropertyManagerDetails error:', err.message);
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.manager_details = this.blockResult.data;
    return inputParams;
  }

  managerDetailsFinishedSuccess(inputParams: any) {
    const outputData = {
      settings: { 
        status: 200, 
        success: 1, 
        message: custom.lang('Details found.'),
        fields: ['manager_id', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'employee_id', 'salary', 'assigned_properties', 'attachments']
      },
      data: {
        manager_details: inputParams.manager_details
      }
    };
    return outputData;
  }

  propertyManagersFinishedFailure(inputParams: any) {
    return { 
      settings: { 
        status: 200, 
        success: 0, 
        message: custom.lang('No records found.'), 
        fields: [] 
      }, 
      data: inputParams 
    };
  }
}

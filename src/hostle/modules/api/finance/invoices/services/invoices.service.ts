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
import { InvoicesEntity } from '../entities/invoices.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class InvoicesService {
  protected readonly log = new LoggerHandler(
    InvoicesService.name,
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

  async startInvoices(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getInvoices(this.inputParams);
      if (!_.isEmpty(this.inputParams.invoices)) {
        outputResponse = this.invoicesFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.invoicesFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> invoices >>', err);
    }
    return outputResponse;
  }

  async getInvoices(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(InvoicesEntity)
        .createQueryBuilder('i');

      if ('stay_id' in inputParams) {
        query.where('i.stay_id = :sid', { sid: inputParams.stay_id });
      }

      if ('status' in inputParams) {
        query.andWhere('i.status = :status', { status: inputParams.status });
      }

      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const ids = data.map((item) => item.invoice_id);
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'invoice', reference_id: In(ids) },
      });
      const attachmentMap = _.groupBy(attachments, 'reference_id');

      data.forEach((item) => {
        item['attachments'] = attachmentMap[item.invoice_id] || [];
      });

      this.blockResult = { success: 1, message: 'Records found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.invoices = this.blockResult.data;
    
    return inputParams;
  }

  invoicesFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Invoices found.'),
      fields: [
        'invoice_id',
        'stay_id',
        'invoice_month',
        'total_amount',
        'due_date',
        'status',
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
      name: 'invoices',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['invoices'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startInvoiceDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getInvoiceDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.invoice_details)) {
        outputResponse = this.invoiceDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.invoicesFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> invoice_details >>', err);
    }
    return outputResponse;
  }

  async getInvoiceDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(InvoicesEntity)
        .createQueryBuilder('i');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('i.invoice_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'invoice', reference_id: data.invoice_id },
      });
      data['attachments'] = attachments;

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.invoice_details = this.blockResult.data;
    
    return inputParams;
  }

  invoiceDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Invoice details found.'),
      fields: [
        'invoice_id',
        'stay_id',
        'invoice_month',
        'total_amount',
        'due_date',
        'status',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'invoice_details',
      single_keys: ['invoice_details'],
      output_keys: ['invoice_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  invoicesFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Invoices not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'invoices' },
    );
  }
}

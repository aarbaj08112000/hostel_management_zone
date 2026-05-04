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
import { PaymentsEntity } from '../entities/payments.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class PaymentsService {
  protected readonly log = new LoggerHandler(
    PaymentsService.name,
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

  async startPayments(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getPayments(this.inputParams);
      if (!_.isEmpty(this.inputParams.payments)) {
        outputResponse = this.paymentsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.paymentsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> payments >>', err);
    }
    return outputResponse;
  }

  async getPayments(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(PaymentsEntity)
        .createQueryBuilder('p');

      if ('student_id' in inputParams) {
        query.where('p.student_id = :sid', { sid: inputParams.student_id });
      }

      if ('payment_method' in inputParams) {
        query.andWhere('p.payment_method = :pm', {
          pm: inputParams.payment_method,
        });
      }

      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const ids = data.map((item) => item.payment_id);
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'payment', reference_id: In(ids) },
      });
      const attachmentMap = _.groupBy(attachments, 'reference_id');

      data.forEach((item) => {
        item['attachments'] = attachmentMap[item.payment_id] || [];
      });

      this.blockResult = { success: 1, message: 'Records found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.payments = this.blockResult.data;
    
    return inputParams;
  }

  paymentsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Payments found.'),
      fields: [
        'payment_id',
        'student_id',
        'amount_paid',
        'payment_method',
        'payment_date',
        'reference_number',
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
      name: 'payments',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['payments'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startPaymentDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getPaymentDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.payment_details)) {
        outputResponse = this.paymentDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.paymentsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> payment_details >>', err);
    }
    return outputResponse;
  }

  async getPaymentDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(PaymentsEntity)
        .createQueryBuilder('p');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('p.payment_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      // Fetch attachments
      const attachments = await this.dataSource.getRepository(AttachmentEntity).find({
        where: { module: 'payment', reference_id: data.payment_id },
      });
      data['attachments'] = attachments;

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.payment_details = this.blockResult.data;
    
    return inputParams;
  }

  paymentDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Payment details found.'),
      fields: [
        'payment_id',
        'student_id',
        'amount_paid',
        'payment_method',
        'payment_date',
        'reference_number',
        'attachments',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'payment_details',
      single_keys: ['payment_details'],
      output_keys: ['payment_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  paymentsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Payments not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'payments' },
    );
  }
}

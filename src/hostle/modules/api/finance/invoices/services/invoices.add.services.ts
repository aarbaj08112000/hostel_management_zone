import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { BaseService } from '@repo/source/services/base.service';
import { InvoicesEntity } from '../entities/invoices.entity';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class InvoiceAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    InvoiceAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: any = {};
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectRepository(InvoicesEntity)
  protected invoiceRepo: Repository<InvoicesEntity>;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = [
      'custom_unique_condition',
      'insert_invoice_data',
      'update_invoice_data',
    ];
    this.moduleName = 'invoice';
    this.serviceConfig = {
      module_name: 'invoice',
      table_name: 'invoices',
      table_alias: 'i',
      primary_key: 'invoice_id',
      primary_alias: 'i_invoice_id',
      unique_fields: {
        type: 'and',
        fields: { invoice_number: 'invoiceNumber' },
        message: 'Invoice number already exists',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  // =================== ADD INVOICE ===================
  async startInvoiceAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');

      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.invoiceUniqueFailure(reqParams);
      } else {
        reqParams = await this.insertInvoiceData(reqParams);

        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'invoice';
          reqParams.entity_id = reqParams.insert_invoice_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }

        outputResponse = !_.isEmpty(reqParams.insert_invoice_data)
          ? await this.invoiceFinishSuccess(
              reqParams,
              'Invoice Added Successfully.',
            )
          : await this.invoiceFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> invoice_add >>', err);
    }
    return outputResponse;
  }

  // =================== UPDATE INVOICE ===================
  async startInvoiceUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');

      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.invoiceUniqueFailure(reqParams);
      } else {
        reqParams = await this.updateInvoiceData(reqParams);

        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'invoice';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams,
          );
        }

        outputResponse = !_.isEmpty(reqParams.update_invoice_data)
          ? await this.invoiceFinishSuccess(
              reqParams,
              'Invoice Updated Successfully.',
            )
          : await this.invoiceFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> invoice_update >>', err);
    }
    return outputResponse;
  }

  // =================== INSERT INVOICE DATA ===================
  async insertInvoiceData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('stay_id' in inputParams)
        queryColumns.stay_id = inputParams.stay_id;
      if ('total_amount' in inputParams) queryColumns.total_amount = inputParams.total_amount;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('added_by' in inputParams)
        queryColumns.added_by = { user_id: inputParams.added_by };
      queryColumns.added_date = () => 'NOW()';

      const res = await this.invoiceRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Invoice Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_invoice_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UPDATE INVOICE DATA ===================
  async updateInvoiceData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('stay_id' in inputParams)
        queryColumns.stay_id = inputParams.stay_id;
      if ('total_amount' in inputParams) queryColumns.total_amount = inputParams.total_amount;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('updated_by' in inputParams)
        queryColumns.updated_by = { user_id: inputParams.updated_by };
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.invoiceRepo
        .createQueryBuilder()
        .update(InvoicesEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('invoice_id = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Invoice Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_invoice_data = this.blockResult.data;
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
  async invoiceFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message,
      fields: ['insert_invoice_data', 'update_invoice_data'],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'invoice_add', single_keys: this.singleKeys },
    );
  }

  async invoiceFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'invoice_add' },
    );
  }

  // =================== UNIQUE FAILURE ===================
  invoiceUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Invoice number already exists'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'invoice_add' },
    );
  }
}

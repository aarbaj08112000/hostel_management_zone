
interface AuthObject {
  user: any;
}
import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
@Injectable()
export class InsuranceProviderService {
  protected readonly log = new LoggerHandler(
    InsuranceProviderService.name,
  ).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = {
    user: {},
  };
  @InjectDataSource()
  protected dataSource: DataSource;
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly response: ResponseLibrary;
  @Inject()
  protected readonly moduleService: ModuleService;
  constructor(protected readonly elasticService: ElasticService) { }
  async startInsuranceProvider(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      inputParams = await this.getInsuranceProvider(inputParams);
      if (!_.isEmpty(inputParams.insurance_provider)) {
        outputResponse = this.insuranceProviderFinishedSuccess(inputParams);
      } else {
        outputResponse = this.insuranceProviderFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> insurance_provider >>', err);
    }
    return outputResponse;
  }
  async getInsuranceProvider(inputParams: any) {
    this.blockResult = {};
    try {
      let index = 'nest_local_insurance_provider';
      let search_params = this.general.createElasticSearchQuery(inputParams);

      let pageIndex = 1;
      if ('page' in inputParams) {
        pageIndex = Number(inputParams.page);
      } else if ('page_index' in inputParams) {
        pageIndex = Number(inputParams.page_index);
      }
      pageIndex = pageIndex > 0 ? pageIndex : 1;
      const recLimit = Number(inputParams.limit);
      const startIdx = custom.getStartIndex(pageIndex, recLimit);
      const results = await this.elasticService.search(
        index,
        search_params,
        startIdx,
        recLimit,
      );

      if (!_.isObject(results) || _.isEmpty(results)) {
        throw new Error('No records found.');
      }
      const totalCount = results['total']['value'];
      this.settingsParams = custom.getPagination(
        totalCount,
        pageIndex,
        recLimit,
      );
      if (totalCount <= 0) {
        throw new Error('No records found.');
      }

      const data = results.hits.map((hit) => {
        return hit._source;
      });
      if (_.isObject(data) && data.length > 0) {
        const success = 1;
        const message = 'Records found.';

        const queryResult = {
          success,
          message,
          data,
        };
        this.blockResult = queryResult;
      } else {
        throw new Error('No records found.');
      }
    } catch (err) {
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insurance_provider = this.blockResult.data;
    return inputParams;
  }
  insuranceProviderFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('insurance provider list found.'),
      fields: [],
    };
    settingFields.fields =
      ['insurance_provider_id',
        'provider_name',
        'provider_code',
        'location_id',
        'location_name',
        'zip_code',
        'address',
        'city',
        'city_code',
        'state',
        'state_code',
        'country',
        'country_code',
        'status',
        'added_date', 'updated_by', 'added_by', 'updated_date', 'added_name', 'updated_name', "remarks", "description"];
    const outputKeys = ['insurance_provider'];

    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'insurance_provider';

    funcData.output_keys = outputKeys;
    funcData.multiple_keys = this.multipleKeys;
    return this.response.outputResponse(outputData, funcData);
  }
  insuranceProviderFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('insurance provider list not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'insurance_provider',
      },
    );
  }
}

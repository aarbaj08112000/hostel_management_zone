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
export class BodyListService {
  protected readonly log = new LoggerHandler(
    BodyListService.name,
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
  async startBodyList(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      inputParams = await this.getBodyList(inputParams);
      if (!_.isEmpty(inputParams.body_list)) {
        outputResponse = this.bodyListFinishedSuccess(inputParams);
      } else {
        outputResponse = this.bodyListFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> body_list >>', err);
    }
    return outputResponse;
  }
  async getBodyList(inputParams: any) {
    this.blockResult = {};
    try {
      let index = 'nest_local_body';
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
    inputParams.body_list = this.blockResult.data;
    return inputParams;
  }
  bodyListFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('body list found.'),
      fields: [],
    };
    settingFields.fields = ['body_type', 'body_code', 'body_type_id', 'status', 'added_date', 'updated_by', 'added_by', 'updated_date', 'added_name', 'updated_name'];
    const outputKeys = ['body_list'];

    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'body_list';

    funcData.output_keys = outputKeys;
    funcData.multiple_keys = this.multipleKeys;
    return this.response.outputResponse(outputData, funcData);
  }
  bodyListFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('body list not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'body_list',
      },
    );
  }
}

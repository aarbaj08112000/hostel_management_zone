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
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class CarDropDownListService {
  protected readonly log = new LoggerHandler(CarDropDownListService.name).getInstance();
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

  constructor(
    protected readonly configService: ConfigService,
    protected readonly elasticService: ElasticService,
  ) { }

  async startCarDropDownList(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      inputParams = await this.getCarList(inputParams);
      if (!_.isEmpty(inputParams.get_car_list)) {
        outputResponse = this.carFinishedSuccess(inputParams);
      } else {
        outputResponse = this.carFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_lists >>', err);
    }
    return outputResponse;
  }
  async getCarList(inputParams: any) {
    this.blockResult = {};
    try {
      let index = 'nest_local_cars';
      if ('is_front' in inputParams && (inputParams?.is_front == 'Yes' || inputParams?.is_front == 'yes')) {

        if ('filters' in inputParams) {
          inputParams.filters = { ...inputParams.filters, status: ['Available', 'Booked'], isListed: 'Yes' };
        } else {
          inputParams = { ...inputParams, filters: { status: ['Available', 'Booked'],  isListed: 'Yes' } };
        }
      } else {
        if ('filters' in inputParams) {
          inputParams.filters = [
            ...inputParams.filters,
            { "key": "status", "value": "Available", "operator": "equal" },
            { "key": "isListed", "value": "Yes", "operator": "equal" }
          ];
        } else {
          inputParams = {
            ...inputParams,
            filters: [{ "key": "status", "value": "Available", "operator": "equal" },{ "key": "isListed", "value": "Yes", "operator": "equal" }]
          };
        }
      }
      let search_params: any = this.general.createElasticSearchQuery(inputParams);
      let feilds = ['car_image', 'carId', 'carName', 'car_slug'];
      search_params = { ...search_params, feilds };
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
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      let fileConfig: FileFetchDto;
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions =
        await this.general.getConfigItem('allowed_extensions');
      const data = await Promise.all(
        results.hits.map(async hit => {
          const fileConfigCopy = { ...fileConfig };
          fileConfigCopy.image_name = hit._source['car_image'];
          fileConfigCopy.path = `car_images_${aws_folder}/${hit._source['carId']}`;
          return {
            key: Array.isArray(hit.fields.carId) ? hit.fields.carId[0] : '',
            slug: Array.isArray(hit.fields.car_slug) ? hit.fields.car_slug[0] : '',
            value: Array.isArray(hit.fields.carName) ? hit.fields.carName[0] : '',
            display_title: Array.isArray(hit.fields.display_title) ? hit.fields.display_title[0] : '',
            car_image: hit._source['car_image']
              ? await this.general.getFile(fileConfigCopy, inputParams)
              : '',
            sales_executive_id: Array.isArray(hit.fields.sales_executive_id)
              ? hit.fields.sales_executive_id[0]
              : ''
          };
        })
      );
      if (_.isObject(data) && !_.isEmpty(data)) {
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
    inputParams.get_car_list = this.blockResult.data;
    return inputParams;
  }
  async carFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Cars dropdown found.'),
      fields: [],
    };
    settingFields.fields = [
      'key',
      'slug',
      'value',
      'car_image',
      "display_title"
    ];
    const outputKeys = ['get_car_list'];

    const outputData: any = {};
    outputData.settings = { ...settingFields, ...this.settingsParams };
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'car_list';

    funcData.output_keys = outputKeys;
    funcData.multiple_keys = this.multipleKeys;
    return this.response.outputResponse(outputData, funcData);
  }
  async carFinishedFailure(inputParams: any) {
    let settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Cars dropdown not found.'),
      fields: [],
    };
    settingFields = { ...settingFields, ...this.settingsParams };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'cars_list',
      },
    );
  }
}

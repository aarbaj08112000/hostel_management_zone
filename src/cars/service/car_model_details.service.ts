import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ElasticService } from '@repo/source/services/elastic.service';

@Injectable()
export class CarModelDetailsService {
  protected readonly log = new LoggerHandler(CarModelDetailsService.name).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected requestObj: any = {};

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject()
  protected readonly general: CitGeneralLibrary;

  @Inject()
  protected readonly response: ResponseLibrary;

  constructor(protected readonly elasticService: ElasticService) { }

  async startCarModelDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.getCarModelDetails(inputParams);

      if (!_.isEmpty(inputParams.car_model_details)) {
        outputResponse = this.carModelDetailsFinishedSuccess(inputParams);
      } else {
        outputResponse = this.carModelDetailsFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_model_details >>', err);
    }
    return outputResponse;
  }

  async getCarModelDetails(inputParams: any) {
    this.blockResult = {};
    try {
      let { search_key, search_by, index } = inputParams;
      const data = await this.elasticService.getById(search_key, index, search_by);
      if (_.isObject(data) && !_.isEmpty(data)) {
        this.blockResult = {
          success: 1,
          message: 'Records found.',
          data,
        };
      } else {
        throw new Error('No records found.');
      }
    } catch (err) {
      this.blockResult = {
        success: 0,
        message: err.message,
        data: [],
      };
    }
    inputParams.car_model_details = this.blockResult.data;
    return inputParams;
  }

  carModelDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Car models found.'),
      fields: ['model_id', 'model_name', 'model_code', 'added_by', 'added_date', 'updated_by', 'updated_date', 'added_name', 'updated_name', 'status', 'parent_model_id', 'parent_model_name', 'parent_model_code', 'parent_status', 'brand_id', 'brand_name'],
    };

    const outputData: any = {
      settings: settingFields,
      data: inputParams,
    };

    const funcData: any = {
      name: 'car_model_details',
      output_keys: ['car_model_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  carModelDetailsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Car models not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_model_details',
      },
    );
  }
}

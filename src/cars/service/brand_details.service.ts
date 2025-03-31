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
import { FileFetchDto } from '@repo/source/common/dto/amazon.dto';

@Injectable()
export class BrandDetailsService {
  protected readonly log = new LoggerHandler(BrandDetailsService.name).getInstance();
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

  async startBrandDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.getBrandDetails(inputParams);

      if (!_.isEmpty(inputParams.brand_details)) {
        outputResponse = this.brandDetailsFinishedSuccess(inputParams);
      } else {
        outputResponse = this.brandDetailsFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> brand_details >>', err);
    }
    return outputResponse;
  }

  async getBrandDetails(inputParams: any) {
    this.blockResult = {};
    try {

      let fileConfig: FileFetchDto;
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');

      let { search_key, search_by, index } = inputParams;
      const data = await this.elasticService.getById(search_key, index, search_by);

      if (data?.brand_image != '') {
        fileConfig.image_name = data['brand_image'];
        fileConfig.path = `brand_${aws_folder}`;
        data.brand_image = await this.general.getFile(fileConfig, inputParams);
      }

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
    inputParams.brand_details = this.blockResult.data;
    return inputParams;
  }

  brandDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Brands found.'),
      fields: ['brand_id', 'brand_name', 'brand_code', 'status', 'added_by', 'added_date', 'updated_by', 'updated_date', 'added_name', 'updated_name', 'brand_image'],
    };

    const outputData: any = {
      settings: settingFields,
      data: inputParams,
    };

    const funcData: any = {
      name: 'brand_details',
      output_keys: ['brand_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  brandDetailsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Brands not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'brand_details',
      },
    );
  }
}

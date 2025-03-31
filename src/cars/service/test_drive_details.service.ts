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
export class TestDriveDetailsService {
  protected readonly log = new LoggerHandler(TestDriveDetailsService.name).getInstance();
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

  async startTestDriveDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.getTestDriveDetails(inputParams);

      if (!_.isEmpty(inputParams.test_drive_details)) {
        outputResponse = this.testDriveDetailsFinishedSuccess(inputParams);
      } else {
        outputResponse = this.testDriveDetailsFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> test_drive_details >>', err);
    }
    return outputResponse;
  }

  async getTestDriveDetails(inputParams: any) {
    this.blockResult = {};
    try {
      let fileConfig: FileFetchDto;
      const aws_folder = await this.general.getConfigItem('AWS_SERVER');
      fileConfig = {};
      fileConfig.source = 'amazon';
      fileConfig.extensions = await this.general.getConfigItem('allowed_extensions');

      let { search_key, search_by, index } = inputParams;
      const data = await this.elasticService.getById(search_key, index, search_by);

      if (data?.attachment != '') {
        fileConfig.image_name = data['attachment'];
        fileConfig.path = `test_drive_${aws_folder}/${data.id}`;
        data.attachment = await this.general.getFile(fileConfig, inputParams);
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
    inputParams.test_drive_details = this.blockResult.data;
    return inputParams;
  }

  testDriveDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Test Drive details found.'),
      fields: [
        'id',
        'code',
        'type',
        // 'license_holder_details',
        'car_id',
        'car_name',
        'car_code',
        'location_id',
        'location_name',
        'location_code',
        'customer_id',
        'first_name',
        'middle_name',
        'last_name',
        'slot_date',
        'slot_time',
        'remarks',
        'add_by_id',
        'add_by_date',
        'add_by_name',
        'updated_by_id',
        'updated_by_date',
        'updated_by_name',
        'attachment',
        'status'
      ],
    };

    const outputData: any = {
      settings: settingFields,
      data: inputParams,
    };

    const funcData: any = {
      name: 'test_drive_details',
      output_keys: ['test_drive_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  testDriveDetailsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Test Drive details not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'test_drive_details',
      },
    );
  }
}

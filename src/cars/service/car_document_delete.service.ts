

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

import { CarDocumentEntity } from '../entities/cars.entity';

import { ModuleService } from '@repo/source/services/module.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CarDocumentAddService } from './car_document_add.service';
import { AmazonService } from '@repo/source/services/amazon.service';
@Injectable()
export class CarDocumentDeleteService extends CarDocumentAddService {

  protected readonly log = new LoggerHandler(
    CarDocumentDeleteService.name,
  ).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
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
  protected readonly amazonService: AmazonService;
  @InjectRepository(CarDocumentEntity)
  protected carDocumentEntityRepo: Repository<CarDocumentEntity>;

  /**
   * constructor method is used to set preferences while service object initialization.
   */
  constructor() {
    super()
    this.singleKeys = ['car_document_data_delete'];
  }

  async startCarDocumentDelete(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      inputParams = await this.deleteCarDocumentData(inputParams);

      if (!_.isEmpty(inputParams.delete_carImage_data)) {
        let aws_res = await this.general.deleteAwsFile(inputParams.src);
        outputResponse = this.carDocumentFinishSuccess(inputParams);
      } else {
        outputResponse = this.carDocumentFinishFailure(inputParams);
      }

    } catch (err) {
      this.log.error('API Error >> car_image_delete >>', err);
    }
    return outputResponse;
  }


  async deleteCarDocumentData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryObject = this.carDocumentEntityRepo.createQueryBuilder().delete();
      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere('carDocumentId = :id', { id: inputParams.id });
      }
      const res = await queryObject.execute();
      const data = {
        affected_rows: res.affected,
      };

      const success = 1;
      const message = 'Record(s) deleted.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.delete_carImage_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }
  carDocumentFinishSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Car Document deleted successfully.'),
      fields: [],
    };
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_list',
      },
    };
    this.general.submitGearmanJob(job_data);
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_document_delete',
      },
    );
  }

  carDocumentFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_document_delete',
      },
    );
  }
}
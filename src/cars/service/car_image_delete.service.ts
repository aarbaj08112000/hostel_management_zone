

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

import { CarImagesEntity } from '../entities/car_images.entity';

import { ModuleService } from '@repo/source/services/module.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { carImageAddService } from './car_image.service';
import { AmazonService } from '@repo/source/services/amazon.service';
@Injectable()
export class CarImageDeleteService extends carImageAddService {

  protected readonly log = new LoggerHandler(
    CarImageDeleteService.name,
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
  @InjectRepository(CarImagesEntity)
  protected carImageEntityRepo: Repository<CarImagesEntity>;

  /**
   * constructor method is used to set preferences while service object initialization.
   */
  constructor() {
    super()
    this.singleKeys = ['car_image_data_delete'];
  }

  async startCarImageDelete(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      inputParams = await this.deleteCarImageData(inputParams);

      if (!_.isEmpty(inputParams.delete_carImage_data)) {
        let aws_res = await this.general.deleteAwsFile(inputParams.src);
        outputResponse = this.carImageFinishSuccess(inputParams);
      } else {
        outputResponse = this.carImageFinishFailure(inputParams);
      }

    } catch (err) {
      this.log.error('API Error >> car_image_delete >>', err);
    }
    return outputResponse;
  }


  async deleteCarImageData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryObject = this.carImageEntityRepo.createQueryBuilder().delete();
      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere('carImageId = :id', { id: inputParams.id });
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
  carImageFinishSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Car Image deleted successfully.'),
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
        name: 'car_image_delete',
      },
    );
  }

  carImageFinishFailure(inputParams: any) {
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
        name: 'car_image_delete',
      },
    );
  }
}
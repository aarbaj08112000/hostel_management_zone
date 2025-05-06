import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ElasticService } from '@repo/source/services/elastic.service';
import { VariantMasterEntity } from '../entities/variant-master.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
export class VariantDetailsService {
  protected readonly log = new LoggerHandler(VariantDetailsService.name).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected requestObj: any = {};

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject()
  protected readonly general: CitGeneralLibrary;

  @Inject()
  protected readonly response: ResponseLibrary;

  @InjectRepository(VariantMasterEntity)
  protected variantMasterEntityRepo: Repository<VariantMasterEntity>;

  constructor(protected readonly elasticService: ElasticService) { }

  async startVariantDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.getVariantDetails(inputParams);

      if (!_.isEmpty(inputParams.variant_details)) {
        outputResponse = this.variantDetailsFinishedSuccess(inputParams);
      } else {
        outputResponse = this.variantDetailsFinishedFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> variant_details >>', err);
    }
    return outputResponse;
  }

  async getVariantDetails(inputParams: any) {
    this.blockResult = {};
    try {
      let { search_key, search_by, index } = inputParams;
      const data = await this.elasticService.getById(search_key, index, search_by);
      const queryObject = this.variantMasterEntityRepo.createQueryBuilder('vm');

      queryObject.select('vm.variantId', 'variant_id');
      queryObject.addSelect('vm.variantName', 'variant_name');
      queryObject.addSelect('vm.variantCode', 'variant_code');
      queryObject.addSelect('vm.status', 'status');
      queryObject.addSelect('vm.addedDate', 'added_date');
      queryObject.addSelect('vm.addedBy', 'added_by');
      queryObject.addSelect('vm.updatedBy', 'updated_by');
      queryObject.addSelect('vm.updatedDate', 'updated_date');
      queryObject.addSelect('vm.modedId', 'model_id');
      queryObject.addSelect('ma.name', 'added_name');
      queryObject.addSelect('cm.modelName', 'model_name');
      queryObject.addSelect('LOWER(cm.modelCode)', 'model_code');
      queryObject.addSelect('ma1.name', 'updated_name');

      queryObject.leftJoin('mod_admin', 'ma', 'ma.id = vm.addedBy');
      queryObject.leftJoin('mod_admin', 'ma1', 'ma1.id = vm.updatedBy');
      queryObject.leftJoin('car_model', 'cm', 'cm.carModelId = vm.modedId');

      queryObject.where('vm.variantId = :search_key', { search_key });

      // const data = await queryObject.getRawOne();

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
    inputParams.variant_details = this.blockResult.data;
    return inputParams;
  }

  variantDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Trim found.'),
      fields: ['variant_id', 'variant_name', 'variant_code', 'status', 'added_by', 'added_date', 'updated_by', 'updated_date', 'model_id', 'model_name', 'model_code','brandId','brandName','brandCode'],
    };

    const outputData: any = {
      settings: settingFields,
      data: inputParams,
    };

    const funcData: any = {
      name: 'variant_details',
      output_keys: ['variant_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  variantDetailsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Trim not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'variant_details',
      },
    );
  }
}

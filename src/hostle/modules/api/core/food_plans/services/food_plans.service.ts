import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ElasticService } from '@repo/source/services/elastic.service';
import { FoodPlansEntity } from '../entities/food_plans.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class FoodPlansService {
  protected readonly log = new LoggerHandler(
    FoodPlansService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected multipleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;

  constructor(protected readonly elasticService: ElasticService) {}

  async startFoodPlans(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getFoodPlans(this.inputParams);
      if (!_.isEmpty(this.inputParams.food_plans)) {
        outputResponse = this.foodPlansFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.foodPlansFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> food_plans >>', err);
    }
    return outputResponse;
  }

  async getFoodPlans(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(FoodPlansEntity)
        .createQueryBuilder('f');

      if ('plan_name' in inputParams) {
        query.where('f.plan_name = :pname', { pname: inputParams.plan_name });
      }

      
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);
      const [data, count] = await query.getManyAndCount();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Records found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.food_plans = this.blockResult.data;
    
    return inputParams;
  }

  foodPlansFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Food plans found.'),
      fields: ['food_plan_id', 'plan_name', 'monthly_price', 'description'],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'food_plans',
      multiple_keys: this.multipleKeys,
      output_keys: ['food_plans'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startFoodPlanDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getFoodPlanDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.foodPlan_details)) {
        outputResponse = this.foodPlanDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.foodPlansFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> foodPlan_details >>', err);
    }
    return outputResponse;
  }

  async getFoodPlanDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(FoodPlansEntity)
        .createQueryBuilder('f');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('food_plan_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.foodPlan_details = this.blockResult.data;
    
    return inputParams;
  }

  foodPlanDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('FoodPlan details found.'),
      fields: ['food_plan_id', 'plan_name', 'monthly_price', 'description'],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'foodPlan_details',
      single_keys: ['foodPlan_details'],
      output_keys: ['foodPlan_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  foodPlansFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Food plans not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'food_plans' },
    );
  }
}

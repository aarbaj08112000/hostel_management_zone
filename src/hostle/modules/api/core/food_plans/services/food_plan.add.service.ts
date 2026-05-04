// src/services/food-plans-add.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import {
  BlockResultDto,
  SettingsParamsDto,
} from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { FoodPlansEntity } from '../entities/food_plans.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class FoodPlansAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    FoodPlansAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(FoodPlansEntity)
  protected foodPlanRepo: Repository<FoodPlansEntity>;

  constructor() {
    super();
    this.singleKeys = ['insert_food_plan_data', 'update_food_plan_data'];
    this.moduleName = 'food_plan';
    this.serviceConfig = {
      module_name: 'food_plan',
      table_name: 'food_plans',
      table_alias: 'fp',
      primary_key: 'food_plan_id',
      primary_alias: 'fp_food_plan_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startFoodPlanAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');
      let inputParams = await this.insertFoodPlanData(reqParams);
      return !_.isEmpty(inputParams.insert_food_plan_data)
        ? await this.foodPlanFinishSuccess(
            inputParams,
            'Food Plan Added Successfully.',
          )
        : await this.foodPlanFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> food_plan_add >>', err);
      return {};
    }
  }

  async insertFoodPlanData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('plan_name' in inputParams)
        queryColumns.plan_name = inputParams.plan_name;
      if ('monthly_price' in inputParams)
        queryColumns.monthly_price = inputParams.monthly_price;
      if ('description' in inputParams)
        queryColumns.description = inputParams.description;
      const res = await this.foodPlanRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Food Plan Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_food_plan_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startFoodPlanUpdate(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');
      let inputParams = await this.updateFoodPlanData(reqParams);
      return !_.isEmpty(inputParams.update_food_plan_data)
        ? await this.foodPlanFinishSuccess(
            inputParams,
            'Food Plan Updated Successfully.',
          )
        : await this.foodPlanFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> food_plan_update >>', err);
      return {};
    }
  }

  async updateFoodPlanData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('plan_name' in inputParams)
        queryColumns.plan_name = inputParams.plan_name;
      if ('monthly_price' in inputParams)
        queryColumns.monthly_price = inputParams.monthly_price;
      if ('description' in inputParams)
        queryColumns.description = inputParams.description;
      const queryObject = this.foodPlanRepo
        .createQueryBuilder()
        .update(FoodPlansEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('food_plan_id = :id', { id: inputParams.id });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Food Plan Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.update_food_plan_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeleteFoodPlan(id: number) {
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteFoodPlanData(id);
      return inputParams.deleted_food_plan
        ? await this.foodPlanFinishSuccess(inputParams, inputParams.message)
        : await this.foodPlanFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> food_plan_delete >>', err);
      return {};
    }
  }

  async deleteFoodPlanData(id: any) {
    try {
      const deleteResult = await this.foodPlanRepo.delete({ food_plan_id: id });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Food Plan found.' };
      return {
        success: 1,
        message: 'Food Plan Deleted Successfully.',
        deleted_food_plan: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async foodPlanFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_food_plan_data'],
        },
        data: inputParams,
      },
      { name: 'food_plan_add', single_keys: this.singleKeys },
    );
  }
  async foodPlanFinishFailure(inputParams: any) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: custom.lang('Something went wrong, Please try again.'),
          fields: [],
        },
        data: inputParams,
      },
      { name: 'food_plan_add' },
    );
  }
}

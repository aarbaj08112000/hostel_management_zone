// src/services/student-food-plans-add.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { StudentFoodPlansEntity } from '../entities/student_food_plans.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class StudentFoodPlansAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    StudentFoodPlansAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: BlockResultDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectDataSource() protected dataSource: DataSource;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly moduleService: ModuleService;
  @InjectRepository(StudentFoodPlansEntity)
  protected studentFoodPlanRepo: Repository<StudentFoodPlansEntity>;

  constructor() {
    super();
    this.singleKeys = [
      'insert_student_food_plan_data',
      'update_student_food_plan_data',
    ];
    this.moduleName = 'student_food_plan';
    this.serviceConfig = {
      module_name: 'student_food_plan',
      table_name: 'student_food_plans',
      table_alias: 'sfp',
      primary_key: 'student_food_plan_id',
      primary_alias: 'sfp_plan_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  async startPlanAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');
      let inputParams = await this.insertPlanData(reqParams);
      return !_.isEmpty(inputParams.insert_student_food_plan_data)
        ? await this.planFinishSuccess(
            inputParams,
            'Student Food Plan Added Successfully.',
          )
        : await this.planFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> student_food_plan_add >>', err);
      return {};
    }
  }

  async insertPlanData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'stay_id',
        'food_plan_id',
        'start_date',
        'end_date',
        'status',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      const userId = this.requestObj?.user?.user_id || null;
      queryColumns.added_by = { user_id: userId };
      queryColumns.updated_by = { user_id: userId };
      queryColumns.added_date = new Date();
      queryColumns.updated_date = new Date();
      if (!queryColumns.status) queryColumns.status = 'Active';
      const res = await this.studentFoodPlanRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Student Food Plan Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.insert_student_food_plan_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startPlanUpdate(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');
      let inputParams = await this.updatePlanData(reqParams);
      return !_.isEmpty(inputParams.update_student_food_plan_data)
        ? await this.planFinishSuccess(
            inputParams,
            'Student Food Plan Updated Successfully.',
          )
        : await this.planFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> student_food_plan_update >>', err);
      return {};
    }
  }

  async updatePlanData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'stay_id',
        'food_plan_id',
        'start_date',
        'end_date',
        'status',
      ].forEach((key) => {
        if (key in inputParams) queryColumns[key] = inputParams[key];
      });
      const userId = this.requestObj?.user?.user_id || null;
      queryColumns.updated_by = { user_id: userId };
      queryColumns.updated_date = new Date();
      const queryObject = this.studentFoodPlanRepo
        .createQueryBuilder()
        .update(StudentFoodPlansEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('student_food_plan_id = :id', {
          id: inputParams.id,
        });
      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Student Food Plan Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }
    inputParams.update_student_food_plan_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async DeletePlan(id: number) {
    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deletePlanData(id);
      return inputParams.deleted_plan
        ? await this.planFinishSuccess(inputParams, inputParams.message)
        : await this.planFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> student_food_plan_delete >>', err);
      return {};
    }
  }

  async deletePlanData(id: any) {
    try {
      const deleteResult = await this.studentFoodPlanRepo.delete({
        student_food_plan_id: id,
      });
      if (deleteResult.affected === 0)
        return { success: 0, message: 'No Student Food Plan found.' };
      return {
        success: 1,
        message: 'Student Food Plan Deleted Successfully.',
        deleted_plan: deleteResult.affected,
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }

  async planFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_student_food_plan_data'],
        },
        data: inputParams,
      },
      { name: 'student_food_plan_add', single_keys: this.singleKeys },
    );
  }
  async planFinishFailure(inputParams: any) {
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
      { name: 'student_food_plan_add' },
    );
  }
}

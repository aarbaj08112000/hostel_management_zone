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
import { StudentFoodPlansEntity } from '../entities/student_food_plans.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class StudentFoodPlansService {
  protected readonly log = new LoggerHandler(
    StudentFoodPlansService.name,
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

  async startStudentFoodPlans(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getStudentFoodPlans(this.inputParams);
      if (!_.isEmpty(this.inputParams.student_food_plans)) {
        outputResponse = this.studentFoodPlansFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.studentFoodPlansFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> student_food_plans >>', err);
    }
    return outputResponse;
  }

  async getStudentFoodPlans(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(StudentFoodPlansEntity)
        .createQueryBuilder('sfp');

      if ('stay_id' in inputParams) {
        query.where('sfp.stay_id = :sid', { sid: inputParams.stay_id });
      }

      if ('food_plan_id' in inputParams) {
        query.andWhere('sfp.food_plan_id = :fid', {
          fid: inputParams.food_plan_id,
        });
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

    inputParams.student_food_plans = this.blockResult.data;
    
    return inputParams;
  }

  studentFoodPlansFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Student food plans found.'),
      fields: [
        'student_food_plan_id',
        'stay_id',
        'food_plan_id',
        'start_date',
        'end_date',
        'status',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
      page,
      limit,
      total_count,
      total_pages,
      next_page,
      prev_page,
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'student_food_plans',
      multiple_keys: this.multipleKeys,
      output_keys: ['student_food_plans'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startStudentFoodPlanDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getStudentFoodPlanDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.studentFoodPlan_details)) {
        outputResponse = this.studentFoodPlanDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.studentFoodPlansFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> studentFoodPlan_details >>', err);
    }
    return outputResponse;
  }

  async getStudentFoodPlanDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(StudentFoodPlansEntity)
        .createQueryBuilder('sfp');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('sfp.student_food_plan_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.studentFoodPlan_details = this.blockResult.data;
    
    return inputParams;
  }

  studentFoodPlanDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('StudentFoodPlan details found.'),
      fields: [
        'student_food_plan_id',
        'stay_id',
        'food_plan_id',
        'start_date',
        'end_date',
        'status',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'studentFoodPlan_details',
      single_keys: ['studentFoodPlan_details'],
      output_keys: ['studentFoodPlan_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  studentFoodPlansFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Student food plans not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'student_food_plans' },
    );
  }
}

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
import { StudentsEntity } from '../entities/students.entity';

interface AuthObject {
  user: any;
}

@Injectable()
export class StudentsService {
  protected readonly log = new LoggerHandler(
    StudentsService.name,
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

  async startStudents(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getStudents(this.inputParams);
      if (!_.isEmpty(this.inputParams.students)) {
        outputResponse = this.studentsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.studentsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> students >>', err);
    }
    return outputResponse;
  }

  async getStudents(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(StudentsEntity)
        .createQueryBuilder('s');

      if ('student_id' in inputParams) {
        query.where('s.student_id = :sid', { sid: inputParams.student_id });
      }

      if ('gender' in inputParams) {
        query.andWhere('s.gender = :gender', { gender: inputParams.gender });
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

    inputParams.students = this.blockResult.data;
    
    return inputParams;
  }

  studentsFinishedSuccess(inputParams: any) {
    const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Students found.'),
      fields: [
        'student_id',
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'gender',
        'id_proof_number',
        'address',
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
      name: 'students',
      multiple_keys: this.multipleKeys,
    
      output_keys: ['students'],
    };

    return this.response.outputResponse(outputData, funcData);
  }

  async startStudentDetails(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.getStudentDetails(this.inputParams);
      if (!_.isEmpty(this.inputParams.student_details)) {
        outputResponse = this.studentDetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.studentsFinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> student_details >>', err);
    }
    return outputResponse;
  }

  async getStudentDetails(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(StudentsEntity)
        .createQueryBuilder('s');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('s.student_id = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data,  };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.student_details = this.blockResult.data;
    
    return inputParams;
  }

  studentDetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Student details found.'),
      fields: [
        'student_id',
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'gender',
        'id_proof_number',
        'address',
        'added_by',
        'updated_by',
        'added_date',
        'updated_date',
      ],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: 'student_details',
      single_keys: ['student_details'],
      output_keys: ['student_details'],
    };

    return this.response.outputResponse(outputData, funcData);
  }


  studentsFinishedFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Students not found.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'students' },
    );
  }
}

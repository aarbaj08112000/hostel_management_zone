import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { BaseService } from '@repo/source/services/base.service';
import { StudentsEntity } from '../entities/students.entity';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class StudentAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    StudentAddService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected singleKeys: any[] = [];
  protected blockResult: any = {};
  protected requestObj: AuthObject = { user: {} };

  @InjectRepository(StudentsEntity)
  protected studentRepo: Repository<StudentsEntity>;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;
  @Inject() protected readonly commonAttachment: CommonAttachmentService;

  constructor() {
    super();
    this.singleKeys = [
      'custom_unique_condition',
      'insert_student_data',
      'update_student_data',
    ];
    this.moduleName = 'student';
    this.serviceConfig = {
      module_name: 'student',
      table_name: 'students',
      table_alias: 's',
      primary_key: 'studentId',
      primary_alias: 's_student_id',
      unique_fields: {
        type: 'and',
        fields: { email: 'email' },
        message: 'Record already exists with this email',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  // =================== ADD STUDENT ===================
  async startStudentAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('add');

      // Unique check
      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.studentUniqueFailure(reqParams);
      } else {
        // Insert student data
        reqParams = await this.insertStudentData(reqParams);

        // Handle attachments
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'student';
          reqParams.entity_id = reqParams.insert_student_data.insert_id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams.files,
          );
        }

        outputResponse = !_.isEmpty(reqParams.insert_student_data)
          ? await this.studentFinishSuccess(
              reqParams,
              'Student Added Successfully.',
            )
          : await this.studentFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> student_add >>', err);
    }
    return outputResponse;
  }

  // =================== UPDATE STUDENT ===================
  async startStudentUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;
      this.setModuleAPI('update');

      // Unique check
      reqParams = await this.customUniqueCondition(reqParams);

      if (reqParams.unique_status === 1) {
        outputResponse = this.studentUniqueFailure(reqParams);
      } else {
        // Update student data
        reqParams = await this.updateStudentData(reqParams);

        // Handle attachments
        if (!_.isEmpty(reqParams.files)) {
          reqParams.entity_type = 'student';
          reqParams.entity_id = reqParams.id;
          await this.commonAttachment.startAttachmentAdd(
            this.requestObj,
            reqParams.files,
          );
        }

        outputResponse = !_.isEmpty(reqParams.update_student_data)
          ? await this.studentFinishSuccess(
              reqParams,
              'Student Updated Successfully.',
            )
          : await this.studentFinishFailure(reqParams);
      }
    } catch (err) {
      this.log.error('API Error >> student_update >>', err);
    }
    return outputResponse;
  }

  // =================== INSERT STUDENT DATA ===================
  async insertStudentData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'gender',
        'id_proof_number',
        'address',
      ].forEach((f) => {
        if (f in inputParams) queryColumns[f] = inputParams[f];
      });
      if ('added_by' in inputParams)
        queryColumns.added_by = inputParams.added_by;
      queryColumns.added_date = () => 'NOW()';

      const res = await this.studentRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'Student Added Successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_student_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UPDATE STUDENT DATA ===================
  async updateStudentData(inputParams: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      [
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'gender',
        'id_proof_number',
        'address',
        'status',
      ].forEach((f) => {
        if (f in inputParams) queryColumns[f] = inputParams[f];
      });
      if ('updated_by' in inputParams)
        queryColumns.updated_by = inputParams.updated_by;
      queryColumns.updated_date = () => 'NOW()';

      const queryObject = this.studentRepo
        .createQueryBuilder()
        .update(StudentsEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id))
        queryObject.andWhere('student_id = :id', { id: inputParams.id });

      const res = await queryObject.execute();
      this.blockResult = {
        success: 1,
        message: 'Student Updated Successfully.',
        data: { affected_rows: res.affected },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.update_student_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  // =================== UNIQUE CHECK ===================
  async customUniqueCondition(inputParams: any) {
    try {
      const result = await this.checkUniqueCondition(inputParams);
      const formatData = this.response.assignFunctionResponse(result);
      inputParams.custom_unique_condition = formatData;
      inputParams = this.response.assignSingleRecord(inputParams, formatData);
    } catch (err) {
      this.log.error(err);
    }
    return inputParams;
  }

  // =================== SUCCESS / FAILURE ===================
  async studentFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message,
      fields: ['insert_student_data', 'update_student_data'],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'student_add', single_keys: this.singleKeys },
    );
  }

  async studentFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return await this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'student_add' },
    );
  }

  studentUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Record already exists with this email'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'student_add' },
    );
  }
}

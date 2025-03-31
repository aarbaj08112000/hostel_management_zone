import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { TestDriveEntity } from '../entities/test-drive.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

@Injectable()
export class TestDriveAddService extends BaseService {
  protected readonly log = new LoggerHandler(TestDriveAddService.name).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
  protected requestObj: any = { user: {} };

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject()
  protected readonly general: CitGeneralLibrary;

  @Inject()
  protected readonly response: ResponseLibrary;

  @Inject()
  protected readonly moduleService: ModuleService;

  @InjectRepository(TestDriveEntity)
  protected testDriveRepo: Repository<TestDriveEntity>;

  constructor() {
    super();
    this.singleKeys = ['custom_unique_condition', 'insert_test_drive_data', 'update_test_drive_data'];
    this.moduleName = 'test_drive';
    this.serviceConfig = {
      module_name: 'test_drive',
      table_name: 'test_drive',
      table_alias: 'td',
      primary_key: 'id',
      primary_alias: 'td_id',
      unique_fields: {
        type: 'and',
        fields: { code: 'code' },
        message: 'Record already exists with this Code',
      },
    };
  }

  async startTestDriveAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = await this.customUniqueCondition(reqParams);

      if (inputParams.unique_status === 1) {
        outputResponse = this.testDriveUniqueFailure(inputParams);
      } else {
        inputParams = await this.insertTestDriveData(inputParams);
        if (!_.isEmpty(inputParams.insert_test_drive_data)) {
          outputResponse = this.testDriveFinishSuccess(inputParams, 'Test Drive added successfully.');
        } else {
          outputResponse = this.testDriveFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> test_drive_add >>', err);
    }
    return outputResponse;
  }

  async insertTestDriveData(inputParams: any) {
    let fileInfo: any = await this.processFiles(inputParams);
    this.blockResult = {};

    try {
      const queryColumns: any = {};
      if ('code' in inputParams) queryColumns.code = inputParams.code;
      if ('type' in inputParams) queryColumns.type = inputParams.type;
      if ('location_id' in inputParams) queryColumns.locationId = inputParams.location_id;
      if ('car_id' in inputParams) queryColumns.carId = inputParams.car_id;
      if ('customer_id' in inputParams) queryColumns.customerId = inputParams.customer_id;
      if ('slot_date' in inputParams) queryColumns.slotDate = inputParams.slot_date;
      if ('slot_time' in inputParams) queryColumns.slotTime = inputParams.slot_time;
      if ('remarks' in inputParams) queryColumns.remarks = inputParams.remarks;
      if ('license_holder_details' in inputParams) queryColumns.licenseHolderDetails = inputParams.license_holder_details;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('added_by' in inputParams) queryColumns.addedBy = inputParams.added_by;
      queryColumns.addedDate = () => 'NOW()';

      if ('attachment' in inputParams) {
        queryColumns.attachment = inputParams.attachment;
      }

      const res = await this.testDriveRepo.insert(queryColumns);
      const data = { insert_id: res.raw.insertId };

      await this.uploadFiles(fileInfo, inputParams, data.insert_id);

      this.blockResult = {
        success: 1,
        message: 'Test Drive added successfully.',
        data,
      };
    } catch (err) {
      console.log(err);
      this.blockResult = { success: 0, message: err, data: [] };
    }

    inputParams.insert_test_drive_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  async startTestDriveUpdate(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;

      inputParams = await this.updateTestDriveData(inputParams);
      if (!_.isEmpty(inputParams.update_test_drive_data)) {
        outputResponse = this.testDriveFinishSuccess(inputParams, 'Test Drive updated successfully.');
      } else {
        outputResponse = this.testDriveFinishFailure(inputParams);
      }

    } catch (err) {
      this.log.error('API Error >> test_drive_update >>', err);
    }
    return outputResponse;
  }

  async updateTestDriveData(inputParams: any) {
    let fileInfo: any = {};
    let uploadResult: any = {};
    fileInfo = await this.processFiles(inputParams);

    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('type' in inputParams) queryColumns.type = inputParams.type;
      if ('location_id' in inputParams) queryColumns.locationId = inputParams.location_id;
      if ('car_id' in inputParams) queryColumns.carId = inputParams.car_id;
      if ('customer_id' in inputParams) queryColumns.customerId = inputParams.customer_id;
      if ('slot_date' in inputParams) queryColumns.slotDate = inputParams.slot_date;
      if ('slot_time' in inputParams) queryColumns.slotTime = inputParams.slot_time;
      if ('remarks' in inputParams) queryColumns.remarks = inputParams.remarks;
      if ('license_holder_details' in inputParams) queryColumns.licenseHolderDetails = inputParams.license_holder_details;
      if ('status' in inputParams) queryColumns.status = inputParams.status;
      if ('updated_by' in inputParams) queryColumns.updatedBy = inputParams.updated_by;
      queryColumns.updatedDate = () => 'NOW()';

      if ('attachment' in inputParams) {
        queryColumns.attachment = inputParams.attachment;
      }

      const queryObject = this.testDriveRepo
        .createQueryBuilder()
        .update(TestDriveEntity)
        .set(queryColumns);

      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere('id = :id', { id: inputParams.id });
      }

      const res = await queryObject.execute();
      const data = { affected_rows: res.affected };

      uploadResult = await this.uploadFiles(fileInfo, inputParams);
      const queryResult = { success: 1, message: 'Test Drive updated successfully.', data };

      this.blockResult = queryResult;
    } catch (err) {
      console.log(err);
      this.blockResult = { success: 0, message: err, data: [] };
    }

    inputParams.update_test_drive_data = this.blockResult.data;
    return inputParams;
  }

  async processFiles(params) {
    let uploadInfo = {};
    await this.processFile('attachment', uploadInfo, params);
    return uploadInfo;
  }

  async processFile(paramKey, uploadInfo, params) {
    if (paramKey in params && !custom.isEmpty(params[paramKey])) {
      const tmpUploadPath = await this.general.getConfigItem('upload_temp_path');
      const filePath = `${tmpUploadPath}${params[paramKey]}`;
      if (this.general.isFile(filePath)) {
        const fileInfo = {
          name: params[paramKey],
          file_path: filePath,
          file_type: this.general.getFileMime(filePath),
          file_size: this.general.getFileSize(filePath),
          max_size: 512000,
          extensions: 'gif,png,jpg,jpeg,webp',
        };

        uploadInfo[paramKey] = fileInfo;
      }
    }
  }

  async uploadFiles(uploadInfo, params, id?) {
    let uploadResults = {};
    const aws_folder = await this.general.getConfigItem('AWS_SERVER');
    for (const key in uploadInfo) {
      if ('name' in uploadInfo[key]) {
        uploadResults[key] = await this.general.uploadFile(
          {
            source: 'amazon',
            upload_path: `test_drive_${aws_folder}/${id}/`,
            extensions: uploadInfo[key].extensions,
            file_type: uploadInfo[key].file_type,
            file_size: uploadInfo[key].file_size,
            max_size: uploadInfo[key].max_size,
            src_file: uploadInfo[key].file_path,
            dst_file: uploadInfo[key].name,
          },
          params,
        );
      }
    }
    return uploadResults;
  }

  async customUniqueCondition(inputParams: any) {
    try {
      const result = await this.checkUniqueCondition(inputParams);
      return this.response.assignSingleRecord(inputParams, result);
    } catch (err) {
      this.log.error(err);
      return inputParams;
    }
  }

  testDriveUniqueFailure(inputParams: any) {
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: 'Record already exists with this Code',
          fields: [],
        },
        data: inputParams,
      },
      { name: 'test_drive_add' },
    );
  }

  testDriveFinishSuccess(inputParams: any, message: string) {
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: { module: 'test_drive_list' },
    };
    this.general.submitGearmanJob(job_data);

    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_id', 'insert_test_drive_data'],
        },
        data: inputParams,
      },
      { name: 'test_drive_add' },
    );
  }

  testDriveFinishFailure(inputParams: any) {
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: 'Something went wrong, Please try again.',
          fields: [],
        },
        data: inputParams,
      },
      { name: 'test_drive_add' },
    );
  }
}

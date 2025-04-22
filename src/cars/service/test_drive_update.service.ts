import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { TestDriveEntity, TestDriveDetailsEntity } from '../entities/test-drive.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { STATUS } from '../entities/test-drive.entity';

@Injectable()
export class TestDriveUpdateService extends BaseService {
  protected readonly log = new LoggerHandler(TestDriveUpdateService.name).getInstance();
  protected requestObj: any = { user: {} };
  @InjectDataSource()
  protected dataSource: DataSource;
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly response: ResponseLibrary;
  @InjectRepository(TestDriveEntity)
  protected testDriveRepo: Repository<TestDriveEntity>;
  @InjectRepository(TestDriveDetailsEntity)
  protected testDriveDetailsRepo: Repository<TestDriveDetailsEntity>;

  constructor() {
    super();
    this.moduleName = 'test_drive';
    this.serviceConfig = {
      module_name: 'test_drive',
      table_name: 'test_drive',
      table_alias: 'td',
      primary_key: 'id',
      primary_alias: 'td_id',
    };
  }

  async initiateTestDrive(inputParams: any) {
    try {
      let fileInfo: any = await this.processFiles(inputParams);
      // Step 1: Update status in test_drive table
      const updateQuery = this.testDriveRepo
        .createQueryBuilder()
        .update(TestDriveEntity)
        .set({
          status: STATUS.ONGOING,
          updatedBy: inputParams.updated_by,
          updatedDate: () => 'NOW()',
        });

      if (inputParams.id) {
        updateQuery.where('id = :id', { id: inputParams.id });
      } else if (inputParams.code) {
        updateQuery.where('code = :code', { code: inputParams.code });
      } else {
        throw new Error('Either ID or Code must be provided.');
      }

      const updateResult = await updateQuery.execute();

      if (updateResult.affected === 0) {
        throw new Error('Test drive not found or update failed.');
      }

      // Step 2: Insert into test_drive_details table
      const testDriveRecord = await this.testDriveRepo.findOne({
        where: inputParams.id ? { id: inputParams.id } : { code: inputParams.code },
      });

      const queryColumns: any = {};
      if ('license_no' in inputParams) queryColumns.licenseNo = inputParams.license_no;
      if ('start_odometer_reading' in inputParams) queryColumns.startOdometerReading = inputParams.start_odometer_reading;
      if ('remarks' in inputParams) queryColumns.remarks = inputParams.remarks;
      if ('attachment' in inputParams) queryColumns.attachment = inputParams.attachment;
      if ('updated_by' in inputParams) queryColumns.updatedBy = inputParams.updated_by;
      queryColumns.updatedDate = () => 'NOW()';
      queryColumns.status = STATUS.ONGOING;
      queryColumns.testDriveId = testDriveRecord.id;

      const res = await this.testDriveDetailsRepo.insert(queryColumns);
      const data = { insert_id: res.raw.insertId };

      await this.uploadFiles(fileInfo, inputParams, testDriveRecord.id);
      return this.testDriveFinishSuccess('Test Drive has been initiated successfully.');

    } catch (error) {
      return this.testDriveFinishFailure(error.message);
    }
  }

  async completeTestDrive(inputParams: any) {
    try {
      let fileInfo: any = await this.processFiles(inputParams);
      // Step 1: Update status in test_drive table
      const updateQuery = this.testDriveRepo
        .createQueryBuilder()
        .update(TestDriveEntity)
        .set({
          status: STATUS.COMPLETED,
          updatedBy: inputParams.updated_by,
          updatedDate: () => 'NOW()',
        });

      if (inputParams.id) {
        updateQuery.where('id = :id', { id: inputParams.id });
      } else if (inputParams.code) {
        updateQuery.where('code = :code', { code: inputParams.code });
      } else {
        throw new Error('Either ID or Code must be provided.');
      }

      const updateResult = await updateQuery.execute();
      if (updateResult.affected === 0) {
        throw new Error('Test drive not found or update failed.');
      }

      // Step 2: Insert into test_drive_details table
      const testDriveRecord = await this.testDriveRepo.findOne({
        where: inputParams.id ? { id: inputParams.id } : { code: inputParams.code },
      });

      const queryColumns: any = {};
      if ('end_odometer_reading' in inputParams) queryColumns.endOdometerReading = inputParams.end_odometer_reading;
      if ('remarks' in inputParams) queryColumns.remarks = inputParams.remarks;
      if ('attachment' in inputParams) queryColumns.attachment = inputParams.attachment;
      if ('updated_by' in inputParams) queryColumns.updatedBy = inputParams.updated_by;
      queryColumns.updatedDate = () => 'NOW()';
      queryColumns.status = STATUS.COMPLETED;
      queryColumns.testDriveId = testDriveRecord.id;

      const res = await this.testDriveDetailsRepo.insert(queryColumns);
      const data = { insert_id: res.raw.insertId };
      await this.uploadFiles(fileInfo, inputParams, testDriveRecord.id);
      return this.testDriveFinishSuccess('Test Drive has been completed successfully.');

    } catch (error) {
      return this.testDriveFinishFailure(error.message);
    }
  }

  async rescheduleTestDrive(inputParams: any) {
    try {
      let fileInfo: any = await this.processFiles(inputParams);
      const setFields: any = {
        slotDate: inputParams.slot_date,
        slotTime: inputParams.slot_time,
        status: STATUS.RESCHEDULED,
        updatedBy: inputParams.updated_by,
        updatedDate: () => 'NOW()',
      };
      if (inputParams.sales_executive_id) {
        setFields.salesExecutiveId = inputParams.sales_executive_id;
      }
      const queryObject = this.testDriveRepo
        .createQueryBuilder()
        .update(TestDriveEntity)
        .set(setFields);

      if (inputParams.id) {
        queryObject.where('id = :id', { id: inputParams.id });
      } else if (inputParams.code) {
        queryObject.where('code = :code', { code: inputParams.code });
      }

      const result = await queryObject.execute();

      const testDriveRecord = await this.testDriveRepo.findOne({
        where: inputParams.id ? { id: inputParams.id } : { code: inputParams.code },
      });

      const queryColumns: any = {};
      if ('remarks' in inputParams) queryColumns.remarks = inputParams.remarks;
      if ('attachment' in inputParams) queryColumns.attachment = inputParams.attachment;
      if ('updated_by' in inputParams) queryColumns.updatedBy = inputParams.updated_by;
      queryColumns.updatedDate = () => 'NOW()';
      queryColumns.status = STATUS.RESCHEDULED;
      queryColumns.testDriveId = testDriveRecord.id;

      const res = await this.testDriveDetailsRepo.insert(queryColumns);
      const data = { insert_id: res.raw.insertId };
      await this.uploadFiles(fileInfo, inputParams, testDriveRecord.id);

      if (result.affected > 0) {
        return this.testDriveFinishSuccess('Test Drive has been rescheduled successfully.');
      }
    } catch (err) {
      console.log(err)
      return this.testDriveFinishFailure(err.message);
    }
  }

  async cancelTestDrive(inputParams: any) {
    const queryObject = this.testDriveRepo
      .createQueryBuilder()
      .update(TestDriveEntity)
      .set({
        status: STATUS.CANCELLED,
        updatedBy: inputParams.updated_by,
        updatedDate: () => 'NOW()',
      });

    if (inputParams.id) {
      queryObject
        .where('id = :id', { id: inputParams.id })
        .andWhere('status NOT IN (:...excludedStatus)', {
          excludedStatus: [STATUS.CANCELLED, STATUS.COMPLETED],
        });
    } else if (inputParams.code) {
      queryObject
        .where('code = :code', { code: inputParams.code })
        .andWhere('status NOT IN (:...excludedStatus)', {
          excludedStatus: [STATUS.CANCELLED, STATUS.COMPLETED],
        });
    }

    const result = await queryObject.execute();

    if (result.affected > 0) {
      return this.testDriveFinishSuccess('Test Drive cancelled successfully.');
    } else {
      return this.testDriveFinishFailure('Test Drive could not be cancelled. It may already be Cancelled or Completed.');
    }
  }

  async testDriveFinishSuccess(message) {
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'test_drive_list',
      },
    };
    await this.general.submitGearmanJob(job_data);

    return {
      status: 200,
      success: 1,
      message: message,
    };
  }

  async testDriveFinishFailure(message) {

    return this.response.outputResponse(
      {
        settings: {
          status: 400,
          success: 0,
          message: message,
        }
      },
      { name: 'test_drive_update' },
    );
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
          extensions: 'png,jpg,jpeg,webp,pdf',
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
}

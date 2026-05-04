import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { BaseService } from '@repo/source/services/base.service';
import { AttachmentEntity } from 'src/hostle/modules/api/users/users/entities/users.entity';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';

interface AuthObject {
  user: any;
}

@Injectable()
export class CommonAttachmentService extends BaseService {
  protected readonly log = new LoggerHandler(
    CommonAttachmentService.name,
  ).getInstance();
  protected inputParams: any = {};
  protected blockResult: any;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = { user: {} };

  @InjectRepository(AttachmentEntity)
  protected attachmentRepo: Repository<AttachmentEntity>;
  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;

  constructor() {
    super();
    this.singleKeys = ['insert_attachment_data', 'update_attachment_data'];
    this.moduleName = 'attachment';
    this.serviceConfig = {
      module_name: 'attachment',
      table_name: 'attachments',
      table_alias: 'a',
      primary_key: 'attachmentId',
      primary_alias: 'a_attachment_id',
      unique_fields: {},
      expRefer: {},
      topRefer: {},
    };
  }

  /**
   * Main method to handle file upload for any entity
   */
  async startAttachmentAdd(reqObject, reqParams) {
    try {
      this.inputParams = reqParams;
      this.requestObj = reqObject;

      let uploadInfo = await this.processFiles(reqParams);
      let inputParams = await this.insertAttachmentData(reqParams, uploadInfo);

      return !_.isEmpty(inputParams.insert_attachment_data)
        ? await this.attachmentFinishSuccess(
            inputParams,
            'File(s) uploaded successfully.',
          )
        : await this.attachmentFinishFailure(inputParams);
    } catch (err) {
      this.log.error('API Error >> attachment_add >>', err);
      return {};
    }
  }

  /**
   * Insert attachment records
   */
  async insertAttachmentData(inputParams: any, uploadInfo: any) {
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('entity_type' in inputParams)
        queryColumns.entityType = inputParams.entity_type;
      if ('entity_id' in inputParams)
        queryColumns.entityId = inputParams.entity_id;
      if ('uploaded_by' in inputParams)
        queryColumns.uploadedBy = inputParams.uploaded_by;

      queryColumns.files = JSON.stringify(uploadInfo);
      queryColumns.uploadedDate = () => 'NOW()';

      const res = await this.attachmentRepo.insert(queryColumns);
      this.blockResult = {
        success: 1,
        message: 'File(s) uploaded successfully.',
        data: { insert_id: res.raw.insertId },
      };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: [] };
    }

    inputParams.insert_attachment_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
  }

  /**
   * Process multiple files
   */
  async processFiles(params: any) {
    let uploadInfo = {};

    for (const key of Object.keys(params)) {
      if (!custom.isEmpty(params[key]) && key.includes('file')) {
        const tmpUploadPath =
          await this.general.getConfigItem('upload_temp_path');
        const filePath = `${tmpUploadPath}${params[key]}`;

        if (this.general.isFile(filePath)) {
          uploadInfo[key] = {
            name: params[key],
            file_name: params[key],
            file_path: filePath,
            file_type: this.general.getFileMime(filePath),
            file_size: this.general.getFileSize(filePath),
            max_size: 102400, // 100KB default limit
            extensions: 'gif,png,jpg,jpeg,jpe,bmp,ico,webp,pdf,doc,docx',
          };
        }
      }
    }

    const uploadedResults = await this.uploadFiles(uploadInfo, params);
    return uploadedResults;
  }

  /**
   * Upload files to server
   */
  async uploadFiles(uploadInfo: any, params: any) {
    const aws_folder = await this.general.getConfigItem('AWS_SERVER');
    let uploadResults = {};

    for (const key in uploadInfo) {
      if ('name' in uploadInfo[key]) {
        const uploadConfig = {
          source: 'amazon',
          upload_path: `attachments_${aws_folder}/`,
          extensions: uploadInfo[key].extensions,
          file_type: uploadInfo[key].file_type,
          file_size: uploadInfo[key].file_size,
          max_size: uploadInfo[key].max_size,
          src_file: uploadInfo[key].file_path,
          dst_file: uploadInfo[key].name,
        };
        uploadResults[key] = await this.general.uploadFile(
          uploadConfig,
          params,
        );
      }
    }

    return uploadResults;
  }

  async attachmentFinishSuccess(inputParams: any, message: string) {
    return await this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 1,
          message,
          fields: ['insert_attachment_data'],
        },
        data: inputParams,
      },
      { name: 'attachment_add', single_keys: this.singleKeys },
    );
  }

  async attachmentFinishFailure(inputParams: any) {
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
      { name: 'attachment_add' },
    );
  }
}

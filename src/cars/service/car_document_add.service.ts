import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';

import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';

import { CarDocumentEntity } from '../entities/cars.entity';

import { ModuleService } from '@repo/source/services/module.service';

@Injectable()
export class CarDocumentAddService {
  protected readonly log = new LoggerHandler(CarDocumentAddService.name).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
  protected requestObj: { user: any } = { user: {} };

  @InjectDataSource()
  protected dataSource: DataSource;
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly response: ResponseLibrary;
  @Inject()
  protected readonly moduleService: ModuleService;
  @InjectRepository(CarDocumentEntity)
  protected carDocumentEntityRepo: Repository<CarDocumentEntity>;

  constructor() {
    this.singleKeys = ['custom_unique_condition', 'insert_carDocument_data'];
  }

  async startCarDocumentAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;

      // Check if there are no documents sent or all document arrays are empty
      const hasDocuments = Object.entries(inputParams).some(
        ([key, value]) => !isNaN(Number(key)) && Array.isArray(value) && value.length > 0
      );

      if (!hasDocuments) {
        const existingDocuments = await this.fetchDocumentData(inputParams.car_id);
        if (existingDocuments.length > 0) {
          // Return success if documents already exist for the given car_id
          return this.carDocumentFinishSuccess(inputParams);
        } else {
          // Throw an error if no documents are found
          throw new Error('No documents uploaded and no existing documents found. Please upload documents.');
        }
      }

      inputParams = await this.insertCarDocumentData(inputParams);

      if (inputParams?.no_upload == 'Yes') {
        outputResponse = this.carDocumentFinishFailure(inputParams);
      } else if (!_.isEmpty(inputParams.insert_carDocument_data)) {
        outputResponse = this.carDocumentFinishSuccess(inputParams);
      } else {
        outputResponse = this.carDocumentFinishFailure(inputParams);
      }
    } catch (err) {
      return {
        success: 0,
        message: err.message,
        data: [],
      };
    }

    return outputResponse;
  }

  async insertCarDocumentData(inputParams: any) {
    let uploadResult: any = {};
    let fileInfo: any = {};
    let no_upload = 'No';

    try {
      fileInfo = await this.processFiles(inputParams);
      let car_id = inputParams.car_id;
      this.blockResult = {};

      const queryColumns: any = [];

      for (const [key, value] of Object.entries(inputParams)) {
        if (!isNaN(Number(key)) && value) {
          const documentTypeId = Number(key);
          const documentTitle = value;

          const mapped_data = {
            carId: car_id,
            documentTitle,
            documentTypeId,
          };
          queryColumns.push(mapped_data);
        }
      }

      if (queryColumns.length <= 0) {
        no_upload = 'Yes';
        inputParams['no_upload'] = 'Yes';
        throw new Error('No documents found to upload');
      }

      const res = await this.carDocumentEntityRepo.save(queryColumns);

      const data = {
        insert_id: res.map((entry) => entry.carDocumentId),
      };

      uploadResult = await this.uploadFiles(fileInfo, inputParams, car_id);
      const success = 1;
      const message = 'Documents inserted successfully.';

      this.blockResult = { success, message, data };
    } catch (err) {
      this.blockResult = {
        success: 0,
        message: err.message,
        data: [],
      };
    }

    inputParams.insert_carDocument_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(inputParams, this.blockResult.data);

    return inputParams;
  }

  carDocumentFinishSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('Car documents added successfully.'),
      fields: ['insert_id', 'insert_carDocument_data'],
    };

    const outputData: any = {
      settings: settingFields,
      data: inputParams,
    };

    return this.response.outputResponse(outputData, {
      name: 'car_documents_add',
      output_keys: ['insert_carDocument_data'],
      output_alias: { insert_id: 'id' },
      output_objects: ['insert_carDocument_data'],
      single_keys: this.singleKeys,
    });
  }

  carDocumentFinishFailure(inputParams: any) {
    const settingFields = {
      status: 400,
      success: 0,
      message: inputParams.message || custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return this.response.outputResponse(
      { settings: settingFields, data: inputParams },
      { name: 'car_documents_add' },
    );
  }

  async processFiles(params) {
    let uploadInfo = {};

    try {
      await Promise.all(
        Object.entries(params).map(async ([key, value]) => {
          if (!isNaN(Number(key)) && Array.isArray(value)) {
            const documentTypeId = Number(key);

            for (const documentTitle of value) {
              const tmpUploadPath = await this.general.getConfigItem('upload_temp_path');
              const filePath = `${tmpUploadPath}${documentTitle}`;

              if (this.general.isFile(filePath)) {
                if (!uploadInfo[documentTypeId]) {
                  uploadInfo[documentTypeId] = [];
                }

                uploadInfo[documentTypeId].push({
                  file_name: documentTitle,
                  file_path: filePath,
                  file_type: this.general.getFileMime(filePath),
                  file_size: this.general.getFileSize(filePath),
                  max_size: 512000,
                  extensions: 'pdf,doc,docx',
                });
              } else {
                this.log.error(`File not found: ${filePath}`);
              }
            }
          }
        }),
      );
    } catch (err) {
      this.log.error(`Error processing files: ${err.message}`);
    }

    return uploadInfo;
  }


  async uploadFiles(uploadInfo, params, car_id?) {
    const aws_folder = await this.general.getConfigItem('AWS_SERVER');
    let uploadResults = {};

    try {
      for (const [documentTypeId, files] of Object.entries(uploadInfo)) {
        if (!Array.isArray(files) || files.length === 0) {
          this.log.error(`No files to upload for documentTypeId: ${documentTypeId}`);
          continue;
        }

        for (const fileData of files) {
          if (!fileData) {
            this.log.error(`Invalid file data for documentTypeId: ${documentTypeId}`);
            continue;
          }

          const uploadConfig = {
            source: 'amazon',
            upload_path: `car_documents_${aws_folder}/${car_id}/`,
            extensions: fileData.extensions,
            file_type: fileData.file_type,
            file_size: fileData.file_size,
            max_size: fileData.max_size,
            src_file: fileData.file_path,
            dst_file: fileData.file_name,
          };

          this.log.debug(`Uploading file: ${fileData.file_name} for documentTypeId: ${documentTypeId}`);

          try {
            const uploadResult = await this.general.uploadFile(uploadConfig, params);
            if (!uploadResults[documentTypeId]) {
              uploadResults[documentTypeId] = [];
            }
            uploadResults[documentTypeId].push(uploadResult);
            this.log.debug(`Successfully uploaded file: ${fileData.file_name}`);
          } catch (uploadErr) {
            this.log.error(`Upload failed for file: ${fileData.file_name} with error: ${uploadErr.message}`);
          }
        }
      }
    } catch (err) {
      this.log.error(`Upload process failed: ${err.message}`);
    }

    return uploadResults;
  }


  async fetchDocumentData(car_id) {
    const existed_document_data = await this.carDocumentEntityRepo.find({
      where: { carId: car_id },
    });
    return existed_document_data;
  }
}

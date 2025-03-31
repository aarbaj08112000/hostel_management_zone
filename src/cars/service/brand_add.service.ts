interface AuthObject {
  user: any;
}
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { BrandEntity } from '@repo/source/entities/brand.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
@Injectable()
export class BrandAddService extends BaseService {
  protected readonly log = new LoggerHandler(
    BrandAddService.name,
  ).getInstance();
  protected inputParams: object = {};
  protected blockResult: BlockResultDto;
  protected settingsParams: SettingsParamsDto;
  protected singleKeys: any[] = [];
  protected requestObj: AuthObject = {
    user: {},
  };

  @InjectDataSource()
  protected dataSource: DataSource;
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly response: ResponseLibrary;
  @Inject()
  protected readonly moduleService: ModuleService;
  @InjectRepository(BrandEntity)
  protected brandEntityRepo: Repository<BrandEntity>;

  /**
   * constructor method is used to set preferences while service object initialization.
   */
  constructor() {
    super()
    this.singleKeys = ['custom_unique_condition', 'insert_brand_data', 'update_brand_data'];
    this.moduleName = 'brand';
    this.moduleAPI = '';
    this.serviceConfig = {
      module_name: 'brand',
      table_name: 'brand',
      table_alias: 'b',
      primary_key: 'brandId',
      primary_alias: 'b_brand_id',
      unique_fields: {
        type: 'and',
        fields: {
          brand_code: 'brandCode',
        },
        message: 'Record already exists with this Brand Code',
      },
      expRefer: {},
      topRefer: {},
    };
  }

  async startBrandUpdate(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('update');
      let inputParams = reqParams;
      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.brandUniqueFailure(inputParams);
      } else {
        inputParams = await this.updateBrandData(inputParams);
        if (!_.isEmpty(inputParams.update_brand_data)) {
          outputResponse = this.brandFinishSuccess(inputParams, 'Brand updated successfully.');
        } else {
          outputResponse = this.brandFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> brand_update >>', err);
    }
    return outputResponse;
  }
  async updateBrandData(inputParams: any) {
    let fileInfo: any = {};
    let uploadResult: any = {};
    fileInfo = await this.processFiles(inputParams);
    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('brand_name' in inputParams) {
        queryColumns.brandName = inputParams.brand_name;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('brand_image' in inputParams) {
        queryColumns.brandImage = inputParams.brand_image;
      }
      if ('updated_by' in inputParams) {
        queryColumns.updatedBy = inputParams.updated_by;
      }
      queryColumns.updatedDate = () => 'NOW()';
      const queryObject = this.brandEntityRepo
        .createQueryBuilder()
        .update(BrandEntity)
        .set(queryColumns);
      if (!custom.isEmpty(inputParams.id)) {
        queryObject.andWhere('brandId = :id', { id: inputParams.id });
      }
      const res = await queryObject.execute();
      const data = {
        affected_rows: res.affected,
      };

      const success = 1;
      const message = 'Brand updated successfully.';
      uploadResult = await this.uploadFiles(
        fileInfo,
        inputParams,
      );
      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.update_brand_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }
  async startBrandAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = reqParams;

      inputParams = await this.customUniqueCondition(inputParams);
      if (inputParams.unique_status === 1) {
        outputResponse = this.brandUniqueFailure(inputParams);
      } else {
        inputParams = await this.insertBrandData(inputParams);
        if (!_.isEmpty(inputParams.insert_brand_data)) {
          outputResponse = this.brandFinishSuccess(inputParams, 'Brand Added Successfully.');
        } else {
          outputResponse = this.brandFinishFailure(inputParams);
        }
      }
    } catch (err) {
      this.log.error('API Error >> brand_add >>', err);
    }
    return outputResponse;
  }

  async DeleteBrand(id) {
    let outputResponse = {};

    try {
      this.setModuleAPI('delete');
      const inputParams = await this.deleteBrandData(id);

      if (inputParams.deleted_brand) {
        let job_data = {
          job_function: 'delete_elastic_data',
          job_params: {
            module: 'nest_local_brand',
            data: id
          },
          path: 'api/master/delete-data'
        };
        this.general.submitGearmanJob(job_data);
        outputResponse = this.brandFinishSuccess(inputParams, inputParams.message);
      } else {
        outputResponse = this.brandFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> brand_delete >>', err);
    }
    return outputResponse;
  }

  async deleteBrandData(id: any) {
    try {
      let brandId = id;
      const deleteResult = await this.brandEntityRepo.delete({ brandId });

      if (deleteResult.affected === 0) {
        return { success: 0, message: 'No Brand found.' };
      }

      return {
        success: 1,
        message: 'Brand Deleted Successfully.',
        deleted_brand: deleteResult.affected
      };
    } catch (err) {
      return { success: 0, message: err.message };
    }
  }
  async customUniqueCondition(inputParams: any) {
    let formatData: any = {};
    try {
      //@ts-ignore
      const result = await this.checkUniqueCondition(inputParams);

      formatData = this.response.assignFunctionResponse(result);
      inputParams.custom_unique_condition = formatData;

      inputParams = this.response.assignSingleRecord(inputParams, formatData);
    } catch (err) {
      this.log.error(err);
    }
    return inputParams;
  }

  brandUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Record already exists with this Brand Code'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'brand_add',
      },
    );
  }

  async insertBrandData(inputParams: any) {
    let fileInfo: any = {};
    let uploadResult: any = {};
    fileInfo = await this.processFiles(inputParams);

    this.blockResult = {};
    try {
      const queryColumns: any = {};
      if ('brand_name' in inputParams) {
        queryColumns.brandName = inputParams.brand_name;
      }
      if ('brand_code' in inputParams) {
        queryColumns.brandCode = inputParams.brand_code;
      }
      if ('status' in inputParams) {
        queryColumns.status = inputParams.status;
      }
      if ('brand_image' in inputParams) {
        queryColumns.brandImage = inputParams.brand_image;
      }
      if ('added_by' in inputParams) {
        queryColumns.addedBy = inputParams.added_by;
      }
      queryColumns.addedDate = () => 'NOW()';
      const queryObject = this.brandEntityRepo;
      const res = await queryObject.insert(queryColumns);
      const data = {
        insert_id: res.raw.insertId,
      };
      uploadResult = await this.uploadFiles(
        fileInfo,
        inputParams,
        data.insert_id,
      );
      const success = 1;
      const message = 'Brand Added Successfully.';

      const queryResult = {
        success,
        message,
        data,
      };
      this.blockResult = queryResult;
    } catch (err) {
      this.blockResult.success = 0;
      this.blockResult.message = err;
      this.blockResult.data = [];
    }
    inputParams.insert_brand_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }

  brandFinishSuccess(inputParams: any, message: string) {
    const settingFields = {
      status: 200,
      success: 1,
      message: message,
      fields: [],
    };
    settingFields.fields = ['insert_id', 'insert_brand_data'];

    const outputKeys = ['insert_brand_data'];
    const outputAliases = {
      insert_id: 'id',
    };
    const outputObjects = ['insert_brand_data'];

    const outputData: any = {};
    outputData.settings = settingFields;
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'brand_add';

    funcData.output_keys = outputKeys;
    funcData.output_alias = outputAliases;
    funcData.output_objects = outputObjects;
    funcData.single_keys = this.singleKeys;

    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'brand_list',
      },
    };
    this.general.submitGearmanJob(job_data);
    return this.response.outputResponse(outputData, funcData);
  }

  brandFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'brand_add',
      },
    );
  }
  async uploadFiles(uploadInfo, params, id?) {
    let uploadResults = {};
    const aws_folder = await this.general.getConfigItem('AWS_SERVER');
    for (const key in uploadInfo) {
      if ('name' in uploadInfo[key]) {
        const uploadConfig = {
          source: 'amazon',
          upload_path: `brand_${aws_folder}/`,
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
  async processFile(paramKey, uploadInfo, params) {
    if (paramKey in params && !custom.isEmpty(params[paramKey])) {
      const tmpUploadPath =
        await this.general.getConfigItem('upload_temp_path');
      const filePath = `${tmpUploadPath}${params[paramKey]}`;

      if (this.general.isFile(filePath)) {
        const fileInfo = {
          name: params[paramKey],
          file_name: params[paramKey],
          file_path: filePath,
          file_type: this.general.getFileMime(filePath),
          file_size: this.general.getFileSize(filePath),
          max_size: paramKey === 'car_document' ? 512000 : 102400, // Larger limit for documents
          extensions:
            paramKey === 'car_document'
              ? 'pdf,doc,docx'
              : 'gif,png,jpg,jpeg,jpe,bmp,ico',
        };

        uploadInfo[paramKey] = fileInfo;
        return fileInfo;
      }
    }
    return null;
  }

  async processFiles(params) {
    let uploadInfo = {};

    await Promise.all([
      this.processFile.call(this, 'brand_image', uploadInfo, params)
    ]);

    return uploadInfo;
  }
}

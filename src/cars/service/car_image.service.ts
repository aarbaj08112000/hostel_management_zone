interface AuthObject {
  user: any;
}
import { Inject, Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import * as _ from 'lodash';
import * as custom from '@repo/source/utilities/custom-helper';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto, SettingsParamsDto } from '@repo/source/common/dto/common.dto';

import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';

import { CarImagesEntity } from '../entities/car_images.entity';

import { ModuleService } from '@repo/source/services/module.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Injectable()
export class carImageAddService {
  protected readonly log = new LoggerHandler(
    carImageAddService.name,
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
  @InjectRepository(CarImagesEntity)
  protected carImageEntityRepo: Repository<CarImagesEntity>;

  /**
   * constructor method is used to set preferences while service object initialization.
   */
  constructor() {
    this.singleKeys = ['custom_unique_condition', 'insert_carImage_data'];
  }

  /**
   * startcarImageAdd method is used to initiate api execution flow.
   * @param array reqObject object is used for input request.
   * @param array reqParams array is used for input params.
   * @param array reqFiles array is used for post files.
   * @return array outputResponse returns output response of API.
   */
  async startcarImageAdd(reqObject, reqParams) {
    let outputResponse = {};

    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      let inputParams = reqParams;
      inputParams = await this.insertCarImageData(inputParams);
      if (inputParams?.no_upload == 'Yes') {
        outputResponse = this.carImageFinishFailure(inputParams);
      }
      if (!_.isEmpty(inputParams.insert_carImage_data)) {
        outputResponse = this.carImageFinishSuccess(inputParams);
      } else {
        outputResponse = this.carImageFinishFailure(inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> car_images_add >>', err);
    }
    return outputResponse;
  }

  /**
   * customUniqueCondition method is used to process custom function.
   * @param array inputParams inputParams array to process loop flow.
   * @return array inputParams returns modfied input_params array.
   */
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

  /**
   * carImageUniqueFailure method is used to process finish flow.
   * @param array inputParams inputParams array to process loop flow.
   * @return array response returns array of api response.
   */
  carImageUniqueFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang(
        'Record already exists with these details of carImage Code, State and Country',
      ),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_images_add',
      },
    );
  }

  /**
   * insertcarImageData method is used to process query block.
   * @param array inputParams inputParams array to process loop flow.
   * @return array inputParams returns modfied input_params array.
   */
  async insertCarImageData(inputParams: any) {
    let uploadResult: any = {};
    let uploadConfig: any = {};
    let uploadInfo: any = {};
    let fileProp: any = {};
    let fileInfo: any = {};
    let no_upload = 'No';
    fileInfo = await this.processFiles(inputParams);
    let car_id = inputParams.car_id;
    this.blockResult = {};
    try {
      const car_image_mapping: Record<string, string> = {
        car_id: 'carId',
        car_image: 'imageName',
        image_type: 'imageType',
      };
      const queryColumns: any = [];
      if (
        fileInfo?.car_images?.internal_images.length > 0 &&
        typeof fileInfo.car_images?.internal_images != 'undefined'
      ) {
        Object.values(fileInfo.car_images.internal_images).forEach((files) => {
          const mapped_data = {};
          mapped_data['imageName'] = files['file_name'];
          mapped_data['carId'] = car_id;
          mapped_data['imageType'] = 'interior';
          queryColumns.push(mapped_data);
        });
      }
      if (
        fileInfo?.car_images?.external_images.length > 0 &&
        typeof fileInfo.car_images?.external_images != 'undefined'
      ) {
        Object.values(fileInfo.car_images.external_images).forEach((files) => {
          const mapped_data = {};
          mapped_data['imageName'] = files['file_name'];
          mapped_data['carId'] = car_id;
          mapped_data['imageType'] = 'exterior';
          queryColumns.push(mapped_data);
        });
      }
      if (queryColumns.length <= 0) {
        no_upload = 'Yes';
        inputParams['no_upload'] = 'Yes';
        throw new Error('No data found to upload');
      }
      const queryObject = this.carImageEntityRepo;
      const res = await queryObject.save(queryColumns);

      const data = {
        insert_id: res.map((entry) => entry.carImageId),
      };

      uploadResult = await this.uploadFiles(
        fileInfo.car_images,
        inputParams,
        car_id,
      );
      const success = 1;
      const message = 'Record(s) inserted.';

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
    inputParams.insert_carImage_data = this.blockResult.data;
    inputParams = this.response.assignSingleRecord(
      inputParams,
      this.blockResult.data,
    );

    return inputParams;
  }

  /**
   * carImageFinishSuccess method is used to process finish flow.
   * @param array inputParams inputParams array to process loop flow.
   * @return array response returns array of api response.
   */
  async carImageFinishSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('car image added successfully.'),
      fields: [],
    };
    settingFields.fields = ['insert_id', 'insert_carImage_data'];

    const outputKeys = ['insert_carImage_data'];
    const outputAliases = {
      insert_id: 'id',
    };
    const outputObjects = ['insert_carImage_data'];

    const outputData: any = {};
    outputData.settings = settingFields;
    outputData.data = inputParams;

    const funcData: any = {};
    funcData.name = 'car_images_add';

    funcData.output_keys = outputKeys;
    funcData.output_alias = outputAliases;
    funcData.output_objects = outputObjects;
    funcData.single_keys = this.singleKeys;
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'car_list',
      },
    };
    await this.general.submitGearmanJob(job_data);
    return this.response.outputResponse(outputData, funcData);
  }

  /**
   * carImageFinishFailure method is used to process finish flow.
   * @param array inputParams inputParams array to process loop flow.
   * @return array response returns array of api response.
   */
  carImageFinishFailure(inputParams: any) {
    const settingFields = {
      status: 200,
      success: inputParams?.no_upload ? 1 : 0,
      message: inputParams?.no_upload == 'Yes' ? custom.lang('Images Updated successfully.') : custom.lang('Something went wrong, Please try again.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_images_add',
      },
    );
  } carImageFinishNothingToUpload(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 0,
      message: custom.lang('Nothing to Upload.'),
      fields: [],
    };
    return this.response.outputResponse(
      {
        settings: settingFields,
        data: inputParams,
      },
      {
        name: 'car_images_add',
      },
    );
  }
  async uploadFiles(uploadInfo, params, id?) {
    const aws_folder = await this.general.getConfigItem('AWS_SERVER');
    let uploadResults = {};
    for (const key in uploadInfo) {
      if (uploadInfo[key].length > 0) {
        let car_image_temp = uploadInfo[key];
        for (let i = 0; i < uploadInfo[key].length; i++) {
          const uploadConfig = {
            source: 'amazon',
            upload_path:
              key === 'car_document'
                ? `car_documents/`
                : `car_images_${aws_folder}/${id}/`,
            extensions: car_image_temp[i].extensions,
            file_type: car_image_temp[i].file_type,
            file_size: car_image_temp[i].file_size,
            max_size: car_image_temp[i].max_size,
            src_file: car_image_temp[i].file_path,
            dst_file: car_image_temp[i].name,
          };
          uploadResults[key] = await this.general.uploadFile(
            uploadConfig,
            params,
          );
        }
      }
    }
    return uploadResults;
  }
  async processFile(paramKey, uploadInfo, params) {
    let image_temp_info = { internal_images: [], external_images: [] };

    if (paramKey in params && !custom.isEmpty(params[paramKey])) {
      const tmpUploadPath =
        await this.general.getConfigItem('upload_temp_path');
      let car_images = params[paramKey];
      Object.entries(car_images).forEach(([key, images]) => {
        if (Array.isArray(images)) {
          images.forEach((image) => {
            const filePath = `${tmpUploadPath}${image}`;
            if (this.general.isFile(filePath)) {
              const fileInfo = {
                name: image,
                file_name: image,
                file_path: filePath,
                file_type: this.general.getFileMime(filePath),
                file_size: this.general.getFileSize(filePath),
                max_size: paramKey === 'car_document' ? 512000 : 102400,
                extensions:
                  paramKey === 'car_document'
                    ? 'pdf,doc,docx'
                    : 'gif,png,jpg,jpeg,jpe,bmp,ico,webp',
              };
              if (key === 'internal_images') {
                image_temp_info.internal_images.push(fileInfo);
              } else if (key === 'external_images') {
                image_temp_info.external_images.push(fileInfo);
              }
            }
          });
        }
      });

      uploadInfo[paramKey] = image_temp_info;
    }

    return null;
  }

  async processFiles(params) {
    let uploadInfo = {};

    await Promise.all([
      this.processFile.call(this, 'car_images', uploadInfo, params),
    ]);
    return uploadInfo;
  }
  async fetchImageData(car_id) {
    const existed_image_data = await this.carImageEntityRepo.find({
      where: { carId: car_id },
    });
    return existed_image_data
  }
}

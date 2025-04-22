import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { BlockResultDto } from '@repo/source/common/dto/common.dto';
import { SettingsParamsDto } from '@repo/source/common/dto/common.dto';
import { DataSource, Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { ModuleService } from '@repo/source/services/module.service';
import { ConfigService } from '@nestjs/config';
import { TestDriveEntity } from '../entities/test-drive.entity';
import { CarEntity } from '../entities/cars.entity';
// import { AdminEntity } from '../entities/admin.entity';
// import { LocationsEntity } from '../entities/locations.entity';
// import { CountryEntity } from '../entities/country.entity';
// import { StateEntity } from '../entities/state.entity';
// import { CustomerEntity } from '../entities/customer.entity';
import { LookupEntity } from '@repo/source/entities/lookup.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as custom from '@repo/source/utilities/custom-helper';
import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable()
export class TestDriveAddFrontService extends BaseService {
  private keycloakUrl: string;
  private keycloakRealm: string;
  protected readonly log = new LoggerHandler(TestDriveAddFrontService.name).getInstance();
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
  @InjectRepository(CarEntity)
  protected carRepo: Repository<CarEntity>;
  // @InjectRepository(AdminEntity)
  // protected adminRepo: Repository<AdminEntity>;
  // @InjectRepository(LocationsEntity)
  // protected locationRepo: Repository<LocationsEntity>;
  // @InjectRepository(CountryEntity)
  // protected countryRepo: Repository<CountryEntity>;
  // @InjectRepository(StateEntity)
  // protected stateRepo: Repository<StateEntity>;
  @InjectRepository(LookupEntity)
  protected lookupRepo: Repository<LookupEntity>;

  constructor(
    private configService: ConfigService,
  ) {
    super();
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_BASE_URL');
    this.keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM');
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

  async startTestDriveAdd(request, reqParams) {
    let outputResponse = {};

    try {
      const accessToken = request.cookies['front-access-token'];
      if (!accessToken) {
        return {
          status: 400,
          success: 0,
          message: 'Access token not found in cookies.',
        };
      }

      // Fetch user details from Keycloak using the access token
      const username = await this.general.getUsernameFromKeycloak(accessToken, this.keycloakUrl, this.keycloakRealm);
      if (!username) {
        return {
          status: 401,
          success: 0,
          message: 'Unauthorized user',
        };
      }
      // Fetch user ID from our database
    //   const user = await this.customerRepo.findOne({ where: { phoneNumber: username } });
    const user = await this.lookupRepo
    .createQueryBuilder('mod_customer')
    .where("JSON_UNQUOTE(JSON_EXTRACT(mod_customer.entityJson, '$.phoneNumber')) = :phoneNumber", {
      phoneNumber: username,
    }).andWhere("mod_customer.entityName = :entityName", {
        entityName: 'customer', 
      })
    .getOne();
      if (!user) {
        return {
          status: 404,
          success: 0,
          message: 'User not found',
        };
      }

      reqParams['added_by'] = user.entityId;
      reqParams['customer_id'] = user.entityId;

      this.inputParams = reqParams;
      this.setModuleAPI('add');
      let inputParams = await this.insertTestDriveData(reqParams);
      if (!_.isEmpty(inputParams.insert_test_drive_data)) {
        outputResponse = this.testDriveFinishSuccess(inputParams, 'Test Drive added successfully.');
      } else {
        outputResponse = this.testDriveFinishFailure(inputParams);
      }

    } catch (err) {
        console.log(err)
      this.log.error('API Error >> test_drive_add_front >>', err);
    }
    return outputResponse;
  }

  async insertTestDriveData(inputParams: any) {
    let fileInfo: any = await this.processFiles(inputParams);
    this.blockResult = {};

    try {
      const queryColumns: any = {};
      let contactPerson;
      let location;
      let country;
      let state;
      if ('car_slug' in inputParams) {
        const carData = await this.carRepo
          .createQueryBuilder('car')
          .select(['car.carId', 'car.locationId', 'car.contactPersonId'])
          .where('car.slug = :slug', { slug: inputParams.car_slug })
          .getOne();
        if (!carData) {
          throw new Error('Invalid car_slug provided.');
        }
        queryColumns.carId = carData.carId;
        queryColumns.locationId = carData.locationId;

        if (carData.contactPersonId) {
          contactPerson = await this.lookupRepo
            .createQueryBuilder('lookup')
            .where("JSON_UNQUOTE(JSON_EXTRACT(lookup.entityJson, '$.id')) = :id", {
                id: carData.contactPersonId,
            }).andWhere("lookup.entityName = :entityName", {
                entityName: 'user', 
              })
            .getOne();
            contactPerson = contactPerson.entityJson
          queryColumns.salesExecutiveId = carData.contactPersonId
        }

        if (carData.locationId) {
             let temp_location = await this.lookupRepo
            .createQueryBuilder('lookup')
            .where("JSON_UNQUOTE(JSON_EXTRACT(lookup.entityJson, '$.location_id')) = :location_id", {
                location_id: carData.locationId,
            }).andWhere("lookup.entityName = :entityName", {
                entityName: 'location', 
              })
            .getOne();
            location = temp_location.entityJson
        }
      }

      queryColumns.type = 'AtShowroom';
      if ('customer_id' in inputParams) queryColumns.customerId = inputParams.customer_id;
      if ('slot_date' in inputParams) queryColumns.slotDate = inputParams.slot_date;
      if ('slot_time' in inputParams) queryColumns.slotTime = inputParams.slot_time;
      if ('remarks' in inputParams) queryColumns.remarks = inputParams.remarks;
      if ('consent_info' in inputParams) queryColumns.consentInfo = inputParams.consent_info;
      queryColumns.status = 'Scheduled';
      if ('added_by' in inputParams) queryColumns.addedBy = inputParams.added_by;
      queryColumns.addedDate = () => 'NOW()';
      const licenseHolderDetails = {
        salutation: inputParams.salutation || null,
        first_name: inputParams.first_name || null,
        last_name: inputParams.last_name || null,
        dial_code: inputParams.dial_code || null,
        phone: inputParams.phone || null,
        email: inputParams.email || null,
        address: inputParams.address || null,
      };
      queryColumns.licenseHolderDetails = JSON.stringify(licenseHolderDetails);

      const locationDetails = {
        name: location.location_name || null,
        code: location.location_code || null,
        address: location.address || null,
        zip_code: location.zipCode || null,
        city: location.city || null,
        state_name: location.state || null,
        state_code: location.state_code || null,
        country_name: location.country_name || null,
        country_code: location.country_code || null,
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        google_address: location.google_address || null
      };
      const formattedSlotDate = moment(inputParams.slot_date).format('dddd, DD MMMM YYYY');

      // Determine time of day (Morning / Afternoon / Evening / Night)
      const getTimeOfDay = (timeRange: string) => {
        const startHour = parseInt(timeRange.split(':')[0]);
        if (startHour >= 5 && startHour < 12) return 'Morning';
        if (startHour >= 12 && startHour < 17) return 'Afternoon';
        if (startHour >= 17 && startHour < 21) return 'Evening';
        return 'Night';
      };

      const formattedSlotTime = (() => {
        const timeRange = inputParams.slot_time || '';
        const [startTime, endTime] = timeRange.split(' - ');

        const formatTime = (time: string) => {
          const m = moment(time, 'HH:mm:ss');
          return `${m.format('HH')}h${m.format('mm')}`;
        };

        const timeOfDay = getTimeOfDay(startTime);
        return `${timeOfDay} ${formatTime(startTime)} - ${formatTime(endTime)}`;
      })();

      const formattedSlotInfo = `${formattedSlotDate}, ${formattedSlotTime}`;

      let code = await this.general.getCustomToken('test_drive', 'TD', 'Add');
      if (code != '') {
        queryColumns.code = code;
      }

      if ('attachment' in inputParams) {
        queryColumns.attachment = inputParams.attachment;
      }

      const res = await this.testDriveRepo.insert(queryColumns);
      const data = { insert_id: res.raw.insertId, code: code, customer_details: licenseHolderDetails, contact_person_details: contactPerson, location_details: locationDetails, slot_details: formattedSlotInfo };

      await this.uploadFiles(fileInfo, inputParams, data.insert_id);

      this.blockResult = {
        success: 1,
        message: 'Test Drive added successfully.',
        data,
      };
    } catch (err) {
        console.log(err)
      this.blockResult = { success: 0, message: err, data: [] };
    }

    inputParams.insert_test_drive_data = this.blockResult.data;
    return this.response.assignSingleRecord(inputParams, this.blockResult.data);
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

  async testDriveFinishSuccess(inputParams: any, message: string) {
    let job_data = {
      job_function: 'sync_elastic_data',
      job_params: {
        module: 'test_drive_list',
        data: inputParams.insert_id ? inputParams.insert_id : inputParams.id
      },
    };
    await this.general.submitGearmanJob(job_data);

    delete inputParams.insert_test_drive_data.insert_id;

    return {
      settings: {
        status: 200,
        success: 1,
        message,
      },
      data: inputParams.insert_test_drive_data,
    }
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
      { name: 'test_drive_add_front' },
    );
  }
}

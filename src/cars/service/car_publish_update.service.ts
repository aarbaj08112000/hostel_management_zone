import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { CarEntity, Status } from '../entities/cars.entity';
import { ElasticService } from '@repo/source/services/elastic.service';
import { error } from 'console';

@Injectable()
export class CarPublishUpdateService {
  @Inject()
  protected readonly general: CitGeneralLibrary;
  @Inject()
  protected readonly elasticService: ElasticService;
  constructor(
    @InjectRepository(CarEntity)
    private readonly carRepository: Repository<CarEntity>,
  ) { }

  async updateCarStatus(inputParams) {
    try {
      
      const fetch_existing = await this.elasticService.getById(
        inputParams.car_id,
        'nest_local_cars',
        'id',
      );
      let res = this.getMissingRequiredFields(fetch_existing)
      console.log(res)
      if (res.length > 0) {
        return {
          success: 0,
          data: res
        }
      }
      let data = await this.startUpdate(inputParams)
      console.log(data)
      let car_name = fetch_existing.carName;
      if (data.success) {
        let value_json = {
          "CAR_NAME": car_name,
          "STATUS": inputParams.is_listed == 'Yes' ? 'Published' : 'Unpublished',
          "CAR_ID": inputParams.car_id,
          "UPDATED_BY": await this.general.getAdminName(inputParams.updated_by),
          "UPDATED_BY_ID": inputParams.updated_by
        }
        await this.general.addActivity('car', 'publish', inputParams.updated_by, value_json, inputParams.car_id);
      }
      return data;
    } catch (err) {
      console.log(err)
    }
  }
  async startUpdate(inputParams) {
    try {
      const { car_slug, car_id, is_listed, updated_by } = inputParams;

      const whereCondition = car_slug ? { slug: car_slug } : { carId: car_id };
      const car = await this.carRepository.findOne({ where: whereCondition });

      if (!car) {
        throw new HttpException('No car found with the provided details.', HttpStatus.NOT_FOUND);
      }
      if(car.status == Status.Draft){
        throw error('')
      }
      car.isListed = is_listed;
      car.updatedBy = updated_by;
      car.updatedDate = new Date();
      await this.carRepository.save(car);

      let job_data = {
        job_function: 'sync_elastic_data',
        job_params: {
          module: 'car_list',
          data: car_id
        },
      };
      await this.general.submitGearmanJob(job_data);

      return {
        success: 1,
        message: is_listed === 'Yes'
          ? 'The car has been successfully published and is now visible to users.'
          : 'The car has been unpublished and is no longer visible to users.',
      };
    } catch (err) {
      console.error(err);
      return {
        success: 0,
        message: err.message || 'An unexpected error occurred while updating car status.',
      };
    }
  }
  getMissingRequiredFields(data: any) {
    let requiredFields: Record<string, { key: string; label: string }> = {
      // CarAddDto
      location_id: { key: 'location_id', label: 'Location ID' },
      export_status: { key: 'export_status', label: 'Export Status' },
      car_name: { key: 'carName', label: 'Car Name' },
      price: { key: 'price', label: 'Price' },
      slug: { key: 'car_slug', label: 'Slug' },

      // CarDetailsDto
      brand_id: { key: 'brand_id', label: 'Brand ID' },
      model_id: { key: 'car_model', label: 'Model ID' },
      body_id: { key: 'bodyId', label: 'Body ID' },
      fuel_type: { key: 'fuelType', label: 'Fuel Type' },
      manufacture_year: { key: 'manufactureYear', label: 'Manufacture Year' },
      transmission_type: { key: 'transmissionType', label: 'Transmission Type' },
      exterior_colorId: { key: 'exterior_color', label: 'Exterior Color ID' },
      interior_colorId: { key: 'interior_color', label: 'Interior Color ID' },
      steering_side: { key: 'steeringSide', label: 'Steering Side' },
      regional_specsId: { key: 'regionalSpecsId', label: 'Regional Specs ID' },
      // driven_distance: { key: 'drivenDistance', label: 'Driven Distance' },
    };
    if('fuelType' in data && data?.fuelType == 'Electric'){
      requiredFields = {...requiredFields, battery_capacity: { key: 'batteryCapacity', label: 'Battery Capacity' }, charging_time: { key: 'chargingTime', label: 'Charging Time' }, range: { key: 'range', label: 'Range' },}
    }else{
      requiredFields = {...requiredFields, engine_capacity: { key: 'engineCapacity', label: 'Engine Capacity' }, engine_size: { key: 'engineSize', label: 'Engine Size' }, horse_power: { key: 'horsePower', label: 'Horse Power' },}
    }
    const missingFields: { field: string; message: string }[] = [];

    for (const [fieldName, { key, label }] of Object.entries(requiredFields)) {
      const value = data[key];
      const isEmpty = value === null || value === undefined || value === '';

      if (isEmpty) {
        missingFields.push({
          field: key,
          message: `Please Add Data for ${label} field. Before Publishing`,
        });
      }
    }

    return missingFields;
  }

}


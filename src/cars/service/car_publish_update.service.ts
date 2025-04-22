import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { CarEntity } from '../entities/cars.entity';

@Injectable()
export class CarPublishUpdateService {
  @Inject()
  protected readonly general: CitGeneralLibrary;
  constructor(
    @InjectRepository(CarEntity)
    private readonly carRepository: Repository<CarEntity>,
  ) { }

  async updateCarStatus(inputParams) {
    let data = await this.startUpdate(inputParams)
    if (data.success) {
      let value_json = {
        "CAR_NAME": inputParams.car_id,
        "STATUS": inputParams.is_listed == 'Yes' ? 'Published' : 'Unpublished',
        "CAR_ID": inputParams.car_id,
        "UPDATED_BY": await this.general.getAdminName(inputParams.updated_by),
        "UPDATED_BY_ID": inputParams.updated_by
      }
      await this.general.addActivity('car', 'publish', inputParams.updated_by, value_json, inputParams.car_id);
    }
    return data;
  }
  async startUpdate(inputParams) {
    try {
      const { car_slug, car_id, is_listed, updated_by } = inputParams;

      const whereCondition = car_slug ? { slug: car_slug } : { carId: car_id };
      const car = await this.carRepository.findOne({ where: whereCondition });

      if (!car) {
        throw new HttpException('No car found with the provided details.', HttpStatus.NOT_FOUND);
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
}

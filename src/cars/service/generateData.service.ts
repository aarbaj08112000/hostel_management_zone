import { CarEntity } from '../entities/cars.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
@Injectable()
export class GenerateViews {
  @Inject()
  protected readonly general: CitGeneralLibrary;
  constructor(
    @InjectRepository(CarEntity)
    private readonly carsRepo: Repository<CarEntity>,
  ) {}

  async updateGenerateViews(inputParams: any) {
    try {
        if(!('car_id' in inputParams )){
            throw new Error('please enter value for car_id')
        }
        let carId = inputParams?.car_id;
        let min = inputParams?.min
        let max = inputParams?.max
        let viewGenerate = await this.general.getConfigItem('VIEWS_GENERATE');

        viewGenerate = viewGenerate.split('-')
        min = typeof min != 'undefined' && min != '' ? min : viewGenerate[0];
        max = typeof max != 'undefined' && max != '' ? max : viewGenerate[1];
        if(min > max){
            throw new Error('max should be greater than min')
        }
        let generatedViews = await this.general.getRandomInt(min,max)
        const generatedView = generatedViews
      
        let wishGenerate = await this.general.getConfigItem('WISHLIST_GENERATE')
        wishGenerate = wishGenerate.split('-')
        let generatedWishLists = await this.general.getRandomInt(wishGenerate[0],wishGenerate[1])
        const generatedWishList = generatedWishLists
        const result = await this.carsRepo
            .createQueryBuilder()
            .update(CarEntity)
            .set({ generatedView , generatedWishList })
            .where('carId = :carId', { carId })
            .execute();

        if (result.affected === 0) {
            return {
            success: 0,
            message: 'No car found with the given ID.',
            };
        }
    let job_data = {
        job_function: 'sync_elastic_data',
        job_params: {
          module: 'car_list',
          data: carId
        },
      };
      await this.general.submitGearmanJob(job_data);
        return {
            success: 1,
            message: 'generateViews updated successfully.',
            affected: result.affected,
        };
    } catch (err) {
      return {
        success: 0,
        message: err.message,
      };
    }
  }
}

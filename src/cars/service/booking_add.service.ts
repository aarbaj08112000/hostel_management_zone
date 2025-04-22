import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LoggerHandler } from '@repo/source/utilities/logger-handler';
import { ResponseLibrary } from '@repo/source/utilities/response-library';
import { CitGeneralLibrary } from '@repo/source/utilities/cit-general-library';
import { Booking, BookingService, BookingCharges } from '../entities/booking.entity';
import { ChargesEntity } from '../entities/charges.entity';
import { Payment, PAYMENTMODE, PAYMENTTYPE, STATUS } from '../entities/payment.entity';
// import { Service } from '../entities/service_master.entity';
import { CarEntity } from '../entities/cars.entity';
import { BOOKINGSTATUS, PAYMENTSTATUS, SOURCE } from '../entities/booking.entity';
import { BaseService } from '@repo/source/services/base.service';
import * as _ from 'lodash';

@Injectable()
export class BookingAddService extends BaseService {
  protected readonly log = new LoggerHandler(BookingAddService.name).getInstance();
  protected requestObj: any = {};
  protected inputParams: any = {};

  @InjectDataSource()
  protected dataSource: DataSource;

  @Inject() protected readonly general: CitGeneralLibrary;
  @Inject() protected readonly response: ResponseLibrary;

  @InjectRepository(Booking)
  protected bookingRepo: Repository<Booking>;
  @InjectRepository(CarEntity)
  protected carRepo: Repository<CarEntity>;
  @InjectRepository(ChargesEntity)
  protected chargesRepo: Repository<ChargesEntity>;
  // @InjectRepository(Service)
  // protected serviceRepo: Repository<Service>;
  @InjectRepository(BookingCharges)
  protected bookingChargesRepo: Repository<BookingCharges>;
  @InjectRepository(BookingService)
  protected bookingServiceRepo: Repository<BookingService>;
  @InjectRepository(Payment)
  protected paymentRepo: Repository<Payment>;

  constructor() {
    super();
    this.moduleName = 'booking';
    this.serviceConfig = {
      module_name: 'booking',
      table_name: 'booking',
      table_alias: 'b',
      primary_key: 'bookingId',
      primary_alias: 'b_booking_id',
    };
  }

  async startBookingAdd(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;
      this.setModuleAPI('add');

      reqParams = await this.insertBooking(reqParams);
      outputResponse = !_.isEmpty(reqParams.insert_booking)
        ? this.bookingFinishSuccess(reqParams)
        : this.bookingFinishFailure(reqParams);
    } catch (err) {
      this.log.error('API Error >> booking_add >>', err);
    }
    return outputResponse;
  }

  async insertBooking(inputParams: any) {
    try {
      const carDetails = await this.carRepo.findOne({
        where: { carId: inputParams.car_id },
        select: ['locationId'],
      });

      const queryColumns: any = {};
      if ('car_id' in inputParams) queryColumns.carId = inputParams.car_id;
      if ('customer_id' in inputParams) queryColumns.customerId = inputParams.customer_id;
      if ('total_price' in inputParams) queryColumns.totalPrice = inputParams.total_price;
      if ('discount_price' in inputParams) queryColumns.discountPrice = inputParams.discount_price;
      if ('added_by' in inputParams) queryColumns.addedBy = inputParams.added_by;
      queryColumns.addedDate = () => 'NOW()';
      queryColumns.locationId = carDetails.locationId;

      const final_price = inputParams.total_price - inputParams.discount_price;
      queryColumns.finalPrice = final_price;
      queryColumns.amountPaid = 0;
      queryColumns.source = SOURCE.ADMIN;
      queryColumns.status = BOOKINGSTATUS.DRAFT;
      queryColumns.paymentStatus = PAYMENTSTATUS.NA;

      let code = await this.general.getCustomToken('booking', 'BK', 'Add');
      if (code != '') {
        queryColumns.code = code;
      }

      const result = await this.bookingRepo.insert(queryColumns);
      const data = { insert_id: result.raw.insertId, code: code };

      inputParams.insert_booking = data;
    } catch (err) {
      this.log.error('Booking Insert Error', err);
      inputParams.insert_booking = {};
    }
    return inputParams;
  }

  async updateBooking(inputParams: any) {
    try {
      const { id, charges_ids = [], service_ids = [], updated_by, amount_paid, payment_status, status } = inputParams;

      let totalChargesPrice = 0;
      let totalServicesPrice = 0;

      // Fetch and insert charges
      if ('charges_ids' in inputParams && charges_ids.length > 0) {
        const charges = await this.chargesRepo
          .createQueryBuilder('c')
          .where('c.id IN (:...ids)', { ids: charges_ids })
          .getMany();

        for (const charge of charges) {
          totalChargesPrice += Number(charge.value);
          await this.bookingChargesRepo.insert({
            bookingId: id,
            chargesId: charge.id,
          });
        }
      }

      // Fetch and insert services
      // if ('service_ids' in inputParams && service_ids.length > 0) {
      //   const services = await this.serviceRepo
      //     .createQueryBuilder('s')
      //     .where('s.serviceId IN (:...ids)', { ids: service_ids })
      //     .getMany();

      //   for (const service of services) {
      //     totalServicesPrice += Number(service.price);
      //     await this.bookingServiceRepo.insert({
      //       bookingId: id,
      //       serviceId: service.serviceId,
      //     });
      //   }
      // }

      const booking = await this.bookingRepo.findOne({ where: { id: id } });
      const updatedFinalPrice = Number(booking.finalPrice) + totalChargesPrice + totalServicesPrice;

      const updatePayload: any = {
        finalPrice: updatedFinalPrice,
        updatedBy: updated_by,
        updatedDate: () => 'NOW()',
      };

      if (amount_paid !== undefined) {
        updatePayload.amountPaid = amount_paid;
      }

      if (payment_status !== undefined) {
        updatePayload.paymentStatus = payment_status;
      }

      if (status !== undefined) {
        updatePayload.status = status;
      }

      // Perform the update
      await this.bookingRepo.update(id, updatePayload);

      if (payment_status === 'FullyPaid' && amount_paid !== undefined) {

        let code = await this.general.getCustomToken('payment', 'TRX', 'Add');

        await this.paymentRepo.insert({
          bookingId: id,
          transactionCode: code,
          amount: amount_paid,
          paymentMode: PAYMENTMODE.CASH,
          paymentType: PAYMENTTYPE.FULLPAYMENT,
          status: STATUS.FULLYPAID,
        });
      }


      return {
        status: 200,
        success: 1,
        message: 'Booking updated successfully.',
        data: {
          id,
          final_price: updatedFinalPrice,
        },
      };
    } catch (error) {
      this.log.error('Error', error);
      return {
        status: 500,
        success: 0,
        message: 'Failed to update booking.',
      };
    }
  }

  bookingFinishSuccess(inputParams: any) {
    return {
      settings: {
        status: 200,
        success: 1,
        message: 'Booking added successfully.',
      },
      data: inputParams.insert_booking,
    }
  }

  bookingFinishFailure(inputParams: any) {
    return this.response.outputResponse(
      {
        settings: {
          status: 200,
          success: 0,
          message: 'Something went wrong, please try again.',
          fields: [],
        },
        data: inputParams,
      },
      { name: 'booking_add' },
    );
  }
}

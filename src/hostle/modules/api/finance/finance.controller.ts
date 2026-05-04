import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments/services/payments.service';
import { PaymentAllocationsService } from './payment_allocations/services/payment_allocations.service';
import { DepositsService } from './deposits/services/deposits.service';
import { InvoicesService } from './invoices/services/invoices.service';
import { PaymentsDto, UpdatePaymentsDto } from './payments/dto/payments.dto';
import { PaymentAllocationsDto, UpdatePaymentAllocationsDto } from './payment_allocations/dto/payment_allocations.dto';
import { DepositsDto, UpdateDepositsDto } from './deposits/dto/deposits.dto';
import { InvoicesDto, UpdateInvoicesDto } from './invoices/dto/invoices.dto';
import { PaymentsAddService } from './payments/services/payments.add.service';
import { PaymentAllocationsAddService } from './payment_allocations/services/payment_allocations.add.service';
import { DepositsAddService } from './deposits/services/deposits.add.service';
import { InvoiceAddService } from './invoices/services/invoices.add.services';

import { ListDto } from 'src/hostle/dto/common-list.dto';
import { DetailDto } from 'src/hostle/dto/common-detail.dto';
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly payment_allocationsService: PaymentAllocationsService,
    private readonly depositsService: DepositsService,
    private readonly invoicesService: InvoicesService,
    private readonly paymentsAddService: PaymentsAddService,
    private readonly payment_allocationsAddService: PaymentAllocationsAddService,
    private readonly depositsAddService: DepositsAddService,
    private readonly invoicesAddService: InvoiceAddService,
  ) { }

  @Get()
  async sayHello() {
    return 'hello Finance';
  }

  // Payments
  @Post('payments-add')
  async addPayment(@Req() req: Request, @Body() body: PaymentsDto) {
    return await this.paymentsAddService.startPaymentAdd(req, body);
  }
  @Post('payments-update')
  async updatePayment(@Req() req: Request, @Body() body: UpdatePaymentsDto) {
    return await this.paymentsAddService.startPaymentUpdate(req, body);
  }

  // Payment Allocations
  @Post('payment-allocations-add')
  async addPaymentAllocation(@Req() req: Request, @Body() body: PaymentAllocationsDto) {
    return await this.payment_allocationsAddService.startAllocationAdd(req, body);
  }

  // Deposits
  @Post('deposits-add')
  async addDeposit(@Req() req: Request, @Body() body: DepositsDto) {
    return await this.depositsAddService.startDepositAdd(req, body);
  }
  @Post('deposits-update')
  async updateDeposit(@Req() req: Request, @Body() body: UpdateDepositsDto) {
    return await this.depositsAddService.startDepositUpdate(req, body);
  }

  // Invoices
  @Post('invoices-add')
  async addInvoice(@Req() req: Request, @Body() body: InvoicesDto) {
    return await this.invoicesAddService.startInvoiceAdd(req, body);
  }
  @Post('invoices-update')
  async updateInvoice(@Req() req: Request, @Body() body: UpdateInvoicesDto) {
    return await this.invoicesAddService.startInvoiceUpdate(req, body);
  }
  @Post('payments-list')
  async getpaymentsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.paymentsService.startPayments(req, body);
  }

  @Post('payments-details')
  async getpaymentsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.paymentsService.startPaymentDetails(req, body);
  }

  @Post('payment-allocations-list')
  async getpaymentallocationsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.payment_allocationsService.startPaymentAllocations(req, body);
  }

  @Post('payment-allocations-details')
  async getpaymentallocationsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.payment_allocationsService.startPaymentAllocationDetails(req, body);
  }

  @Post('deposits-list')
  async getdepositsList(@Req() req: Request, @Body() body: ListDto) {
    return await this.depositsService.startDeposits(req, body);
  }

  @Post('deposits-details')
  async getdepositsDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.depositsService.startDepositDetails(req, body);
  }

  @Post('invoices-list')
  async getinvoicesList(@Req() req: Request, @Body() body: ListDto) {
    return await this.invoicesService.startInvoices(req, body);
  }

  @Post('invoices-details')
  async getinvoicesDetails(@Req() req: Request, @Body() body: DetailDto) {
    return await this.invoicesService.startInvoiceDetails(req, body);
  }

}

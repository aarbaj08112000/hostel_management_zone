import { Body, Controller, Get, Post, Req, Param, Patch, Delete, Query, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(AnyFilesInterceptor())
  async addPayment(@Req() req: Request, @Body() body: PaymentsDto) {
    return await this.paymentsAddService.startPaymentAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('payments-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updatePayment(@Req() req: Request, @Param('id') id: string, @Body() body: UpdatePaymentsDto) {
    return await this.paymentsAddService.startPaymentUpdate(req, { ...body, id, files: (req as any).files });
  }

  // Payment Allocations
  @Post('payment-allocations-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addPaymentAllocation(@Req() req: Request, @Body() body: PaymentAllocationsDto) {
    return await this.payment_allocationsAddService.startAllocationAdd(req, { ...body, files: (req as any).files });
  }

  // Deposits
  @Post('deposits-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addDeposit(@Req() req: Request, @Body() body: DepositsDto) {
    return await this.depositsAddService.startDepositAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('deposits-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateDeposit(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateDepositsDto) {
    return await this.depositsAddService.startDepositUpdate(req, { ...body, id, files: (req as any).files });
  }
  @Delete('deposits-delete/:id')
  async deleteDeposit(@Param('id') id: string) {
    return await this.depositsAddService.DeleteDeposit(Number(id));
  }

  // Invoices
  @Post('invoices-add')
  @UseInterceptors(AnyFilesInterceptor())
  async addInvoice(@Req() req: Request, @Body() body: InvoicesDto) {
    return await this.invoicesAddService.startInvoiceAdd(req, { ...body, files: (req as any).files });
  }
  @Patch('invoices-update/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateInvoice(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateInvoicesDto) {
    return await this.invoicesAddService.startInvoiceUpdate(req, { ...body, id, files: (req as any).files });
  }
  @Get('payments-list')
  async getpaymentsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.paymentsService.startPayments(req, query);
  }

  @Get('payments-details/:id')
  async getpaymentsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.paymentsService.startPaymentDetails(req, { id });
  }

  @Get('payment-allocations-list')
  async getpaymentallocationsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.payment_allocationsService.startPaymentAllocations(req, query);
  }

  @Get('payment-allocations-details/:id')
  async getpaymentallocationsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.payment_allocationsService.startPaymentAllocationDetails(req, { id });
  }

  @Get('deposits-list')
  async getdepositsList(@Req() req: Request, @Query() query: ListDto) {
    return await this.depositsService.startDeposits(req, query);
  }

  @Get('deposits-details/:id')
  async getdepositsDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.depositsService.startDepositDetails(req, { id });
  }

  @Get('invoices-list')
  async getinvoicesList(@Req() req: Request, @Query() query: ListDto) {
    return await this.invoicesService.startInvoices(req, query);
  }

  @Get('invoices-details/:id')
  async getinvoicesDetails(@Req() req: Request, @Param('id') id: string) {
    return await this.invoicesService.startInvoiceDetails(req, { id });
  }

}

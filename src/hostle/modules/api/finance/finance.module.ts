import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { PaymentsService } from './payments/services/payments.service';
import { PaymentAllocationsService } from './payment_allocations/services/payment_allocations.service';
import { DepositsService } from './deposits/services/deposits.service';
import { InvoicesService } from './invoices/services/invoices.service';
import { PaymentsEntity } from './payments/entities/payments.entity';
import { PaymentAllocationsEntity } from './payment_allocations/entities/payment_allocations.entity';
import { DepositsEntity } from './deposits/entities/deposits.entity';
import { InvoicesEntity } from './invoices/entities/invoices.entity';
import { AttachmentEntity } from '../users/users/entities/users.entity';
import { GlobalModule } from '@repo/source/modules/global.module';
import { PaymentsAddService } from './payments/services/payments.add.service';
import { PaymentAllocationsAddService } from './payment_allocations/services/payment_allocations.add.service';
import { DepositsAddService } from './deposits/services/deposits.add.service';
import { InvoiceAddService } from './invoices/services/invoices.add.services';
import { CommonAttachmentService } from 'src/services/base-file-upload.service';
@Module({
  imports: [
    GlobalModule,
    TypeOrmModule.forFeature([
      PaymentsEntity,
      PaymentAllocationsEntity,
      DepositsEntity,
      InvoicesEntity,
      AttachmentEntity
    ]),
  ],
  controllers: [FinanceController],
  providers: [
    GlobalModule,
    PaymentsService,
    PaymentAllocationsService,
    DepositsService,
    InvoicesService,
    PaymentsAddService,
    PaymentAllocationsAddService,
    DepositsAddService,
    InvoiceAddService,
    CommonAttachmentService
  ],
})
export class FinanceModule {}

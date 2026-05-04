const fs = require('fs');
const path = require('path');

const basePath = 'c:\\Users\\Prince\\hostle_management\\hostle_management\\src\\hostle\\modules\\api';

const configs = [
    {
        controller: 'users/users.controller.ts',
        services: [
            { name: 'users', file: 'users/users/services/users.service.ts', serviceInstance: 'usersService' },
            { name: 'students', file: 'users/students/services/students.service.ts', serviceInstance: 'studentsService' },
            { name: 'stays', file: 'users/stays/services/stays.service.ts', serviceInstance: 'staysService' }
        ]
    },
    {
        controller: 'finance/finance.controller.ts',
        services: [
            { name: 'payments', file: 'finance/payments/services/payments.service.ts', serviceInstance: 'paymentsService' },
            { name: 'payment-allocations', file: 'finance/payment_allocations/services/payment_allocations.service.ts', serviceInstance: 'payment_allocationsService' },
            { name: 'deposits', file: 'finance/deposits/services/deposits.service.ts', serviceInstance: 'depositsService' },
            { name: 'invoices', file: 'finance/invoices/services/invoices.service.ts', serviceInstance: 'invoicesService' }
        ]
    },
    {
        controller: 'operations/operations.controller.ts',
        services: [
            { name: 'maintenance-requests', file: 'operations/maintenance_requests/services/maintenance_requests.service.ts', serviceInstance: 'maintenance_requestsService' },
            { name: 'electricity-readings', file: 'operations/electricity_readings/services/electricity_readings.service.ts', serviceInstance: 'electricity_readingsService' },
            { name: 'visitor-logs', file: 'operations/visitor_logs/services/visitor_logs.service.ts', serviceInstance: 'visitor_logsService' },
            { name: 'complaints', file: 'operations/complaints/services/complaints.service.ts', serviceInstance: 'complaintsService' },
            { name: 'notifications', file: 'operations/notifications/services/notifications.service.ts', serviceInstance: 'notificationsService' }
        ]
    }
];

configs.forEach(config => {
    const ctrlPath = path.join(basePath, config.controller);
    if (!fs.existsSync(ctrlPath)) return;

    let content = fs.readFileSync(ctrlPath, 'utf8');

    // Add ListDto if missing
    if (!content.includes('ListDto')) {
        content = content.replace(
            /(@Controller)/,
            "import { ListDto } from 'src/hostle/dto/common-list.dto';\n$1"
        );
    }

    let injections = '';

    config.services.forEach(svc => {
        const servicePath = path.join(basePath, svc.file);
        if (!fs.existsSync(servicePath)) return;

        const svcContent = fs.readFileSync(servicePath, 'utf8');

        // Find list method e.g. startUsers(req, params) -> "startUsers"
        let listMethodMatch = svcContent.match(/async\s+(start[A-Z][a-zA-Z0-9_]*)\(reqObject/);
        if (!listMethodMatch) {
            listMethodMatch = svcContent.match(/async\s+(start[A-Z][a-zA-Z0-9_]*)\(/);
        }
        const listMethod = listMethodMatch ? listMethodMatch[1] : null;

        // Find details method e.g. startUserDetails
        const detailMethodMatch = svcContent.match(/async\s+(start[A-Z][a-zA-Z0-9_]*Details)\(/);
        const detailMethod = detailMethodMatch ? detailMethodMatch[1] : null;

        if (listMethod && !content.includes(`@Post('${svc.name}-list')`)) {
            injections += `
  @Post('${svc.name}-list')
  async get${svc.name.replace(/-/g, '')}List(@Req() req: Request, @Body() body: ListDto) {
    return await this.${svc.serviceInstance}.${listMethod}(req, body);
  }
`;
        }

        if (detailMethod && !content.includes(`@Post('${svc.name}-details')`)) {
            injections += `
  @Post('${svc.name}-details')
  async get${svc.name.replace(/-/g, '')}Details(@Req() req: Request, @Body() body: ListDto) {
    return await this.${svc.serviceInstance}.${detailMethod}(req, body);
  }
`;
        }
    });

    if (injections.trim() !== '') {
        content = content.replace(/\s*}\s*$/, injections + '\n}\n');
        fs.writeFileSync(ctrlPath, content, 'utf8');
        console.log(`Updated ${config.controller}`);
    }
});

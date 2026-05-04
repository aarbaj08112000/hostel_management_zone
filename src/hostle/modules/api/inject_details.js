const fs = require('fs');
const path = require('path');

const basePath = 'c:\\Users\\Prince\\hostle_management\\hostle_management\\src\\hostle\\modules\\api';

const files = [
    'core/amenities/services/amenities.service.ts',
    'core/food_plans/services/food_plans.service.ts',
    'core/hostel_amenities/services/hostel_amenities.service.ts',
    'core/student_food_plans/services/student_food_plans.service.ts',
    'finance/deposits/services/deposits.service.ts',
    'finance/invoices/services/invoices.service.ts',
    'finance/payment_allocations/services/payment_allocations.service.ts',
    'finance/payments/services/payments.service.ts',
    'operations/complaints/services/complaints.service.ts',
    'operations/electricity_readings/services/electricity_readings.service.ts',
    'operations/maintenance_requests/services/maintenance_requests.service.ts',
    'operations/notifications/services/notifications.service.ts',
    'operations/visitor_logs/services/visitor_logs.service.ts',
    'users/stays/services/stays.service.ts',
    'users/students/services/students.service.ts',
    'users/users/services/users.service.ts'
];

files.forEach(file => {
    const fullPath = path.join(basePath, file);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Skip if already contains details method
    if (content.includes('DetailsFinishedSuccess')) {
        console.log(`Skipping ${file} - already has details method`);
        return;
    }

    // Find the entity name and the primary entity alias from query
    const entityMatch = content.match(/getRepository\(([A-Za-z0-9]+)\)/);
    if (!entityMatch) return;
    const entityName = entityMatch[1];

    const queryAliasMatch = content.match(/\.createQueryBuilder\('([a-z_]+)'\)/);
    const alias = queryAliasMatch ? queryAliasMatch[1] : 't';

    const successMethodMatch = content.match(/(\w+)FinishedSuccess\(/);
    if (!successMethodMatch) return;
    const listName = successMethodMatch[1]; // e.g., 'amenities'
    const singularName = listName.endsWith('s') ? listName.slice(0, -1) : listName + '_detail';
    const detailKey = singularName + '_details';

    const finishSuccessMethodRegex = new RegExp(`${listName}FinishedSuccess\\(inputParams: any\\) \\{[\\s\\S]*?return this.response.outputResponse\\(outputData, funcData\\);\\s*\\}`);
    const match = content.match(finishSuccessMethodRegex);
    if (!match) return;

    const originalSuccessMethod = match[0];
    const settingFieldsMatch = originalSuccessMethod.match(/fields:\s*\[([\s\S]*?)\]/);
    const fieldsArray = settingFieldsMatch ? settingFieldsMatch[1] : '';

    // E.g., amenities_id, user_id, etc.
    // We'll approximate the primary key for the .where().
    const primaryIdField = Array.from(fieldsArray.matchAll(/'([^']+)'/g)).map(m => m[1]).find(f => f.endsWith('_id') || f === 'id');

    const detailsCode = `

  async start${singularName.charAt(0).toUpperCase() + singularName.slice(1)}Details(reqObject, reqParams) {
    let outputResponse = {};
    try {
      this.requestObj = reqObject;
      this.inputParams = reqParams;

      this.inputParams = await this.get${singularName.charAt(0).toUpperCase() + singularName.slice(1)}Details(this.inputParams);
      if (!_.isEmpty(this.inputParams.${detailKey})) {
        outputResponse = this.${singularName}DetailsFinishedSuccess(this.inputParams);
      } else {
        outputResponse = this.${listName}FinishedFailure(this.inputParams);
      }
    } catch (err) {
      this.log.error('API Error >> ${detailKey} >>', err);
    }
    return outputResponse;
  }

  async get${singularName.charAt(0).toUpperCase() + singularName.slice(1)}Details(inputParams: any) {
    this.blockResult = {};
    try {
      const query = this.dataSource
        .getRepository(${entityName})
        .createQueryBuilder('${alias}');

      if (!custom.isEmpty(inputParams.id)) {
        query.where('${alias}.${primaryIdField || 'id'} = :id', { id: inputParams.id });
      } else {
        throw new Error('ID is required.');
      }

      const data = await query.getOne();
      if (_.isEmpty(data)) throw new Error('No records found.');

      this.blockResult = { success: 1, message: 'Record found.', data };
    } catch (err) {
      this.blockResult = { success: 0, message: err.message, data: {} };
    }

    inputParams.${detailKey} = this.blockResult.data;
    return inputParams;
  }

  ${singularName}DetailsFinishedSuccess(inputParams: any) {
    const settingFields = {
      status: 200,
      success: 1,
      message: custom.lang('${singularName.charAt(0).toUpperCase() + singularName.slice(1).replace(/_/g, ' ')} details found.'),
      fields: [${fieldsArray}],
    };

    const outputData: any = { settings: settingFields, data: inputParams };
    const funcData: any = {
      name: '${detailKey}',
      single_keys: ['${detailKey}'],
    };

    return this.response.outputResponse(outputData, funcData);
  }
`;

    // Insert exactly after the finishSuccess method
    content = content.replace(originalSuccessMethod, originalSuccessMethod + detailsCode);

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Injected details logic into ${file}`);
});

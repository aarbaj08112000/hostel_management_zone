// generate-dtos.js
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'src/hostle/dto');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const tables = {
  amenities: {
    amenity_id: 'number',
    amenity_name: 'string',
    description: 'string',
  },
  beds: {
    bed_id: 'number',
    room_id: 'number',
    bed_number: 'string',
    status: 'string',
    added_by: 'number',
    updated_by: 'number',
    added_date: 'Date',
    updated_date: 'Date',
  },
  complaints: {
    complaint_id: 'number',
    student_id: 'number',
    description: 'string',
    status: 'string',
    created_date: 'Date',
    resolved_date: 'Date',
  },
  deposits: {
    deposit_id: 'number',
    stay_id: 'number',
    deposit_amount: 'number',
    deposit_paid_date: 'Date',
    refund_amount: 'number',
    refund_date: 'Date',
    status: 'string',
  },
  electricity_readings: {
    reading_id: 'number',
    room_id: 'number',
    reading_date: 'Date',
    units_consumed: 'number',
    rate_per_unit: 'number',
    total_amount: 'number',
  },
  floors: {
    floor_id: 'number',
    hostel_id: 'number',
    floor_number: 'number',
    added_by: 'number',
    updated_by: 'number',
    added_date: 'Date',
    updated_date: 'Date',
  },
  food_plans: {
    food_plan_id: 'number',
    plan_name: 'string',
    monthly_price: 'number',
    description: 'string',
  },
  hostel_amenities: {
    hostel_amenity_id: 'number',
    hostel_id: 'number',
    amenity_id: 'number',
  },
  hostels: {
    hostel_id: 'number',
    hostel_name: 'string',
    address: 'string',
    city: 'string',
    state: 'string',
    pincode: 'string',
    contact_number: 'string',
    added_by: 'number',
    updated_by: 'number',
    added_date: 'Date',
    updated_date: 'Date',
  },
  invoices: {
    invoice_id: 'number',
    stay_id: 'number',
    invoice_month: 'Date',
    total_amount: 'number',
    due_date: 'Date',
    status: 'string',
  },
  maintenance_requests: {
    maintenance_id: 'number',
    hostel_id: 'number',
    room_id: 'number',
    reported_by: 'number',
    issue_description: 'string',
    status: 'string',
    reported_date: 'Date',
    resolved_date: 'Date',
  },
  notifications: {
    notification_id: 'number',
    student_id: 'number',
    title: 'string',
    message: 'string',
    notification_type: 'string',
    is_read: 'boolean',
    sent_date: 'Date',
  },
  payment_allocations: {
    allocation_id: 'number',
    payment_id: 'number',
    invoice_id: 'number',
    amount_allocated: 'number',
  },
  payments: {
    payment_id: 'number',
    student_id: 'number',
    amount_paid: 'number',
    payment_method: 'string',
    payment_date: 'Date',
    reference_number: 'string',
  },
  rooms: {
    room_id: 'number',
    hostel_id: 'number',
    floor_id: 'number',
    room_number: 'string',
    room_type: 'string',
    total_beds: 'number',
    added_by: 'number',
    updated_by: 'number',
    added_date: 'Date',
    updated_date: 'Date',
  },
  stays: {
    stay_id: 'number',
    student_id: 'number',
    bed_id: 'number',
    check_in_date: 'Date',
    check_out_date: 'Date',
    status: 'string',
    added_by: 'number',
    updated_by: 'number',
    added_date: 'Date',
    updated_date: 'Date',
  },
  student_food_plans: {
    student_food_plan_id: 'number',
    stay_id: 'number',
    food_plan_id: 'number',
    start_date: 'Date',
    end_date: 'Date',
  },
  students: {
    student_id: 'number',
    first_name: 'string',
    last_name: 'string',
    phone_number: 'string',
    email: 'string',
    gender: 'string',
    id_proof_number: 'string',
    address: 'string',
    added_by: 'number',
    updated_by: 'number',
    added_date: 'Date',
    updated_date: 'Date',
  },
  users: {
    user_id: 'number',
    name: 'string',
    email: 'string',
    password_hash: 'string',
    role: 'string',
    status: 'string',
    added_by: 'number',
    updated_by: 'number',
    added_date: 'Date',
    updated_date: 'Date',
  },
  visitor_logs: {
    visitor_id: 'number',
    student_id: 'number',
    visitor_name: 'string',
    phone_number: 'string',
    visit_date: 'Date',
    check_in_time: 'string',
    check_out_time: 'string',
  },
};

// Utility: convert camelCase to snake_case (for DTO fields)
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Generate DTO content
function generateDTO(tableName, columns) {
  const className = tableName
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') + 'Dto';

  let content = `import { 
  IsNumber, IsString, IsNotEmpty, IsOptional, IsDate, ValidateIf, IsEnum, Transform 
} from 'class-validator';

import { PartialType } from '@nestjs/mapped-types';

export class ${className} {
`;

  for (const [colName, colType] of Object.entries(columns)) {
    const field = toSnakeCase(colName);

    let decorators = [];

    // All fields optional except primary ID
    if (colName.endsWith('_id') && Object.keys(columns)[0] === colName) {
      decorators.push('@IsNumber()');
    } else {
      decorators.push('@IsOptional()');

      if (colType === 'string') decorators.push('@IsString()');
      if (colType === 'number') decorators.push('@IsNumber()');
      if (colType === 'Date') decorators.push('@IsDate()');
    }

    if (colType === 'number') decorators.push(`@Transform(({ value }) => Number(value))`);

    content += `  ${decorators.join('\n  ')}\n  ${field}?: ${colType === 'Date' ? 'Date' : colType};\n\n`;
  }

  content += '}\n\n';
  content += `export class Update${className} extends PartialType(${className}) {}\n`;

  return content;
}

// Generate DTO files
for (const [tableName, columns] of Object.entries(tables)) {
  const filePath = path.join(outputDir, `${tableName}.dto.ts`);
  const dtoContent = generateDTO(tableName, columns);
  fs.writeFileSync(filePath, dtoContent, 'utf-8');
  console.log(`Generated DTO: ${filePath}`);
}

console.log('All DTOs generated successfully!');
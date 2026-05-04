// create-nest-structure.js
const fs = require('fs');
const path = require('path');

// Base path
const BASE_PATH = path.join(__dirname, 'src', 'hostle', 'modules', 'api');

// Modules and submodules
const MODULES = {
  core: ['hostels', 'floors', 'rooms', 'beds', 'amenities', 'hostel_amenities', 'food_plans', 'student_food_plans'],
  users: ['users', 'students', 'stays'],
  finance: ['payments', 'payment_allocations', 'deposits', 'invoices'],
  operations: ['maintenance_requests', 'electricity_readings', 'visitor_logs', 'complaints', 'notifications'],
};

// Subfolders inside submodules
const SUBFOLDERS = ['services', 'entities', 'dto'];

// Utility to capitalize for class names
function capitalize(str) {
  return str
    .split('_')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// Create folder if it doesn't exist
function createFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log('Created folder:', folderPath);
  }
}

// Create file if it doesn't exist
function createFile(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log('Created file:', filePath);
  }
}

// Template for service file
function getServiceTemplate(serviceName) {
  return `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${capitalize(serviceName)}Service {}
`;
}

// Template for parent module file
function getModuleTemplate(moduleName, submodules) {
  const imports = submodules.map(sub => `${capitalize(sub)}Service`).join(', ');
  const importLines = submodules.map(sub => `import { ${capitalize(sub)}Service } from './${sub}/services/${sub}.service';`).join('\n');

  return `${importLines}
import { Module } from '@nestjs/common';
import { ${capitalize(moduleName)}Controller } from './${moduleName}.controller';

@Module({
  controllers: [${capitalize(moduleName)}Controller],
  providers: [${imports}],
})
export class ${capitalize(moduleName)}Module {}
`;
}

// Template for parent controller file
function getControllerTemplate(moduleName) {
  return `import { Controller } from '@nestjs/common';

@Controller('${moduleName}')
export class ${capitalize(moduleName)}Controller {}
`;
}

// Main loop: create parent module groups and submodules
for (const [moduleGroup, submodules] of Object.entries(MODULES)) {
  const groupPath = path.join(BASE_PATH, moduleGroup);
  createFolder(groupPath);

  // Create submodule folders with services/entities/dto
  submodules.forEach(submodule => {
    const modulePath = path.join(groupPath, submodule);
    createFolder(modulePath);

    SUBFOLDERS.forEach(sub => createFolder(path.join(modulePath, sub)));

    // Create service file in services folder
    const servicePath = path.join(modulePath, 'services', `${submodule}.service.ts`);
    createFile(servicePath, getServiceTemplate(submodule));
  });

  // Create parent module and controller
  createFile(path.join(groupPath, `${moduleGroup}.module.ts`), getModuleTemplate(moduleGroup, submodules));
  createFile(path.join(groupPath, `${moduleGroup}.controller.ts`), getControllerTemplate(moduleGroup));
}

console.log('NestJS structure with submodule services imported in parent module created successfully!');
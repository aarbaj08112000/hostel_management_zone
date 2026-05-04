// sync-nest-structure-typeorm.js
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

// Utility to capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Folder exists check
function folderExists(folderPath) {
  return fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory();
}

// Ensure folder exists
function ensureFolder(folderPath) {
  if (!folderExists(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created folder: ${folderPath}`);
  }
}

// Ensure service file exists
function ensureServiceFile(modulePath, submodule) {
  const serviceFile = path.join(modulePath, 'services', `${submodule}.service.ts`);
  if (!fs.existsSync(serviceFile)) {
    const content = `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${capitalize(submodule)}Service {}
`;
    fs.writeFileSync(serviceFile, content);
    console.log(`Created service file: ${serviceFile}`);
  }
  return serviceFile;
}

// Get all entity classes from entities folder
function getEntities(modulePath) {
  const entitiesPath = path.join(modulePath, 'entities');
  if (!folderExists(entitiesPath)) return [];
  return fs.readdirSync(entitiesPath)
    .filter(f => f.endsWith('.ts'))
    .map(f => ({
      file: f,
      className: capitalize(f.replace('.entity.ts', ''))
    }));
}

// Get all DTO classes from dto folder
function getDTOs(modulePath) {
  const dtoPath = path.join(modulePath, 'dto');
  if (!folderExists(dtoPath)) return [];
  return fs.readdirSync(dtoPath)
    .filter(f => f.endsWith('.ts'))
    .map(f => ({
      file: f,
      className: capitalize(f.replace('.dto.ts', '')) + 'Dto'
    }));
}

// Update parent module.ts
function updateParentModule(moduleGroup, submodules) {
  const groupPath = path.join(BASE_PATH, moduleGroup);

  let serviceImports = [];
  let entityImports = [];

  submodules.forEach(sub => {
    const modulePath = path.join(groupPath, sub);
    if (!folderExists(modulePath)) return;

    SUBFOLDERS.forEach(f => ensureFolder(path.join(modulePath, f)));

    // Services
    serviceImports.push({ name: capitalize(sub) + 'Service', path: `./${sub}/services/${sub}.service` });

    // Entities
    const entities = getEntities(modulePath);
    entities.forEach(e => entityImports.push({ name: e.className, path: `./${sub}/entities/${e.file.replace('.ts','')}` }));
  });

  const serviceImportLines = serviceImports.map(s => `import { ${s.name} } from '${s.path}';`).join('\n');
  const entityImportLines = entityImports.map(e => `import { ${e.name} } from '${e.path}';`).join('\n');
  const providersArray = serviceImports.map(s => s.name).join(', ');
  const entitiesArray = entityImports.map(e => e.name).join(', ');

  const content = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${capitalize(moduleGroup)}Controller } from './${moduleGroup}.controller';
${serviceImportLines}
${entityImportLines}

@Module({
  imports: [TypeOrmModule.forFeature([${entitiesArray}])],
  controllers: [${capitalize(moduleGroup)}Controller],
  providers: [${providersArray}],
})
export class ${capitalize(moduleGroup)}Module {}
`;

  fs.writeFileSync(path.join(groupPath, `${moduleGroup}.module.ts`), content);
  console.log(`Updated parent module: ${moduleGroup}.module.ts`);
}

// Update parent controller.ts
function updateParentController(moduleGroup, submodules) {
  const groupPath = path.join(BASE_PATH, moduleGroup);

  let serviceImports = [];
  let dtoImports = [];

  submodules.forEach(sub => {
    const modulePath = path.join(groupPath, sub);
    if (!folderExists(modulePath)) return;

    // Services
    serviceImports.push({ name: capitalize(sub) + 'Service', path: `./${sub}/services/${sub}.service` });

    // DTOs
    const dtos = getDTOs(modulePath);
    dtos.forEach(d => dtoImports.push({ name: d.className, path: `./${sub}/dto/${d.file.replace('.ts','')}` }));
  });

  const serviceImportLines = serviceImports.map(s => `import { ${s.name} } from '${s.path}';`).join('\n');
  const dtoImportLines = dtoImports.map(d => `import { ${d.name} } from '${d.path}';`).join('\n');

  const constructorParams = serviceImports
    .map(s => `private readonly ${s.name.charAt(0).toLowerCase() + s.name.slice(1)}: ${s.name}`)
    .join(', ');

  const content = `import { Controller } from '@nestjs/common';
${serviceImportLines}
${dtoImportLines}

@Controller('${moduleGroup}')
export class ${capitalize(moduleGroup)}Controller {
  constructor(${constructorParams}) {}
}
`;

  fs.writeFileSync(path.join(groupPath, `${moduleGroup}.controller.ts`), content);
  console.log(`Updated parent controller: ${moduleGroup}.controller.ts`);
}

// Main sync function
for (const [moduleGroup, submodules] of Object.entries(MODULES)) {
  const groupPath = path.join(BASE_PATH, moduleGroup);
  if (!folderExists(groupPath)) continue;

  updateParentModule(moduleGroup, submodules);
  updateParentController(moduleGroup, submodules);
}

console.log('Sync complete: parent modules and controllers updated with services, entities, and DTOs using proper class names.');
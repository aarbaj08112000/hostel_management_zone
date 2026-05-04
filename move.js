// organize-files.js
const fs = require('fs');
const path = require('path');

// Base directories
const BASE_SRC = path.join(__dirname, 'src', 'hostle');
const DTO_SRC = path.join(BASE_SRC, 'dto');
const ENTITY_SRC = path.join(BASE_SRC, 'entity');
const MODULES_BASE = path.join(BASE_SRC, 'modules', 'api');

// Define module grouping
const MODULES = {
  core: ['amenities', 'hostel_amenities', 'hostels', 'floors', 'rooms', 'beds', 'food_plans', 'student_food_plans'],
  users: ['users', 'students', 'stays'],
  finance: ['payments', 'payment_allocations', 'deposits', 'invoices'],
  operations: ['maintenance_requests', 'electricity_readings', 'visitor_logs', 'complaints', 'notifications'],
};

// Subfolders to move files into
const SUBFOLDERS = {
  dto: 'dto',
  entity: 'entities',
};

// Ensure module folders exist
for (const [group, modules] of Object.entries(MODULES)) {
  const groupPath = path.join(MODULES_BASE, group);
  if (!fs.existsSync(groupPath)) fs.mkdirSync(groupPath, { recursive: true });

  modules.forEach((mod) => {
    const modPath = path.join(groupPath, mod);
    Object.values(SUBFOLDERS).forEach((sub) => {
      const folderPath = path.join(modPath, sub);
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    });
  });
}

// Function to move files
function moveFiles(sourceDir, type) {
  const files = fs.readdirSync(sourceDir);

  files.forEach((file) => {
    const baseName = file.replace(`.${type}.ts`, '');
    for (const [group, modules] of Object.entries(MODULES)) {
      if (modules.includes(baseName)) {
        const destDir = path.join(MODULES_BASE, group, baseName, SUBFOLDERS[type]);
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        fs.renameSync(srcPath, destPath);
        console.log(`Moved ${file} → ${destPath}`);
        break;
      }
    }
  });
}

// Move DTOs and Entities
moveFiles(DTO_SRC, 'dto');
moveFiles(ENTITY_SRC, 'entity');

console.log('All files moved to their respective module folders!');
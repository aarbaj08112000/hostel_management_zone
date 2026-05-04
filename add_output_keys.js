const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/hostle/modules/api', function(filePath) {
  if (filePath.endsWith('.service.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /single_keys:\s*(\['[^']+'\]),?/g;
    let modified = false;
    content = content.replace(regex, (match, p1) => {
      modified = true;
      return `single_keys: ${p1},\n      output_keys: ${p1},`;
    });
    // Check if we accidentally duplicated it (if it was already there)
    // Actually our regex only matches single_keys: [...] not output_keys.
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
  }
});

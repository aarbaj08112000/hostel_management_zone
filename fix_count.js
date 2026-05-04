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
    let modified = false;

    // We split content into methods. A simple way is to match /async get[A-Z]\w+\([^)]*\)/
    // But safely: replacing globally where it shouldn't be.
    // If we find `query.getOne();` or `query.execute();` and then shortly after ``, we remove it.
    
    // Let's just remove `, ` globally FIRST. We actually don't NEED it in this.blockResult 
    // because we can just assign inputParams.total_count = count directly where getManyAndCount is called.
    
    // Oh wait, `` relies on this.blockResult.count!
    // If I do a targeted fix: In methods that contain `getOne()`, replace `, ` with empty string.
    // Also remove `` inside methods with `getOne()`.

    // A better approach: iterate over the file content line by line. Keep track of the last query execution type.
    const lines = content.split('\n');
    let inGetMany = false;
    let inGetOne = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('await query.getManyAndCount()')) {
            inGetMany = true;
            inGetOne = false;
        } else if (line.includes('await query.getOne()')) {
            inGetOne = true;
            inGetMany = false;
        }

        if (line.includes('') && inGetOne) {
            lines[i] = line.replace(/,\s*count:\s*count\s*as\s*number/, '');
            modified = true;
        }

        if (line.includes('') && inGetOne) {
            lines[i] = line.replace(/inputParams\.total_count\s*=\s*this\.blockResult\.count\s*\|\|\s*0;/, '');
            modified = true;
        }

        // Reset state after we encounter return inputParams
        if (line.includes('return inputParams;')) {
            inGetOne = false;
            inGetMany = false;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log('Fixed', filePath);
    }
  }
});

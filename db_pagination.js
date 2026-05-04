const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const paginationLogic = `
      const page = inputParams.page ? Number(inputParams.page) : 1;
      const limit = inputParams.limit ? Number(inputParams.limit) : 10;
      query.skip((page - 1) * limit).take(limit);`;

walkDir('src/hostle/modules/api', function(filePath) {
  if (filePath.endsWith('.service.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (content.includes('query.skip(')) {
      // Already has pagination logic installed inside the query builder string
      // Just check if we need to fix RawMany
    } else {
      // 1. For getManyAndCount
      const regexMany = /(const\s+\[data,\s*count\]\s*=\s*await\s+query\.getManyAndCount\(\);)/g;
      if (regexMany.test(content)) {
        content = content.replace(regexMany, paginationLogic + '\n      $1');
        modified = true;
      }
    }

    // 2. For getRawMany
    const regexRawMany = /(const\s+data\s*=\s*await\s+query\.getRawMany\(\);)/g;
    if (regexRawMany.test(content)) {
      let rawPagination = `
      const count = await query.getCount();` + (content.includes('query.skip(') ? '' : paginationLogic) + `
      $1`;
      content = content.replace(regexRawMany, rawPagination);

      // Now we need to append `, ` into the block
      const blockRegex = /(this\.blockResult = \{\s*success:\s*1,\s*message:\s*'Records found\.',\s*data)(\s*\};)/g;
      content = content.replace(blockRegex, '$1,  };');
      
      const inputParamsDataRegex = /(inputParams\.\w+\s*=\s*this\.blockResult\.data;)/g;
      if (!content.includes('')) {
         content = content.replace(inputParamsDataRegex, '$1\n    ');
      }

      modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Applied DB pagination on', filePath);
    }
  }
});

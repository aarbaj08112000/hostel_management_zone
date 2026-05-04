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

    // 1. In get* (which has await query.getMany()), replace with getManyAndCount
    const getManyRegex = /const data = await query\.getMany\(\);/g;
    if (getManyRegex.test(content)) {
      content = content.replace(getManyRegex, 'const [data, count] = await query.getManyAndCount();');
      
      // Also update blockResult to include count
      // this.blockResult = { success: 1, message: 'Records found.', data }; -> ... data, count };
      const blockResultRegex = /this\.blockResult = \{ success: 1, message: 'Records found\.', data \};/g;
      content = content.replace(blockResultRegex, "this.blockResult = { success: 1, message: 'Records found.', data,  };");
      
      // Some might have different messages, let's just do a more generic replace if needed, 
      // but let's see if we can do it safer:
      const blockGenericRegex = /(this\.blockResult = \{\s*success:\s*1,\s*message:\s*[^,]+,\s*data)(\s*\});/g;
      content = content.replace(blockGenericRegex, '$1,  };');

      // Then after inputParams.xxx = this.blockResult.data; add inputParams.total_count = this.blockResult.count;
      const inputParamsDataRegex = /(inputParams\.\w+\s*=\s*this\.blockResult\.data;)/g;
      content = content.replace(inputParamsDataRegex, '$1\n    ');

      modified = true;
    }

    // 2. In *FinishedSuccess(inputParams: any) where it returns a list
    // Look for settingFields declaration and add pagination variables before it.
    // How to identify? It usually has `multiple_keys` or `output_keys: ['something']` and not `single_keys:`.
    // We can just inject the pagination logic at the top of methods that end with FinishedSuccess and do not have 'Details' in their name
    // Actually, searching for `settingFields = {` inside *FinishedSuccess methods that are NOT *DetailsFinishedSuccess
    
    // We can use a regex to find all *FinishedSuccess that don't match DetailsFinishedSuccess
    const methods = content.match(/(\w+)FinishedSuccess\s*\(\s*inputParams[^)]*\)\s*\{([\s\S]*?)return this\.response\./g);
    if (methods) {
      methods.forEach(methodStr => {
        if (!methodStr.includes('DetailsFinishedSuccess') && methodStr.includes('fields:')) {
          // It's a list success method
          const blockStartRegex = /const settingFields = \{/;
          if (blockStartRegex.test(methodStr)) {
            const paginationVars = `const page = inputParams.page ? Number(inputParams.page) : 1;
    const limit = inputParams.limit ? Number(inputParams.limit) : 10;
    const total_count = inputParams.total_count || 0;
    const total_pages = Math.ceil(total_count / limit) || 1;
    const next_page = page < total_pages ? page + 1 : 0;
    const prev_page = page > 1 ? page - 1 : 0;

    const settingFields = {`;
            
            let newMethodStr = methodStr.replace(blockStartRegex, paginationVars);
            
            // Now inject into the settingFields object
            const fieldsEndRegex = /fields:\s*\[([^\]]*)\][,\s]*\};/;
            newMethodStr = newMethodStr.replace(fieldsEndRegex, `fields: [$1],\n      page,\n      limit,\n      total_count,\n      total_pages,\n      next_page,\n      prev_page,\n    };`);
            
            // Replace the old method string with the new one in the file content
            content = content.replace(methodStr, newMethodStr);
            modified = true;
          }
        }
      });
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Paginated', filePath);
    }
  }
});

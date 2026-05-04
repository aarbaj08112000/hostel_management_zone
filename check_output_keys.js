const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const missing = [];

walkDir('src/hostle/modules/api', function(filePath) {
  if (filePath.endsWith('.service.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Match each *FinishedSuccess method block loosely
    const methodRegex = /(\w+FinishedSuccess\s*\(\w*[^)]*\)\s*\{)([\s\S]*?)(return\s+this\.response\.outputResponse[^;]+;)/g;
    
    content = content.replace(methodRegex, (match, signature, body, returnStmt) => {
      // Look for funcData inside body or returnStmt
      // Typically: const funcData: any = { name: 'hostels', multiple_keys: ... };
      // Or inlined: return this.response.outputResponse(outputData, { name: 'hostels' });

      let newBody = body;
      let newReturn = returnStmt;

      // Find where name is defined, usually `name: 'something'`
      const nameMatch = match.match(/name:\s*'([^']+)'/);
      if (nameMatch) {
         const funcName = nameMatch[1];
         // Check if output_keys exists
         if (!match.includes('output_keys:')) {
            console.log(`Missing output_keys in ${filePath} -> ${signature.trim()}`);
            missing.push({ file: filePath, method: signature.trim() });
            
            // Try to inject it into funcData
            const funcDataRegex = /(const\s+funcData\s*:\s*any\s*=\s*\{[\s\S]*?name:\s*'[^']+',?)([\s\S]*?)(\};)/;
            if (funcDataRegex.test(body)) {
                newBody = body.replace(funcDataRegex, `$1$2\n      output_keys: ['${funcName}'],\n    $3`);
                modified = true;
            } else {
                // Check if it's inlined in the return statement
                const inlineRegex = /(\{\s*name:\s*'[^']+',?)([\s\S]*?)(\})/;
                if (inlineRegex.test(returnStmt)) {
                    newReturn = returnStmt.replace(inlineRegex, `$1$2 output_keys: ['${funcName}'], $3`);
                    modified = true;
                }
            }
         }
      }
      return signature + newBody + newReturn;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed missing output_keys in ${filePath}`);
    }
  }
});

if (missing.length === 0) {
  console.log('No missing output_keys found in any FinishedSuccess methods!');
} else {
  console.log(`Discovered and attempted to fix ${missing.length} missing output_keys.`);
}

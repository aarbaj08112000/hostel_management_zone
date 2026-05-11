import { DataSource, DataSourceOptions } from 'typeorm';
import { typeOrmConfig } from './src/hostle/entity/typeOrmConfig';

async function run() {
  const ds = new DataSource(typeOrmConfig as DataSourceOptions);
  await ds.initialize();
  try {
    await ds.query('ALTER TABLE hostels ADD COLUMN primary_image VARCHAR(255) NULL;');
    console.log("Column added successfully!");
  } catch (err: any) {
    console.error("Error adding column (maybe exists?):", err.message);
  }
  await ds.destroy();
}
run();

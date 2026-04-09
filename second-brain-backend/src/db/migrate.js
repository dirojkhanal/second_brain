import {readFileSync} from 'fs';
import {join , dirname} from 'path';
import {fileURLToPath} from 'url';
import {pool} from './index.js';

const __dirname = dirname (fileURLToPath(import.meta.url));

const runMigration = async () => {
    try{
        const runMigrate = readFileSync(join(__dirname, 'migrations','sqlSchema.sql'), 'utf-8');
        await pool.query(runMigrate);
        console.log('Database migrated successfully');
    } catch (error){
        console.error('Error migrating database', error);
        process.exit(1);
    }
    finally{
        await pool.end();
    }

};

runMigration();
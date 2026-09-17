import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
// A local-only wrapper: Sites handles hosted migrations during publication.
const config=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
config.main=resolve('dist/server/index.js');
if(config.assets)config.assets.directory=resolve('dist/client');
for(const db of config.d1_databases??[])db.migrations_dir=resolve('drizzle');
mkdirSync('.sites-runtime',{recursive:true});
const file=resolve('.sites-runtime/migrations-config.json');
writeFileSync(file,JSON.stringify(config));
const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config',file,'--persist-to','.wrangler/state'],{stdio:'inherit',env:{...process.env,CI:'1'}});
if(result.error)throw result.error;
process.exit(result.status??1);

import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
// No generated code or remote services: ship only the static runtime and data.
fs.mkdirSync(dist,{recursive:true});
fs.copyFileSync(path.join(root,'index.html'),path.join(dist,'index.html'));
for(const dir of ['src','data'])fs.cpSync(path.join(root,dir),path.join(dist,dir),{recursive:true});
console.log('Static GitHub Pages files: '+dist);

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
// No generated code or remote services: ship only the static runtime and data.
// Remove generated leftovers from other local branches (e.g. unshipped cloud modules).
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw Error('Invalid build output directory');
if(fs.existsSync(dist)&&fs.lstatSync(dist).isSymbolicLink())throw Error('Build output must not be a symlink');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
fs.copyFileSync(path.join(root,'index.html'),path.join(dist,'index.html'));
for(const dir of ['src','data','icons'])fs.cpSync(path.join(root,dir),path.join(dist,dir),{recursive:true});
// 앱 설치·오프라인 열기·링크 공유 미리보기 파일
for(const file of ['manifest.webmanifest','sw.js','ys-install.js','ys-qr.js','qr.svg','og-image.jpg'])fs.copyFileSync(path.join(root,file),path.join(dist,file));
// Every module in one release has the same content-derived URL version.
// This prevents older browser/SW cached imports from mixing with the new entry point.
const files=fs.readdirSync(path.join(dist,'src'),{recursive:true}).map(f=>f.split(path.sep).join('/')).filter(f=>/\.(js|css)$/.test(f)).sort();
for(const file of ['index.html','sw.js','ys-install.js','ys-qr.js',...files.map(f=>'src/'+f)]){
 const target=path.join(dist,file);fs.writeFileSync(target,fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n'));
}
const hash=crypto.createHash('sha256');
hash.update(fs.readFileSync(path.join(dist,'index.html')));
for(const file of files)hash.update(file).update(fs.readFileSync(path.join(dist,'src',file)));
const revision=hash.digest('hex').slice(0,16);
for(const file of files.filter(f=>f.endsWith('.js'))){
 const target=path.join(dist,'src',file);let source=fs.readFileSync(target,'utf8');
 source=source.replace(/(from\s*['"])(\.{1,2}\/[^'"?]+\.js)(['"])/g,`$1$2?v=${revision}$3`);
 fs.writeFileSync(target,source);
}
const html=path.join(dist,'index.html');
fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace(/((?:src|href)="\.\/[^"?]+\.(?:js|css))(?:\?[^" ]*)?"/g,`$1?v=${revision}"`));
const worker=path.join(dist,'sw.js');
fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace(/(\.\/[^'"?]+\.(?:js|css))(['"])/g,`$1?v=${revision}$2`).replace("startup-2'",`startup-2-${revision}'`));
console.log('Runtime revision: '+revision);
console.log('Static GitHub Pages files: '+dist);

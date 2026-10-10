import fs from 'node:fs';
import path from 'node:path';
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
console.log('Static GitHub Pages files: '+dist);

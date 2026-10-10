const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.STATIC_ROOT ? path.resolve(process.env.STATIC_ROOT) : path.resolve(__dirname, '..');
const types = {'.svg':'image/svg+xml','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{
  let url=decodeURIComponent(req.url.split('?')[0]);
  url=url.replace(/^\/Math-Survival(?:-2)?(?=\/)/,'');
  const file=path.resolve(root,'.'+(url.endsWith('/')?url+'index.html':url));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('http://127.0.0.1:'+(process.env.PORT||4173)+'/Math-Survival/'));

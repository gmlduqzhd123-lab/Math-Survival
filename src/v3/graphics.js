const images=new Map();
export const portraitURL=id=>new URL(`./assets/${id}.svg`,import.meta.url).href;
export function drawPortrait(ctx,id,x,y,size){if(!images.has(id)){const image=new Image();image.src=portraitURL(id);images.set(id,image);}const image=images.get(id);if(!image.complete||!image.naturalWidth)return false;ctx.drawImage(image,x-size/2,y-size/2,size,size);return true;}
// A dark ring traced once around each frame's solid pixels at 2x, drawn under the sprite so monsters
// stand out from ground decorations. The faint shadow baked into the art stays outside the ring.
const outlines=new Map(),RING=7;
function outlineOf(key,image,color){if(outlines.has(key))return outlines.get(key);let canvas=null;
 try{const w=image.naturalWidth*2,h=image.naturalHeight*2,cell=128,src=document.createElement('canvas');src.width=w;src.height=h;const sc=src.getContext('2d');sc.drawImage(image,0,0,w,h);
  const solid=sc.getImageData(0,0,w,h).data,out=sc.createImageData(w,h),[cr,cg,cb]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),across=new Float32Array(w*h).fill(Infinity);
  // Nearest solid pixel along the row, then along the column, both kept inside the frame's cell.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const left=x-x%cell;for(let dx=0;dx<=RING;dx++){const a=x-dx,b=x+dx;if((a>=left&&solid[(y*w+a)*4+3]>=128)||(b<left+cell&&b<w&&solid[(y*w+b)*4+3]>=128)){across[y*w+x]=dx;break;}}}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(solid[(y*w+x)*4+3]>=128)continue;const top=y-y%cell;
   for(let dy=-RING;dy<=RING;dy++){const ny=y+dy;if(ny<top||ny>=top+cell||ny>=h)continue;const d=across[ny*w+x];if(d*d+dy*dy<=RING*RING){const o=(y*w+x)*4;out.data[o]=cr;out.data[o+1]=cg;out.data[o+2]=cb;out.data[o+3]=235;break;}}}
  canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').putImageData(out,0,0);}catch{canvas=null;}
 outlines.set(key,canvas);return canvas;}
export function drawAnimation(ctx,id,x,y,size,now,{direction=0,moving=true,reduced=false,outline=''}={}){const key=id+'-sheet';if(!images.has(key)){const image=new Image();image.src=portraitURL(id);images.set(key,image);}const image=images.get(key);if(!image.complete||!image.naturalWidth)return false;const frame=moving&&!reduced?Math.floor(now/150)%3:1,row=Math.min(Math.floor(image.naturalHeight/64)-1,direction);const ring=outline&&outlineOf(id+'|'+outline,image,outline);if(ring)ctx.drawImage(ring,frame*128,row*128,128,128,x-size/2,y-size/2,size,size);ctx.drawImage(image,frame*64,row*64,64,64,x-size/2,y-size/2,size,size);return true;}

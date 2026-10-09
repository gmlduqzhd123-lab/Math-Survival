// User-supplied transparent PNGs. Decode once and keep small game render copies.
export const SPRITE_IDS=['healing-heart','invincibility-shield','math-magnet','math-boomerang','pencil-sword','knowledge-staff','math-bomb','speed-boots','knowledge-book','freeze-clock','treasure-chest','magic-quill'];
export const ITEM_SPRITES={heart:'healing-heart',shield:'invincibility-shield',freeze:'freeze-clock',magnet:'math-magnet',bomb:'math-bomb',speed:'speed-boots',expBook:'knowledge-book',rainbow:'pencil-sword',clock:'freeze-clock',chest:'treasure-chest',feather:'magic-quill'};
export const CHARACTER_GEAR={explorer:'pencil-sword',mage:'knowledge-staff',guardian:'invincibility-shield'};
export const WEAPON_SPRITES={storm:'knowledge-staff',compass:'math-boomerang',fraction:'invincibility-shield',lightning:'knowledge-staff'};
const cache=new Map(),failed=new Set();let pending;
export function spriteURL(id){return SPRITE_IDS.includes(id)?new URL('./assets/sprites/'+id+'.png',import.meta.url).href:'';}
export function spriteMarkup(id){return id?`<img class="spriteIcon" src="${spriteURL(id)}" alt="" width="64" height="64" decoding="async">`:'';}
export function spriteStatus(){return {ready:[...cache.keys()],failed:[...failed],renderSize:128};}
export function loadSprites(){
 if(pending)return pending;
 pending=Promise.all(SPRITE_IDS.map(async id=>{
  try{const img=new Image();img.src=spriteURL(id);await img.decode();
   const tile=document.createElement('canvas');tile.width=tile.height=128;tile.dataset.sprite=id;
   const ctx=tile.getContext('2d');ctx.drawImage(img,0,0,128,128);cache.set(id,tile);
  }catch{failed.add(id);}
 }));return pending;
}
export function drawSprite(ctx,id,x,y,size,angle=0){
 const image=cache.get(id);if(!image)return false;
 if(angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();}
 else ctx.drawImage(image,x-size/2,y-size/2,size,size);
 return true;
}

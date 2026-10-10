export class SpatialGrid {
 constructor(size=128){this.size=size;this.cells=new Map();this.count=0;}
 key(x,y){return `${x},${y}`;}
 rebuild(objects){this.cells.clear();this.count=0;this.maxRadius=0;for(const o of objects){if(o.hp<=0)continue;const x=Math.floor(o.x/this.size),y=Math.floor(o.y/this.size),key=this.key(x,y);if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(o);this.count++;this.maxRadius=Math.max(this.maxRadius,o.r);}}
 near(x,y,r){const out=[],range=r+(this.maxRadius||0);for(let cy=Math.floor((y-range)/this.size);cy<=Math.floor((y+range)/this.size);cy++)for(let cx=Math.floor((x-range)/this.size);cx<=Math.floor((x+range)/this.size);cx++)for(const o of this.cells.get(this.key(cx,cy))||[])if((o.x-x)**2+(o.y-y)**2<=(r+o.r)**2)out.push(o);return out;}
}
export class ObjectPool {
 constructor(limit=256){this.limit=limit;this.free=[];this.active=new Set();this.created=0;this.serial=0;}
 take(values){if(this.active.size>=this.limit)return null;const o=this.free.pop()||{};if(!o.uid)this.created++;for(const k of Object.keys(o))delete o[k];Object.assign(o,values,{uid:++this.serial});this.active.add(o);return o;}
 release(o){if(!this.active.delete(o))return false;if(this.free.length<this.limit)this.free.push(o);return true;}
 clear(){for(const o of this.active)this.free.push(o);this.active.clear();this.free.length=Math.min(this.free.length,this.limit);}
}
export function mergeGems(gems,limit=120){
 if(gems.length<=limit)return gems;const cells=new Map();for(const gem of gems){const key=`${Math.floor(gem.x/100)},${Math.floor(gem.y/100)}`;const previous=cells.get(key);if(!previous)cells.set(key,gem);else{const value=previous.value+gem.value;previous.x=(previous.x*previous.value+gem.x*gem.value)/value;previous.y=(previous.y*previous.value+gem.y*gem.value)/value;previous.value=value;previous.life=Math.max(previous.life,gem.life);previous.r=Math.min(18,9+value*.18);}}
 const result=[...cells.values()];while(result.length>limit){const gem=result.pop();let best=result[0],d=Infinity;for(const other of result){const distance=(other.x-gem.x)**2+(other.y-gem.y)**2;if(distance<d){d=distance;best=other;}}best.value+=gem.value;best.life=Math.max(best.life,gem.life);best.r=Math.min(18,9+best.value*.18);}return result;
}
export function waveFor(seconds,difficulty='normal'){const wave=1+Math.floor(seconds/30),mult={easy:.7,normal:1,hard:1.25}[difficulty]||1;return {wave,delay:Math.max(180,1100-wave*45)/mult,batch:Math.min(6,1+Math.floor(wave/3)),health:1+Math.min(12,wave*.12),eliteChance:Math.min(.22,.02+wave*.005),types:Math.min(10,2+Math.floor(wave/2))};}
export function performanceTier(samples,manualLow=false){const slow=samples.filter(n=>n>28).length;return manualLow||samples.length>=90&&slow/samples.length>.25?'low':'normal';}

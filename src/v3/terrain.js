// Obstacles and ground decorations for the overworld. Obstacles block the player and monsters;
// every pair keeps a walkable gap, roads and landmark plazas stay clear, so no area is ever sealed off.
export const PASS_GAP=110,ROAD_CLEAR=125,PLAZA_CLEAR=470,CELL=300;
const KINDS={
 forest:{mix:['tree','tree','tree','bush','rock','pond','fence'],deco:['flower','flower','mushroom','tuft','tuft','pebble'],petals:['#ffb3c7','#ffe28a','#f4f1ff','#c9b6ff']},
 desert:{mix:['cactus','cactus','rock','rock','pond','fence'],deco:['tuft','pebble','pebble','flower','shell'],petals:['#ffcf73','#ff9f80','#fff0c2']},
 library:{mix:['pillar','pillar','crystal','bush','pond','fence'],deco:['sparkle','sparkle','flower','mushroom','pebble'],petals:['#c8d2ff','#ffe3a0','#f7c6ff']},
 ocean:{mix:['coral','coral','rock','rock','pond','fence'],deco:['shell','shell','tuft','pebble','sparkle'],petals:['#ffc1b8','#fff1c9','#b9f4e6']},
 clockwork:{mix:['gear','gear','pillar','rock','pond','fence'],deco:['bolt','bolt','pebble','tuft','flower'],petals:['#ffd38a','#e6c7a5','#fff1c9']},
 sky:{mix:['cloud','cloud','crystal','pillar','pond','fence'],deco:['sparkle','sparkle','flower','tuft'],petals:['#fff6c2','#ffd3ec','#d7f1ff']}
};
// Blocking footprint per kind as ellipses [dx,dy,rx,ry] in units of the drawn size, traced from
// drawObstacle so the character stops where the art ends instead of walking over canopies and rims.
export const HIT={tree:[[0,-.45,1.15,1.1]],bush:[[-.5,-.15,.62,.55],[.5,-.15,.62,.55],[0,-.35,.62,.52]],rock:[[0,-.22,1,.66],[0,.2,1,.25]],pond:[[0,0,1.05,.95]],cactus:[[0,-.45,.9,.9]],
 pillar:[[0,-.6,.66,1.15],[0,-1.6,.9,.2],[0,.45,.9,.2]],crystal:[[0,-.62,.85,.95],[0,.15,.9,.2]],coral:[[0,-.6,1,1],[0,.3,.65,.28]],gear:[[0,0,1,.8]],cloud:[[0,-.15,1.05,.62]]};
const reachOf=(kind,s)=>s*Math.max(...HIT[kind].map(([x,y,rx,ry])=>Math.hypot(x,y)+Math.max(rx,ry)));
const SIZE={tree:[30,38],bush:[26,34],rock:[26,44],pond:[78,120],cactus:[22,28],pillar:[26,32],crystal:[28,36],coral:[28,36],gear:[34,44],cloud:[40,52]};
function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
const seedOf=key=>[...key].reduce((h,ch)=>Math.imul(h^ch.charCodeAt(0),16777619)>>>0,2166136261);
function segmentDistance(x,y,[ax,ay,bx,by]){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-dx*t,y-ay-dy*t);}
// Fences are axis-aligned boxes. `s` is the drawn size; `r` is the bounding radius of the blocking
// shape, used for spacing and grid lookups.
export function makeObstacles(key,size,regions,roads,sites,perRegion=16){
 const theme=KINDS[key];if(!theme)return [];const rand=random(seedOf(key)),list=[];
 for(const z of regions){let placed=0;for(let tries=0;tries<90&&placed<perRegion;tries++){
  const kind=theme.mix[Math.floor(rand()*theme.mix.length)],x=z.x+80+rand()*(z.w-160),y=z.y+80+rand()*(z.h-160);
  let o;if(kind==='fence'){const across=rand()<.5,len=170+rand()*80;o=across?{kind,x,y,len,w:len+10,h:28,dy:-4,r:len/2+16}:{kind,x,y,len,w:14,h:len+22,dy:-1,r:len/2+13};}
  else{const [lo,hi]=SIZE[kind],s=lo+rand()*(hi-lo);o={kind,x,y,s,r:reachOf(kind,s)};}
  o.seed=Math.floor(rand()*1e6);
  if(x-o.r<120||y-o.r<120||x+o.r>size.width-120||y+o.r>size.height-120)continue;
  if(Math.hypot(x-z.cx,y-z.cy)<PLAZA_CLEAR+o.r)continue;
  if(roads.some(road=>segmentDistance(x,y,road)<ROAD_CLEAR+o.r))continue;
  if(sites.some(s=>Math.hypot(x-s.x,y-s.y)<o.r+150))continue;
  if(list.some(p=>Math.hypot(x-p.x,y-p.y)<o.r+p.r+PASS_GAP))continue;
  o.id=list.length;o.region=z.id;list.push(o);placed++;}}
 return list;
}
export function obstacleGrid(list){const grid=new Map();for(const o of list)for(let cy=Math.floor((o.y-o.r)/CELL);cy<=Math.floor((o.y+o.r)/CELL);cy++)for(let cx=Math.floor((o.x-o.r)/CELL);cx<=Math.floor((o.x+o.r)/CELL);cx++){const id=cx+','+cy;if(!grid.has(id))grid.set(id,[]);grid.get(id).push(o);}return grid;}
function near(grid,x,y,reach){const found=new Set();for(let cy=Math.floor((y-reach)/CELL);cy<=Math.floor((y+reach)/CELL);cy++)for(let cx=Math.floor((x-reach)/CELL);cx<=Math.floor((x+reach)/CELL);cx++)for(const o of grid.get(cx+','+cy)||[])found.add(o);return found;}
// Push direction and depth out of one obstacle, or null when the circle does not touch it.
function overlap(o,x,y,r){
 if(o.kind==='fence'){const left=o.x-o.w/2,top=o.y+(o.dy||0)-o.h/2,qx=Math.max(left,Math.min(x,left+o.w)),qy=Math.max(top,Math.min(y,top+o.h)),d=Math.hypot(x-qx,y-qy);
  if(d>0){return d<r?{nx:(x-qx)/d,ny:(y-qy)/d,depth:r-d}:null;}
  const ex=[x-left,left+o.w-x],ey=[y-top,top+o.h-y],mx=Math.min(...ex),my=Math.min(...ey);
  return mx<my?{nx:ex[0]<ex[1]?-1:1,ny:0,depth:mx+r}:{nx:0,ny:ey[0]<ey[1]?-1:1,depth:my+r};}
 // Each ellipse grown by the circle's radius; the push lands on that grown rim along the same angle.
 let best=null;for(const [px,py,prx,pry] of HIT[o.kind]){const cx=o.x+px*o.s,cy=o.y+py*o.s,rx=prx*o.s+r,ry=pry*o.s+r,dx=x-cx,dy=y-cy,d=Math.hypot(dx/rx,dy/ry);if(d>=1)continue;
  const ux=d>.001?dx/rx/d:1,uy=d>.001?dy/ry/d:0,vx=cx+ux*rx-x,vy=cy+uy*ry-y,depth=Math.hypot(vx,vy)+.01;
  if(!best||depth>best.depth)best={nx:vx/(depth-.01||1),ny:vy/(depth-.01||1),depth};}
 return best;
}
export function blocked(grid,x,y,pad=0){for(const o of near(grid,x,y,pad+60))if(overlap(o,x,y,pad))return true;return false;}
// Pushes a circle out of obstacles. With a target, the pushed depth turns into a slide around the
// obstacle toward it, so chasing monsters walk around rocks instead of stalling against them.
export function constrain(grid,e,target){let moved=false;for(let pass=0;pass<2;pass++){let hit=false;for(const o of near(grid,e.x,e.y,(e.r||0)+60)){const h=overlap(o,e.x,e.y,e.r||0);if(!h)continue;hit=moved=true;e.x+=h.nx*h.depth;e.y+=h.ny*h.depth;
  if(target){let tx=-h.ny,ty=h.nx;if(tx*(target.x-e.x)+ty*(target.y-e.y)<0){tx=-tx;ty=-ty;}const slide=Math.min(h.depth,3);e.x+=tx*slide;e.y+=ty*slide;}}if(!hit)break;}return moved;}

function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
// Drawn as vectors in world space; only obstacles near the screen are passed in.
export function drawObstacle(c,o,x,y,l,t=0){const r=o.s||o.r,v=o.seed%7;c.save();c.translate(x,y);
 if(o.kind==='fence'){const across=o.w>o.h,len=o.len||(across?o.w:o.h);ellipse(c,4,across?17:len/2+6,across?len/2+6:17,10,'rgba(0,0,0,.22)');}
 else if(o.kind!=='cloud')ellipse(c,4,r*.55,r*1.05,r*.42,'rgba(0,0,0,.22)');
 if(o.kind==='tree'){c.fillStyle='#6d5440';c.fillRect(-r*.22,-r*.1,r*.44,r*.75);ellipse(c,0,-r*.45,r*1.2,r*1.05,'#2f6b4f');ellipse(c,-r*.35,-r*.7,r*.75,r*.65,'#3f8a5e');ellipse(c,r*.3,-r*.85,r*.6,r*.5,'#58a46c');for(let i=0;i<3;i++)ellipse(c,(i-1)*r*.5,-r*(.4+i%2*.4),3,3,v%2?'#ffd6e6':'#fff3b0');}
 else if(o.kind==='bush'){for(let i=0;i<3;i++)ellipse(c,(i-1)*r*.55,-r*.1-(i%2)*r*.25,r*.6,r*.5,i%2?'#4f9a68':'#3b7d58');ellipse(c,-r*.2,-r*.35,4,4,l.light);}
 else if(o.kind==='rock'){c.fillStyle='#6f7c80';c.beginPath();c.moveTo(-r,r*.4);c.lineTo(-r*.8,-r*.4);c.lineTo(-r*.2,-r*.85);c.lineTo(r*.6,-r*.6);c.lineTo(r,r*.3);c.closePath();c.fill();c.fillStyle='#a6b2b0';c.beginPath();c.moveTo(-r*.7,-r*.35);c.lineTo(-r*.2,-r*.75);c.lineTo(r*.5,-r*.5);c.lineTo(r*.1,-r*.1);c.closePath();c.fill();if(v%3===0)ellipse(c,r*.5,r*.15,r*.28,r*.16,'#6fa36b');}
 else if(o.kind==='pond'){const w=Math.sin(t/600+o.seed)*2;ellipse(c,0,0,r+6,r*.92+6,'#6a8b6d');ellipse(c,0,0,r,r*.9,'#3f7f9f');ellipse(c,-r*.15,-r*.12,r*.72,r*.55,'#58a2c0');c.strokeStyle='rgba(230,248,255,.55)';c.lineWidth=2;for(let i=0;i<2;i++){c.beginPath();c.ellipse(r*.15,r*.1+i*12,r*.3+w,6,0,0,Math.PI);c.stroke();}ellipse(c,r*.45,-r*.25,10,6,'#6fbf73');ellipse(c,-r*.5,r*.3,8,5,'#6fbf73');}
 else if(o.kind==='fence'){const across=o.w>o.h,len=o.len||(across?o.w:o.h);c.fillStyle='#8a6545';c.strokeStyle='#5d4330';c.lineWidth=2;if(across){c.fillRect(-len/2,-8,len,6);c.fillRect(-len/2,2,len,6);for(let p=-len/2;p<=len/2;p+=len/Math.round(len/42)){c.fillRect(p-5,-18,10,28);c.strokeRect(p-5,-18,10,28);}}else{for(let p=-len/2;p<=len/2;p+=len/Math.round(len/42)){c.fillRect(-7,p-12,14,22);c.strokeRect(-7,p-12,14,22);}c.fillRect(-3,-len/2,6,len);}}
 else if(o.kind==='cactus'){c.fillStyle='#4f9a62';c.fillRect(-r*.3,-r*1.3,r*.6,r*1.7);c.fillRect(-r*.9,-r*.8,r*.35,r*.7);c.fillRect(-r*.9,-r*.25,r*.9,r*.25);c.fillRect(r*.55,-r*1.05,r*.35,r*.6);c.fillRect(0,-r*.55,r*.9,r*.25);ellipse(c,0,-r*1.32,r*.3,r*.2,'#ff9fb0');}
 else if(o.kind==='pillar'){c.fillStyle=l.stone;c.fillRect(-r*.6,-r*1.6,r*1.2,r*2);c.fillRect(-r*.85,-r*1.75,r*1.7,r*.3);c.fillRect(-r*.85,r*.3,r*1.7,r*.3);c.fillStyle='rgba(0,0,0,.15)';for(let i=-1;i<=1;i++)c.fillRect(i*r*.35-2,-r*1.4,4,r*1.6);}
 else if(o.kind==='crystal'){for(let i=-1;i<=1;i++){const h=r*(1.2+((v+i+3)%3)*.35);c.fillStyle=i===0?l.light:l.stone;c.beginPath();c.moveTo(i*r*.55-r*.3,r*.3);c.lineTo(i*r*.55,r*.3-h);c.lineTo(i*r*.55+r*.3,r*.3);c.closePath();c.fill();}c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-3,-r,4,r);}
 else if(o.kind==='coral'){c.strokeStyle=v%2?'#ff8f8f':'#ff9fd0';c.lineCap='round';c.lineWidth=r*.28;for(const [a,b] of [[-.8,-1.2],[0,-1.5],[.8,-1.1]]){c.beginPath();c.moveTo(0,r*.3);c.quadraticCurveTo(a*r*.3,-r*.3,a*r,b*r);c.stroke();}ellipse(c,0,r*.3,r*.6,r*.25,'#e6c9a0');}
 else if(o.kind==='gear'){const teeth=8;c.fillStyle='#9c8a6a';c.beginPath();for(let i=0;i<teeth*2;i++){const a=i*Math.PI/teeth+t/4000,rad=i%2?r:r*.78;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad*.8);}c.closePath();c.fill();ellipse(c,0,0,r*.38,r*.3,'#5a4a5a');ellipse(c,0,0,r*.16,r*.13,l.light);}
 else if(o.kind==='cloud'){c.globalAlpha=.95;ellipse(c,0,r*.25,r*1.1,r*.45,'rgba(80,110,140,.35)');for(const [dx,dy,s] of [[-.5,0,.55],[0,-.25,.7],[.5,0,.55]])ellipse(c,dx*r,dy*r,s*r,s*r*.8,'#eef6ff');ellipse(c,0,r*.1,r*1.05,r*.35,'#dce9f7');}
 c.restore();}

// Small, non-blocking ground details painted into the cached background chunks.
export function decorateTile(c,key,rand,scale,low){const theme=KINDS[key];if(!theme)return;const count=low?6:16;
 for(let i=0;i<count;i++){const kind=theme.deco[Math.floor(rand()*theme.deco.length)],x=rand()*300,y=rand()*300,s=(.8+rand()*.6)*Math.max(.35,scale),petal=theme.petals[Math.floor(rand()*theme.petals.length)];c.save();c.translate(x,y);c.scale(s,s);
  if(kind==='flower'){c.strokeStyle='#3f7a4c';c.lineWidth=2;c.beginPath();c.moveTo(0,8);c.lineTo(0,0);c.stroke();for(let k=0;k<5;k++)ellipse(c,Math.cos(k*1.256)*4,Math.sin(k*1.256)*4,3.2,3.2,petal);ellipse(c,0,0,2.2,2.2,'#ffcf4d');}
  else if(kind==='mushroom'){c.fillStyle='#f3e7d2';c.fillRect(-2,-2,4,8);c.fillStyle=rand()<.5?'#e2554f':'#b08cff';c.beginPath();c.arc(0,-2,6,Math.PI,0);c.fill();ellipse(c,-2,-5,1.2,1.2,'#fff');ellipse(c,2.5,-4,1,1,'#fff');}
  else if(kind==='tuft'){c.strokeStyle='rgba(170,220,150,.55)';c.lineWidth=2;c.beginPath();for(const a of [-.5,0,.5]){c.moveTo(0,4);c.lineTo(a*8,-6);}c.stroke();}
  else if(kind==='pebble'){ellipse(c,0,0,4,2.6,'rgba(210,214,206,.5)');ellipse(c,6,2,2.5,1.8,'rgba(210,214,206,.4)');}
  else if(kind==='shell'){c.fillStyle=petal;c.beginPath();c.moveTo(0,4);c.arc(0,4,6,Math.PI*1.1,Math.PI*1.9);c.closePath();c.fill();}
  else if(kind==='sparkle'){c.fillStyle=petal;c.globalAlpha=.7;c.beginPath();for(let k=0;k<8;k++){const rad=k%2?1.6:5;c.lineTo(Math.cos(k*Math.PI/4)*rad,Math.sin(k*Math.PI/4)*rad);}c.closePath();c.fill();}
  else if(kind==='bolt'){c.strokeStyle='rgba(230,205,160,.6)';c.lineWidth=2;c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.stroke();c.fillStyle='rgba(230,205,160,.6)';c.fillRect(-1,-1,2,2);}
  c.restore();}
}

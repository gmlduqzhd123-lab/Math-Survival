from pathlib import Path
import re
assets=Path('src/v3/assets')
heroes=['rabbit','fox','panda','owl','cat','otter','dragon']
for name in heroes:
 raw=(assets/(name+'.svg')).read_text(encoding='utf-8');body=re.search(r'<svg[^>]*>(.*)</svg>',raw).group(1);cells=[]
 for direction in range(4):
  art=body
  if direction==3:
   art=re.sub(r'<(?:ellipse|circle)[^>]*c[x]="(?:23|41|22|40|16|48)"[^>]*/>','',art);art=re.sub(r'<path d="M27 41[^>]*/>','',art)
  for frame in range(3):
   bob=[0,-2,0][frame];angle=[-3,0,3][frame];mirror='translate(58 0) scale(-.9 1)' if direction==1 else 'translate(6 0) scale(.9 1)' if direction==2 else ''
   feet=f'<ellipse cx="{23+frame}" cy="60" rx="7" ry="3" fill="#3d6558"/><ellipse cx="{41-frame}" cy="{59 if frame==1 else 61}" rx="7" ry="3" fill="#3d6558"/>'
   cells.append(f'<g transform="translate({frame*64} {direction*64})"><g transform="{mirror}">{feet}<g transform="translate(0 {bob}) rotate({angle} 32 40)">{art}</g></g></g>')
 (assets/(name+'-walk.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="256" viewBox="0 0 192 256">'+''.join(cells)+'</svg>',encoding='utf-8')
colors={'sprout':'#84dca3','bat':'#b9a1ef','ram':'#f9a579','archer':'#f6d077','jelly':'#a2e3ea','shaman':'#dc9be6','turtle':'#6da894','healer':'#f1a9cf','frost':'#8bbfec','sentinel':'#ddc990'}
extras={'sprout':'<path d="M32 15 Q13 0 17 13 Q25 23 32 15 Q43 0 50 6 Q50 19 32 15" fill="#38884d"/>','bat':'<path d="M17 26 Q0 8 2 37 L12 32 L17 43 M47 26 Q64 8 62 37 L52 32 L47 43" fill="#76619f"/>','ram':'<path d="M16 23 Q4 9 13 7 Q22 12 20 22 M48 23 Q60 9 51 7 Q42 12 44 22" fill="none" stroke="#eee4be" stroke-width="6"/>','archer':'<path d="M50 19 Q67 35 50 52 M51 19 L51 52 M43 34 L60 34" fill="none" stroke="#896c37" stroke-width="3"/>','jelly':'<circle cx="15" cy="21" r="6" fill="white" opacity=".4"/><circle cx="47" cy="13" r="4" fill="white" opacity=".5"/>','shaman':'<path d="M8 22 Q32 -7 56 22 Z" fill="#ad588f"/><circle cx="22" cy="13" r="4" fill="#fff0cb"/><circle cx="40" cy="14" r="3" fill="#fff0cb"/>','turtle':'<path d="M15 27 Q32 11 49 27 L49 48 Q32 62 15 48 Z" fill="#496e52"/><path d="M18 28 L46 45 M46 28 L18 45 M32 24 V52" stroke="#a3c9a1" stroke-width="2"/>','healer':'<g fill="#de69aa"><ellipse cx="32" cy="11" rx="7" ry="9"/><ellipse cx="17" cy="18" rx="9" ry="7"/><ellipse cx="47" cy="18" rx="9" ry="7"/></g><circle cx="32" cy="19" r="6" fill="#f6d777"/>','frost':'<path d="M32 4 L42 20 L32 29 L22 20 Z" fill="#ddf8ff" stroke="#80cbe9" stroke-width="2"/>','sentinel':'<path d="M13 22 L13 10 L23 16 L32 5 L41 16 L51 10 L51 22 Z" fill="#f9e78d" stroke="#8c7c50" stroke-width="2"/>'}
for name,color in colors.items():
 cells=[]
 for frame in range(3):
  body=f'<ellipse cx="32" cy="58" rx="23" ry="4" fill="#142b29" opacity=".25"/><g transform="translate(0 {[-1,1,-1][frame]})"><ellipse cx="22" cy="54" rx="7" ry="4" fill="{color}"/><ellipse cx="42" cy="{53+frame}" rx="7" ry="4" fill="{color}"/><ellipse cx="32" cy="35" rx="22" ry="23" fill="{color}" stroke="#385554" stroke-width="2"/>'+extras[name]+'<ellipse cx="24" cy="34" rx="3" ry="4" fill="#223d3b"/><ellipse cx="40" cy="34" rx="3" ry="4" fill="#223d3b"/><circle cx="23" cy="33" r="1" fill="white"/><circle cx="39" cy="33" r="1" fill="white"/><path d="M27 43 Q32 47 37 43" stroke="#385554" fill="none" stroke-width="2"/><ellipse cx="16" cy="40" rx="3" ry="2" fill="#fff" opacity=".3"/></g>'
  cells.append(f'<g transform="translate({frame*64} 0)">{body}</g>')
 (assets/('enemy-'+name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="64">'+''.join(cells)+'</svg>',encoding='utf-8')

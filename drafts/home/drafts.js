// Home-screen design drafts. Injected only for comparison screenshots; not loaded by the game.
// The grade buttons drive the existing #grade select, so game logic is unchanged.
(function(){
 const theme=new URLSearchParams(location.search).get('homeTheme')||window.__homeTheme;
 if(theme!=='a'&&theme!=='b')return;
 document.body.classList.add('home-theme-'+theme);
 const card=document.querySelector('#startPanel .card'),grade=document.getElementById('grade'),title=document.querySelector('#startPanel h1');
 const base=new URL('../../src/v3/assets/',document.currentScript?.src||location.href).href;
 // Title: keep the text, drop the globe emoji in favour of the character art.
 title.innerHTML='<span class="draftTitle">매쓰 서바이벌</span> <span class="edition">3.0</span>';
 const pals=theme==='a'?['rabbit','cat','owl']:['fox','panda'];
 const art=document.createElement('div');art.className='draftCharacters';art.setAttribute('aria-hidden','true');
 // Inline each SVG without its gold "+" unlock badge, which reads oddly on a title screen.
 pals.forEach((n,i)=>{const slot=document.createElement('span');slot.className='draftPal';slot.style.setProperty('--i',i);art.append(slot);
  fetch(base+n+'.svg').then(r=>r.text()).then(svg=>{slot.innerHTML=svg.replace(/<circle cx="53" cy="51" r="8"[^>]*\/><path d="M49 51[^>]*\/>/,'');});});
 card.querySelector('.titleRow').after(art);
 if(theme==='b'){const deco=document.createElement('div');deco.className='draftRoute';deco.setAttribute('aria-hidden','true');card.prepend(deco);}
 // Grade picker: six buttons instead of the dropdown.
 const names=['숲','사막','도서관','바다','시계','하늘'];
 const row=document.createElement('div');row.className='draftGrades';row.setAttribute('role','radiogroup');row.setAttribute('aria-label','학년');
 row.innerHTML=[...grade.options].map((o,i)=>'<button type="button" role="radio" data-grade="'+o.value+'">'+(theme==='a'?'<b>'+o.value+'</b><small>학년</small>':'<small>스테이지 '+o.value+'</small><b>'+o.value+'학년</b><em>'+names[i]+'</em>')+'</button>').join('');
 const sync=()=>row.querySelectorAll('button').forEach(b=>{const on=b.dataset.grade===grade.value;b.setAttribute('aria-checked',on);b.classList.toggle('on',on);});
 row.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;grade.value=b.dataset.grade;grade.dispatchEvent(new Event('change',{bubbles:true}));sync();});
 grade.addEventListener('change',sync);
 grade.closest('label').after(row);sync();
 if(theme==='b')document.getElementById('startBtn').textContent='▶ 모험 시작';
})();

// Only generator-owned numeric values are interpolated; records never supply markup.
export function renderQuestionVisual(problem,element){
 const [a,b]=problem.operands;let html='';
 if(problem.type==='tableCount')html=`<table><caption>분류한 자료</caption><tr><th>종류</th><th>사과</th><th>배</th></tr><tr><th>개수</th><td>${a}</td><td>${b}</td></tr></table>`;
 if(problem.type==='pictureGraph')html=`<table><caption>○ 한 개는 자료 1개</caption><tr><th>사과</th><td>${'○'.repeat(a)}</td></tr><tr><th>배</th><td>${'○'.repeat(b)}</td></tr></table>`;
 const svg=content=>`<svg viewBox="0 0 400 80" role="img" aria-label="문제에 제시된 자료의 그래프">${content}</svg>`;
 if(problem.type==='barGraph'){const max=Math.max(a,b),w=n=>n/max*260;html=svg(`<text x="0" y="24">월요일</text><rect x="65" y="8" width="${w(a)}" height="22" fill="#538d78"/><text x="${70+w(a)}" y="24">${a}명</text><text x="0" y="62">화요일</text><rect x="65" y="46" width="${w(b)}" height="22" fill="#c88b26"/><text x="${70+w(b)}" y="62">${b}명</text>`);}
 if(problem.type==='lineGraph'){const y=65-a/(a+b)*50;html=svg(`<path d="M40 5 V65 H360" fill="none" stroke="#4e7460"/><path d="M100 ${y} L290 15" fill="none" stroke="#427d69" stroke-width="3"/><circle cx="100" cy="${y}" r="4" fill="#427d69"/><circle cx="290" cy="15" r="4" fill="#427d69"/><text x="110" y="${y}">${a}명</text><text x="300" y="18">${a+b}명</text><text x="80" y="79">오전</text><text x="270" y="79">오후</text>`);}
 if(problem.type==='percentGraph'){html=problem.grade===5?svg(`<rect x="0" y="10" width="400" height="36" fill="#dfb557"/><rect x="0" y="10" width="${a*4}" height="36" fill="#538d78"/><text x="8" y="69">축구 ${a}% / 농구 □% · 전체 100%</text>`):svg(`<circle cx="45" cy="40" r="30" fill="#dfb557"/><circle cx="45" cy="40" r="15" fill="none" stroke="#538d78" stroke-width="30" stroke-dasharray="${a/100*2*Math.PI*15} ${2*Math.PI*15}" transform="rotate(-90 45 40)"/><text x="95" y="35">초록: 축구 ${a}%</text><text x="95" y="58">노랑: 농구 □% · 전체 100%</text>`);}
 element.innerHTML=html;element.hidden=!html;
}

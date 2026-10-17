// Reads a question aloud in Korean for students who are still learning to read.
const FRACTION=/(\d+)\s*\/\s*(\d+)/g;
// 은/는 after a spoken number or word: digits 0,1,3,6,7,8 and words ending in a final consonant take 은.
const topic=before=>{const c=before.trim().slice(-1);if(/[013678]/.test(c))return '은';if(/[2459]/.test(c))return '는';const code=c.charCodeAt(0)-0xac00;return code>=0&&code<11172&&code%28?'은':'는';};
export function speakableMath(text){
 const words=String(text)
  .replace(FRACTION,(_,a,b)=>b+'분의 '+a)
  .replace(/×/g,' 곱하기 ').replace(/÷/g,' 나누기 ').replace(/\+/g,' 더하기 ').replace(/[−-](?=\s*\d)/g,' 빼기 ')
  .replace(/□/g,' 빈칸 ').replace(/:/g,' 대 ')
  .replace(/=\s*\?\s*cm/g,'= 몇 센티미터일까요?').replace(/=\s*\?\s*m\b/g,'= 몇 미터일까요?')
  .replace(/cm³/g,' 세제곱센티미터').replace(/cm²/g,' 제곱센티미터').replace(/(\d)\s*cm/g,'$1 센티미터').replace(/(\d)\s*m\b/g,'$1 미터').replace(/%/g,' 퍼센트');
 let out='';for(const part of words.split('=')){const said=part.trim()==='?'?'얼마일까요?':part;out+=out?topic(out)+' '+said:said;}
 return out.replace(/\s+/g,' ').trim();
}
export function canSpeak(){return typeof window!=='undefined'&&'speechSynthesis' in window&&typeof SpeechSynthesisUtterance==='function';}
export function speak(text){
 if(!canSpeak()||!text)return false;
 try{
  speechSynthesis.cancel();
  const voice=new SpeechSynthesisUtterance(speakableMath(text));voice.lang='ko-KR';voice.rate=0.9;
  const korean=speechSynthesis.getVoices().find(v=>v.lang?.toLowerCase().startsWith('ko'));if(korean)voice.voice=korean;
  speechSynthesis.speak(voice);return true;
 }catch{return false;}
}
export function readButton(id,getText){
 const button=document.createElement('button');button.type='button';button.id=id;button.className='readAloud';button.innerHTML='<span class="readIcon" aria-hidden="true">🔈</span><span class="readLabel">읽어 주기</span>';button.title='문제 읽어 주기';button.setAttribute('aria-label','문제 소리 내어 읽어 주기');button.hidden=!canSpeak();
 button.addEventListener('pointerdown',e=>e.preventDefault());
 button.addEventListener('click',e=>{e.stopPropagation();speak(getText());button.blur();});
 return button;
}

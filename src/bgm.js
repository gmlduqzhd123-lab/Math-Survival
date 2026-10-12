// Prepare the supplied recording once, then loop on the audio clock (no frame timer).
export function prepareLoop(buffer,fadeSeconds=2){
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 const rate=buffer.sampleRate,windowSize=Math.max(1,Math.round(rate*.02));
 const audible=index=>channels.some(data=>{let sum=0;for(let i=index;i<Math.min(index+windowSize,data.length);i++)sum+=data[i]*data[i];return sum/windowSize>1e-6;});
 let start=0,end=buffer.length;
 while(start<Math.min(rate*8,end-windowSize)&&!audible(start))start+=windowSize;
 while(end>Math.max(start+windowSize,buffer.length-rate*8)&&!audible(end-windowSize))end-=windowSize;
 const fade=Math.min(Math.round(fadeSeconds*rate),Math.floor((end-start)/4));
 // A linear blend preserves peak headroom and makes the loop boundary sample-continuous.
 for(const data of channels)for(let i=0;i<fade;i++){
  const mix=(i+1)/fade;data[end-fade+i]=data[end-fade+i]*(1-mix)+data[start+i]*mix;
 }
 return {offset:start/rate,loopStart:(start+fade)/rate,loopEnd:end/rate,crossfade:fade/rate};
}

export function createBGM(context,target,url){
 let source=null,pending=null,status='idle',starts=0,loop=null;
 async function start(){
  if(source||pending)return pending;
  status='loading';
  pending=(async()=>{
   try{
    const response=await fetch(url);if(!response.ok)throw Error('BGM HTTP '+response.status);
    const buffer=await context.decodeAudioData(await response.arrayBuffer());
    loop=prepareLoop(buffer);
    const next=context.createBufferSource(),fade=context.createGain();
    next.buffer=buffer;next.loop=true;next.loopStart=loop.loopStart;next.loopEnd=loop.loopEnd;
    fade.gain.setValueAtTime(0,context.currentTime);fade.gain.linearRampToValueAtTime(1,context.currentTime+.6);
    next.connect(fade);fade.connect(target);next.start(0,loop.offset);
    source=next;starts++;status='playing';
   }catch(error){status='error';console.warn('배경음악을 불러오지 못했습니다. 다음 조작에서 다시 시도합니다.',error.message);}
   finally{pending=null;}
  })();
  return pending;
 }
 return {start,get status(){return status;},get starts(){return starts;},get loop(){return loop;},get source(){return source;}};
}

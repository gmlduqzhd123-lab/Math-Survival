const url='http://127.0.0.1:4173/Math-Survival/';let ready=false;
for(let i=0;i<40;i++){try{const response=await fetch(url);if(response.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
if(!ready)throw new Error('Preview server did not become ready: '+url);console.log('Preview ready: '+url);

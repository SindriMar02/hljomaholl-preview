import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:'/tmp/hh-v2',args:['--no-first-run']});
const out={};
// --- phone: does anything overflow / does the popup appear there too? ---
const m=await b.newPage();
await m.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:3});
await m.goto('https://www.hljomaholl.is/',{waitUntil:'domcontentloaded'});
await new Promise(r=>setTimeout(r,6000));
out.phone=await m.evaluate(()=>{
  const h=[...document.querySelectorAll('h1,h2,div,span')].filter(e=>/HJARTA MENNINGAR/i.test(e.textContent||'')&&e.children.length<=3).pop();
  const r=h?h.getBoundingClientRect():null;
  const modal=[...document.querySelectorAll('div,section')].find(e=>/Ekki missa af neinu/i.test(e.textContent||'')&&e.getBoundingClientRect().width>150);
  return {docOverflowPx:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    headlineRight:r?Math.round(r.right):null, vw:innerWidth, headlineClipped:r?(r.right>innerWidth||r.left<0):null,
    popupOnPhone: !!modal, popupCoversCentre: modal?modal.contains(document.elementFromPoint(innerWidth/2,innerHeight/2)):false};
});
await m.screenshot({path:'/tmp/hh-their-phone.png'});
// --- desktop: does the X actually close it? ---
const p=await b.newPage();
await p.setViewport({width:1440,height:900});
await p.goto('https://www.hljomaholl.is/',{waitUntil:'domcontentloaded'});
await new Promise(r=>setTimeout(r,5000));
const closed=await p.evaluate(async()=>{
  const find=()=>[...document.querySelectorAll('div,section')].find(e=>/Ekki missa af neinu/i.test(e.textContent||'')&&e.getBoundingClientRect().width>200&&e.getBoundingClientRect().width<900);
  const modal=find(); if(!modal) return {present:false};
  // find a plausible close control inside or near the modal
  const btns=[...document.querySelectorAll('a,button,div,span,svg,i')].filter(e=>{
    const r=e.getBoundingClientRect(); const t=(e.textContent||'').trim();
    return r.width>0&&r.width<70&&r.height<70&&(/^(×|✕|X|x|close)$/i.test(t)||/close|dismiss/i.test(e.className&&e.className.baseVal!==undefined?e.className.baseVal:(e.className||'')));
  });
  if(btns.length){ btns[0].click(); }
  await new Promise(r=>setTimeout(r,1200));
  const still=find();
  return {present:true, closeControlsFound:btns.length, stillOpenAfterClick: !!(still&&still.getBoundingClientRect().width>0)};
});
out.desktopClose=closed;
console.log(JSON.stringify(out,null,1));
await b.close();

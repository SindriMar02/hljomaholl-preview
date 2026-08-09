import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:'/tmp/hh-verify',args:['--no-first-run']});
const p=await b.newPage();
await p.setViewport({width:1440,height:900});
await p.goto('https://www.hljomaholl.is/',{waitUntil:'domcontentloaded'});
await new Promise(r=>setTimeout(r,4000));
const out={};
// CLAIM 1: front-page headline overflows the viewport
out.headline = await p.evaluate(()=>{
  const cands=[...document.querySelectorAll('h1,h2,div,span')]
    .filter(e=>/HJARTA MENNINGAR/i.test(e.textContent||'') && e.children.length<=3);
  if(!cands.length) return {found:false};
  const el=cands[cands.length-1];
  const r=el.getBoundingClientRect();
  return {found:true, text:el.textContent.trim().slice(0,60),
    left:Math.round(r.left), right:Math.round(r.right), vw:innerWidth,
    clippedLeft:r.left<0, clippedRight:r.right>innerWidth,
    docOverflowPx: document.documentElement.scrollWidth-document.documentElement.clientWidth};
});
// CLAIM 2: newsletter popup covers content, and can it be dismissed?
await new Promise(r=>setTimeout(r,2000));
out.popup = await p.evaluate(()=>{
  const all=[...document.querySelectorAll('div,section')];
  const modal=all.find(e=>/Ekki missa af neinu/i.test(e.textContent||'') && e.getBoundingClientRect().width>200 && e.getBoundingClientRect().width<900);
  if(!modal) return {present:false};
  const r=modal.getBoundingClientRect();
  const cs=getComputedStyle(modal);
  const centre=document.elementFromPoint(innerWidth/2, innerHeight/2);
  return {present:true, w:Math.round(r.width), h:Math.round(r.height),
    coversCentre: modal.contains(centre)||centre===modal,
    zIndex:cs.zIndex, position:cs.position};
});
if(out.popup.present){
  await p.keyboard.press('Escape');
  await new Promise(r=>setTimeout(r,900));
  out.popup.stillOpenAfterEscape = await p.evaluate(()=>{
    const m=[...document.querySelectorAll('div,section')].find(e=>/Ekki missa af neinu/i.test(e.textContent||'')&&e.getBoundingClientRect().width>200&&e.getBoundingClientRect().width<900);
    return !!(m && m.getBoundingClientRect().width>0);
  });
}
console.log(JSON.stringify(out,null,1));
await b.close();

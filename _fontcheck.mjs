import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:'/tmp/hh-font',args:['--no-first-run']});
const p=await b.newPage();
const failed=[];
p.on('requestfailed',r=>failed.push(r.url().split('/').pop()));
p.on('response',r=>{ if(r.status()>=400) failed.push(r.status()+' '+r.url().split('/').pop()); });
await p.setViewport({width:1440,height:900});
await p.goto(process.argv[2]||'http://localhost:5327/',{waitUntil:'domcontentloaded'});
await p.evaluate(()=>document.fonts.ready);
await new Promise(r=>setTimeout(r,1500));
const res=await p.evaluate(()=>({
  loaded:[...document.fonts].map(f=>`${f.family} ${f.weight} ${f.status}`),
  checkDisplay:document.fonts.check('600 48px "Overused Grotesk"'),
  checkMono:document.fonts.check('400 12px "Chivo Mono"'),
  // does an Icelandic glyph actually render in the real face?
  h2w:document.querySelector('.hh-manifesto h2').getBoundingClientRect().width
}));
res.assetErrors=failed;
console.log(JSON.stringify(res,null,1));
await b.close();

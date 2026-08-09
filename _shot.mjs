import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',userDataDir:'/tmp/hh-shot',args:['--no-first-run']});
const p=await b.newPage();
await p.setViewport({width:1440,height:900,deviceScaleFactor:2});
await p.goto('https://sindrimar02.github.io/hljomaholl-preview/',{waitUntil:'domcontentloaded'});
await p.evaluate(()=>document.fonts.ready);
await new Promise(r=>setTimeout(r,7000)); // let the aperture intro finish
await p.screenshot({path:'/tmp/hh-hero-2x.png'});
console.log('captured');
await b.close();

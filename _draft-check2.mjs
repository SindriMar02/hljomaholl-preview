/** Mobile-only re-check of the póstlisti modal on hljomaholl.is: longer wait,
 *  scroll trigger, and a DOM sweep for the popup regardless of position. */
import puppeteer from 'puppeteer-core'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', userDataDir: '/tmp/hh-draft2', args: ['--no-first-run'],
})
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
await p.goto('https://hljomaholl.is/', { waitUntil: 'networkidle2', timeout: 60000 })

const probe = async (label) => {
  const r = await p.evaluate(() => {
    const centre = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    const pops = [...document.querySelectorAll('[class*="popup"],[class*="modal"],[role="dialog"],[class*="Popup"]')]
      .filter((e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect()
        return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.width > 40 && r.height > 40 })
      .map((e) => { const r = e.getBoundingClientRect()
        return { cls: e.className.toString().slice(0, 60), box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
                 coversCentre: r.x < innerWidth / 2 && r.right > innerWidth / 2 && r.y < innerHeight / 2 && r.bottom > innerHeight / 2 } })
    return { centre: (centre?.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 60), pops }
  })
  console.log(label, JSON.stringify(r))
  return r
}

await sleep(8000); await probe('after 8s      :')
await p.evaluate(() => window.scrollBy(0, 1200)); await sleep(4000); await probe('after scroll  :')
await sleep(10000); const last = await probe('after 22s tot :')
if (last.pops.some((x) => x.coversCentre)) {
  await p.keyboard.press('Escape'); await sleep(1500)
  await probe('after Escape  :')
}
await b.close()

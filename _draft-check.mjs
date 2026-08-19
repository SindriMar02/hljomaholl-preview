/**
 * Pre-send check for the Tómas draft:
 *  1. fresh landing shot off the LIVE preview URL (never localhost)
 *  2. re-verify the ONE factual claim the email makes about hljomaholl.is —
 *     that the póstlisti modal opens over the page content and does not close
 *     on Escape. They can edit their site at any time, so this is re-checked
 *     immediately before the draft goes out.
 */
import puppeteer from 'puppeteer-core'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', userDataDir: '/tmp/hh-draft', args: ['--no-first-run', '--force-color-profile=srgb'],
})

/* 1. landing shot */
const shot = await b.newPage()
await shot.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
await shot.goto('https://sindrimar02.github.io/hljomaholl-preview/', { waitUntil: 'networkidle0' })
await shot.evaluate(() => document.fonts.ready)
await sleep(7500) // aperture intro must be finished or the shot is a black field
const heroOk = await shot.evaluate(() => {
  const imgs = [...document.images].filter((i) => i.naturalWidth > 0)
  return { visibleImgs: imgs.length, title: document.title, h1: document.querySelector('h1')?.innerText.trim().slice(0, 80) ?? null }
})
const OUT = `${process.env.HOME}/Downloads/frumgerd-hljomaholl.png`
await shot.screenshot({ path: OUT })
console.log('LANDING SHOT', JSON.stringify(heroOk), '->', OUT)

/* 2. re-verify the modal claim on their live site */
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const p = await b.newPage()
  await p.setViewport({ ...vp, deviceScaleFactor: 2 })
  await p.goto('https://hljomaholl.is/', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(6000) // newsletter popup is delayed
  const before = await p.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    const txt = (el?.closest('[class*="popup"],[class*="modal"],[role="dialog"]') || el)?.innerText?.slice(0, 120) ?? ''
    return { centreTag: el?.tagName ?? null, centreText: txt.replace(/\s+/g, ' ').trim() }
  })
  await p.keyboard.press('Escape')
  await sleep(1200)
  const after = await p.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    return { centreText: (el?.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) }
  })
  console.log(`\n${vp.width}px  centre-before-Esc:`, JSON.stringify(before))
  console.log(`${vp.width}px  centre-after-Esc :`, JSON.stringify(after))
  await p.close()
}
await b.close()

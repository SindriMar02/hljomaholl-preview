/**
 * PRE-OUTREACH PREFLIGHT — run against the LIVE url before a link is put in
 * front of an owner. Exits non-zero if anything fails.
 *
 * Written after a Mirror House preview shipped with the scroll film rendering
 * as a blank field. The live URL had been "verified" — but every check walked
 * the page downward from the top, which is the one path that could not hit the
 * bug. The frames were loaded by a ScrollTrigger onEnter, and onEnter never
 * fires when the page loads ALREADY past its start. So a reload anywhere
 * inside the pinned section left the canvas empty, and that is precisely what
 * a recipient does: opens the link, scrolls, reloads, comes back later.
 *
 * The rule this encodes: verify the way a STRANGER uses a link, not the way
 * the author demos it. Reload at depth, cold session, second visit, phone.
 *
 * Usage: node scripts/preflight-outreach.mjs <live-url> [--canvas .sel]
 */
import puppeteer from 'puppeteer-core'

const URL = process.argv[2]
if (!URL) {
  console.error('usage: node scripts/preflight-outreach.mjs <live-url> [--canvas .sel]')
  process.exit(1)
}
const canvasSel = (() => {
  const i = process.argv.indexOf('--canvas')
  return i > -1 ? process.argv[i + 1] : 'canvas'
})()

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const fails = []
const note = (ok, label, detail = '') => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${label}${detail ? '  ' + detail : ''}`)
  if (!ok) fails.push(label)
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'],
})

/** Is a canvas actually showing an image, or is it one flat colour? */
const canvasPainted = (page, sel) => page.evaluate((s) => {
  const c = document.querySelector(s)
  if (!c || !c.width || !c.height) return { present: !!c, painted: false, why: 'missing or zero-sized' }
  const x = c.getContext('2d')
  const at = (fx, fy) => {
    const d = x.getImageData(Math.floor(c.width * fx), Math.floor(c.height * fy), 1, 1).data
    return [d[0], d[1], d[2]]
  }
  const pts = [at(0.15, 0.15), at(0.5, 0.5), at(0.85, 0.85), at(0.5, 0.15)]
  const flat = pts.every((p) => p.every((v, i) => Math.abs(v - pts[0][i]) < 10))
  return { present: true, painted: !flat, pts, why: flat ? 'every sample the same colour' : '' }
}, sel)

/* ── 1 · cold first visit, whole page, watching for broken assets ───────── */
{
  const p = await browser.newPage()
  await p.setViewport({ width: 1440, height: 900 })
  const bad = []
  p.on('response', (r) => {
    const u = r.url()
    if (r.status() >= 400 && /\.(jpg|jpeg|png|webp|mp4|woff2?|js|css)(\?|$)/.test(u)) bad.push(`${r.status()} ${u.split('/').pop()}`)
  })
  await p.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await p.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 2500))
  const boot = await p.evaluate(() => ({
    title: document.title,
    noindex: (document.querySelector('meta[name=robots]') || {}).content || null,
    jsonld: !!document.querySelector('script[type="application/ld+json"]'),
    imgs: [...document.images].length,
    brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
  }))
  note(!!boot.title && boot.title !== 'Endurhannanir', 'page boots with its own title', boot.title)
  note(/noindex/.test(boot.noindex || ''), 'noindex present', boot.noindex || 'MISSING')
  note(boot.jsonld, 'JSON-LD schema present')
  note(boot.brokenImgs === 0, 'no broken <img>', `${boot.brokenImgs} broken of ${boot.imgs}`)
  note(bad.length === 0, 'no 4xx assets', bad.slice(0, 4).join(', '))
  await p.close()
}

/* ── 2 · THE ONE THAT WAS MISSED: reload at depth ───────────────────────── */
for (const depth of [0.25, 0.5, 0.7, 0.9]) {
  const p = await browser.newPage()
  await p.setViewport({ width: 1440, height: 900 })
  await p.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1800))
  // wheel down (never scrollTo: smooth-scroll libraries revert it)
  const target = await p.evaluate((d) => (document.documentElement.scrollHeight - innerHeight) * d, depth)
  for (let i = 0; i < 400; i++) {
    const y = await p.evaluate(() => window.scrollY)
    if (y >= target - 40) break
    await p.mouse.wheel({ deltaY: 320 })
    await new Promise((r) => setTimeout(r, 16))
  }
  await new Promise((r) => setTimeout(r, 900))
  await p.reload({ waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 3500))
  const blank = await p.evaluate(() => {
    // any full-bleed element that is showing nothing at all
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    return { tag: el ? el.tagName : 'none', text: document.body.innerText.trim().length }
  })
  const cv = await canvasPainted(p, canvasSel)
  note(blank.text > 200, `reload at ${Math.round(depth * 100)}%: page still has content`, `${blank.text} chars`)
  if (cv.present) note(cv.painted, `reload at ${Math.round(depth * 100)}%: canvas is painted`, cv.why)
  await p.close()
}

/* ── 3 · second visit (loader already seen this session is a separate case, */
/*        but a returning visitor gets a warm cache and no preloader) ────── */
{
  const p = await browser.newPage()
  await p.setViewport({ width: 1440, height: 900 })
  await p.goto(URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 1500))
  await p.goto(URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 2500))
  const ok = await p.evaluate(() => document.body.innerText.trim().length > 200)
  note(ok, 'second visit renders')
  await p.close()
}

/* ── 4 · phone ──────────────────────────────────────────────────────────── */
{
  const p = await browser.newPage()
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await p.goto(URL, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 2500))
  const m = await p.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth > innerWidth + 1,
    text: document.body.innerText.trim().length,
  }))
  note(!m.hScroll, 'phone: no horizontal scroll')
  note(m.text > 200, 'phone: renders content')
  await p.close()
}

await browser.close()

console.log('')
if (fails.length) {
  console.log(`PREFLIGHT FAILED — ${fails.length} issue(s). Do NOT send this link.`)
  fails.forEach((f) => console.log('  · ' + f))
  process.exit(1)
}
console.log('PREFLIGHT PASSED — the link is safe to put in front of an owner.')

# Hljómahöll — servicing plan + outreach

Internal. Not deployed (deploy.sh copies only index.html, robots.txt, assets/, fonts/).

---

## 1. How they operate TODAY (all verified 2026-08-08, not assumed)

| Area | What they actually use | Evidence |
|---|---|---|
| Website | **Duda** site builder (paid subscription) | `dmRoot` classes, `irp.cdn-website.com` CDN |
| Events | A **Duda dynamic collection**. Detail pages are `/vidburdur/<id>/<slug>` (e.g. `/vidburdur/28/ensimi`) | numeric-id URLs = collection rows, not hand-built pages |
| Ticketing | **tix.is** | `https://tix.is/event/21486/ensimi`; their poster files are even named by tix id (`Event_21486`) |
| Newsletter | **markethype.io** signup form | form URL on every page |
| Hall rental | **Nothing. Free-text email** to info@hljomaholl.is | their own EN page: "Please send us an e-mail and we will answer all hall related questions" |
| Museum | **rokksafn.is**, a SEPARATE Duda site (account `2638f68d`) | different CDN account id |
| Staff who touch this | Darri (production mgr), Hans (catering/event mgr), Ragna (reception), Ástþór Sindri (technician) | their EN about page |
| Entity | kennitala **470794-2169**, Hjallavegur 2, 260 Reykjanesbær | ja.is |

**So the real workflow today:** artist/promoter sends artwork → event goes up on tix.is → someone
adds a row in Duda with the poster and the tix link. They enter each event **twice**.

## 2. The honest problem with the prototype as it stands

The prototype has **12 events hardcoded in the HTML**. Handed over as-is it would be stale within a
week and they would have to phone me to add a gig. **That is a worse product than the Duda site they
already have.** Nothing else in this plan matters until that is solved, and it must not be glossed
over in the pitch.

## 3. What they would actually get as a client

### Editing (the thing that decides whether this is a product)
**Sanity, schema-locked** ([[cms-setup-sanity]]). They get an Editor seat: they edit content, they
cannot touch layout, type, spacing or colour. Event schema mirrors what they already fill in on Duda:

- `title`, `date`, `hall` (Stapi | Berg), `poster` (image, hotspot crop so any artwork fits the slot),
- `ticketUrl` (their tix.is link), `tag` (e.g. Ljósanótt), optional `description`.

Halls, opening hours, saga and section copy are singletons. Adding a gig stays a one-row job, exactly
the shape of work they do now, so the workflow does not get harder.

**Phase 2 worth investigating (DO NOT PROMISE YET):** their events already exist in tix.is with date,
title, artwork and URL. If tix.is exposes an organiser feed/API, the dagskrá could populate itself and
they would stop double-entering. **I have not verified that tix.is offers this.** Check before it is
ever mentioned to them.

### What we deliberately do NOT touch
- **tix.is keeps the ticket money.** Every event card deep-links out to their tix event. We never sit
  in the payment flow. (House rule: never pitch against software that works.)
- **markethype** keeps the mailing list; the póstlisti button posts to their existing form.
- **rokksafn.is** stays its own site; we link to it. Merging it is a separate later decision.

### What genuinely improves
1. **Hall enquiries.** Today every wedding/árshátíð/ráðstefna starts as free-text email into a shared
   inbox. A structured form (date, hall, guest count, type of event, catering yes/no, contact) arrives
   ready to answer and to quote from. This is the "saves emails and phone calls" value, aimed at Hans
   and Ragna. **Not** self-serve booking: a 450-guest wedding in Stapi is a consultative sale with
   catering and dates, and pretending otherwise would be wrong for their business.
2. **Phone.** Their site is not broken on mobile (measured: zero overflow at 390px, headline uncropped),
   so do NOT pitch it as broken. The gain is weight and focus: this build is measured clean at 390px and
   phones never download the 4.9 MB film, they get a 45 KB poster instead.
3. **SEO.** `schema.org/Event` structured data per gig is how Google surfaces event listings. Their
   current site has no `<h1>` at all.

### Who does what
- **They edit:** events, hours, hall specs, text, images (Sanity Editor seat).
- **We run:** hosting, deploys, SSL, backups, uptime, updates, the code. They never get repo or infra
  ([[business-model]] hosting boundary).
- **Plan fit:** Growth band (CMS access + monthly content updates + analytics + SEO). Premium only if
  they want the AI receptionist — and they are an unusually good fit for it, because one building
  fields repeat questions about opening hours, parking, hall capacity, bar, age limits and the museum.
- Cancelling Duda offsets part of the monthly cost. Worth raising once they ask about price, never before.

### Migration practicalities
- `hljomaholl.is` currently points at Duda. Moving hosting is a DNS change. **Check MX/SPF first** so
  `info@hljomaholl.is` keeps working ([[business-model]]).
- Content migration is small: 12 events, 2 halls, saga, hours. About a day.

## 4. Open risks, stated plainly
- **Buyer is probably not an owner.** Hljómahöll is the municipal cultural house for Reykjanesbær;
  the decision may sit with a bæjarfélag or a board, not one person saying yes. That changes the
  timeline and could mean a formal procurement step. The email goes to their own stated enquiry
  address and will route internally.
- tix.is auto-sync: unverified (above).
- Whether they are locked into a Duda contract term: unknown.

---

## 5. The email

- **To:** `info@hljomaholl.is` (their own stated channel for all enquiries; no single decision maker
  is named publicly, so do not invent one)
- **Subject:** `Hugmynd að nýrri vefsíðu fyrir Hljómahöll`
- **Link:** https://sindrimar02.github.io/hljomaholl-preview/
- Plural (þið/ykkur) because it is an organisation with several staff.

**Re-verified 2026-08-08 against the live site, and ONE CLAIM WAS KILLED.** The draft originally said the
front-page headline does not fit the screen. **That is false:** measured at 1440px it sits at 606..1320 of
1440 with zero document overflow, and at 390px it is also uncropped with zero overflow. What I had actually
seen was the newsletter modal *covering* the headline, which I misread as clipping. Removed.
**What IS verified and safe to state:** the póstlisti modal opens over the page content on both desktop and
phone (it covers the centre point of the viewport in both) and it does not close on Escape. Re-check this
one again immediately before sending, since they could edit it at any time.

```
Góðan dag,

Ég heiti Sindri og hanna vefsíður fyrir íslensk menningarhús og ferðaþjónustufyrirtæki.

Hljómahöll er magnað hús. Rokksafn Íslands, Stapi og dagskrá sem heldur áfram allt haustið, allt undir
sama þaki. Mér fannst vefurinn ekki alveg gera húsinu skil. Glugginn með póstlistanum opnast til dæmis
strax yfir efnið, bæði í síma og tölvu.

Svo ég settist niður og hannaði frumgerð að nýrri forsíðu fyrir ykkur. Þetta kostar ykkur ekki neitt og
því fylgir engin skuldbinding.

Hana má skoða hér hvenær sem er, og hún virkar vel í síma:
https://sindrimar02.github.io/hljomaholl-preview/

Hún er hönnuð fyrir símann fyrst, því þar skoðar fólk dagskrána. Miðasalan væri áfram á tix.is eins og
hún er í dag, ég myndi ekki hrófla við því sem virkar. Dagskráin yrði áfram ykkar að uppfæra sjálf, þið
bætið við viðburði eins og þið gerið núna.

Næsta skref væri fyrirspurnarform fyrir salina, þar sem fólk velur dagsetningu, sal og fjölda gesta.
Þá kæmi fyrirspurnin til ykkar tilbúin, í stað þess að sami tölvupósturinn sé skrifaður aftur og aftur.

Ef ykkur líst vel á þetta gæti ég klárað vefinn í heild, en annars vona ég að þið hafið að minnsta
kosti gaman af því að skoða hugmyndina.

Endilega látið mig vita ef þið hafið áhuga.

Bestu kveðjur,
Sindri Már
845 1758
sndr-studio.pages.dev
```

**Checks run on this draft:** no em/en dashes; no ISK figures, plan names or tiers; plural throughout;
no "kveikja í"; no clause granting rights over the prototype; the two future-tense items (CMS editing,
enquiry form) are clearly offers, not things they will find on the link.

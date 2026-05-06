# Coif: Product Design Doc

*Working title. Tentative tagline: "See the cut before you book it."*

## TL;DR

A mobile app that lets dog owners visualize different grooming styles on their own dog using img2img. Primary job-to-be-done: pre-groomer planning ("what do I actually ask for?"). Acquisition hook: shareable transformations (buzz cut, breed swaps, seasonal looks). Monetization: Pro subscription.

## Problem

Dog owners book grooming appointments without a clear picture of what they want. They pull up Google Image search for "goldendoodle teddy bear cut" and try to describe it to a stranger holding clippers. Result: uneven satisfaction, occasional regret, repeat appointments to "fix" the cut. The cost ($60 to $150 per visit) makes the decision feel high stakes for what is effectively guesswork.

Adjacent pain: scrolling Instagram grooming accounts to bookmark cuts is a poor proxy, because the dog in the reference photo is a different dog. Owners want to see *their* dog with *that* cut.

## Target user

**Primary:** dog owners with high-maintenance coats (poodles, doodles, spaniels, terriers, shih tzus) who book professional grooming every 4 to 8 weeks. The ones with real style decisions to make.

**Secondary:** any dog owner who wants a fun share. Acquisition layer, not retention layer.

**Tertiary, later:** groomers themselves, as a consultation tool with clients.

## Core JTBD

1. "Help me decide what to ask the groomer for next time."
2. "Show me what my dog would look like with a mohawk / shaved / fluffy / as a different breed." (Toy, but powers virality.)
3. Eventually: "Help me find a groomer who does this style well."

## MVP scope

### In scope

- Photo capture flow optimized for dogs (full body plus face shots, lighting hints).
- Style picker organized by breed defaults, then curated style library. ~20 to 30 cuts at launch, mixing groomer-real (teddy bear, lion cut, puppy cut, kennel cut, summer shave, show cut) with on-brand internet-pilled gags (mohawk, "Wes Anderson," "1970s Rockstar," "He's Just A Boy," dye jobs). Custom prompts deferred to v2.
- Generation: same dog, same pose, different coat. Side-by-side before/after view.
- **Before/after share video.** Auto-generated short clip (3 to 5s) that morphs from the original photo into the styled result, scored to subtle audio. Vertical 9:16 format, designed for TikTok/Reels/Stories. This is the primary share asset, not the static image. Reference: Eyepic uses the same format and it does heavy lifting for their organic acquisition.
- "Next appointment" board the user can bring to the groomer.

### Out of scope (v1)

- Groomer marketplace.
- Full animated video generation (e.g. dog walking with new cut). The before/after morph is the only motion v1 supports.
- Try-on for cats. (Cat people will ask. Not now.)

## Key flows

### First-run

1. Open app, see 3 example transformations swiping past.
2. "Add your dog" → camera or library.
3. Auto-detect dog, prompt for breed (preselect best guess).
4. App auto-picks the highest-wow style for that breed and generates immediately. No browsing, no decision fatigue. The first thing the user sees is their dog already transformed.
5. Result lands with the before/after video. Sharing is free. Any further action (try another style, save, browse library, remove watermark) hits the paywall: $4.99/mo or $29.99/yr, no free trial.

### Returning user

1. Open to dog profile plus last few generations.
2. Browse styles by category (seasonal, breed-traditional, fun, custom prompt).
3. Save styles to "Next appointment" board.
4. Optional: "Show this to my groomer" generates a clean share card with reference photos and a written description of the cut.

## Technical approach

### Generation pipeline

- **Img2img backbone:** Flux or SDXL with a coat-focused LoRA fine-tuned on grooming before/after pairs.
- **Pose preservation:** ControlNet (OpenPose adapted for quadrupeds, or depth-based control to keep silhouette stable).
- **Face/identity preservation:** the hard problem. Keep the dog's facial features (snout shape, eye color, markings) consistent while varying coat. Options: IP-Adapter Face on the dog-face crop, or a custom identity embedding trained per-dog at signup (one-time ~30s processing).
- **Body-only masking** when the change is coat-only, so head identity stays untouched.
- **Before/after morph video:** post-generation step. Two options, ranked by cost: (1) client-side animated morph between the two stills with easing and a subtle camera push (cheap, runs on-device, ~instant); (2) image-to-video model like Runway Gen-3 or Kling for a more cinematic transition (expensive, gated to Pro). Default v1: client-side morph for everyone, server-side video model as a Pro upgrade in v1.5.

### Latency target

Sub-15s per generation on hot path. Async with push notification if longer. Pro tier gets priority queue.

### Data

Training data is the real moat candidate. Partner with grooming schools or license before-after sets. Curated breed × style × outcome pairs are not sitting on Reddit.

### Stack guess

- Mobile: native iOS first (dog owners on iOS tend to spend more on pet apps; verify).
- Backend: FastAPI or Go on GCP. Start with Replicate or Fal for inference, self-host once economics force it.
- Storage: Cloud Storage plus Firestore.

## Monetization

**Pro subscription, single tier.** $4.99/mo or $29.99/yr. No free trial.

Free experience:
- 1 generation, ever. Style is auto-picked by the app for max wow.
- Standard resolution.
- Watermarked before/after share video (client-side morph).
- View and share that one result; no further library access.

Pro:
- Unlimited generations.
- Full style library, including seasonal and designer drops as they ship.
- Higher resolution, no watermark on share video.
- Premium share video: cinematic image-to-video transition (server-side, e.g. Runway/Kling) instead of client-side morph. Shipping in v1.5.
- Priority queue (sub-15s hot path).
- "Show this to my groomer" share-card export.

Conversion model: the user sees their dog transformed once, with no decision required, no trial sign-up, no card capture pre-paywall. They love it (or they don't), and the only path to "more" is paid. This is more aggressive than a standard 7-day-trial flow. It works only if (a) the auto-picked wow moment hits hard, and (b) the watermarked share video does enough viral work to keep CAC reasonable.

Why subscription works as the recurring model: the JTBD is recurring (every grooming cycle, 4 to 8 weeks), so retention has a natural anchor. Monthly style drops give Pro users a reason to stay subscribed between cuts.

Hard rule: no ads, no IAP, no referral fees. One product, one price.

## Brand voice

Internet-pilled, not earnest pet-parent. Coif knows it's an app that puts your dog in a mohawk. The tone is dry, knowing, a little unhinged in the right places. Style names lean into pop culture and meme literacy ("Wes Anderson Goldendoodle," "1970s Rockstar Setter," "He's Just A Boy"). Marketing copy reads like a group chat, not a Petco catalog.

This is a conscious audience choice. It selects for younger, terminally online dog owners (the same demo that powers TikTok pet content) and selects against the sentimental "fur baby" segment. The fur-baby segment converts on subscription; the internet-pilled segment generates the organic share volume that makes paid acquisition affordable. We're betting the second cohort funds the first.

What this means in practice: copy is short, captions are jokes, the app icon is not a paw print, push notifications have voice. The line we don't cross is making fun of the dog. The dog is always the protagonist.

## Defensibility

Honest answer: the model itself is not defensible. Anyone can wire up Flux plus ControlNet. With subscription as the only revenue stream, defensibility lives entirely on the product-quality and retention side:

- **Proprietary training data:** licensed before-after grooming photos at scale. Quality gap is what justifies the subscription.
- **Per-dog identity embeddings** plus saved transformation history. Switching cost grows with use; a user with 6 months of saved looks for their dog will not casually re-onboard elsewhere.
- **Breed-aware prompting and style taxonomy.** A competitor would need months of curation work to match a well-built style library.
- **Style library cadence.** Regular drops (seasonal, designer collabs as content, not as IAP) give Pro users a reason to stay subscribed between grooming cycles.

## Risks

- **Feature, not product.** Snapchat, TikTok, or Rover could clone the toy in a sprint. Mitigation: ship fast, compound on quality and per-dog history so users feel locked in by their saved looks, not by the novelty.
- **Virality bottleneck.** A one-shot free tier limits the volume of organic shares vs an unlimited free-with-watermark approach. Mitigation: the watermarked before/after morph video (free-tier output) is the share asset doing virality work, not the static image. Reference: Eyepic ships a similar before/after format and rode it via TikTok despite an aggressive paywall.
- **Quality variance.** A bad generation that makes someone's dog look weird or scary will get screenshotted and roasted. Mitigation: aggressive output QA (auto-reject low-confidence gens, silent regen), conservative defaults.
- **Breed bias.** Underrepresented breeds (xolos, basenjis, mudis) will look worse than goldens. Mitigation: explicit per-breed eval set, transparent disclosure on supported breeds at launch.
- **Pet uncanny valley.** Owners are very sensitive to "that's not my dog." Identity preservation is do-or-die.
- **Content safety.** Someone will try to generate weird things. Standard image-gen safety filters, plus a "no humans, no other animals in the transformation" guardrail.

## Success metrics

**North star:** weekly retained dog profiles (a dog being generated against in week N+1).

**Activation:** % of new users who generate at least 3 styles in first session.

**Engagement:** generations per dog per week, saves to "Next appointment" board, before/after video share rate (organic acquisition signal; this is the metric that tells us if the watermarked video is actually doing virality work).

**Monetization:** install-to-paid conversion (the headline number, since there's no trial layer), monthly churn, MRR, ARPU, LTV by cohort, annual vs monthly mix, time-from-free-gen-to-paid (most conversions probably happen in the same session).

**Quality:** "looks like my dog" rating after generation (in-app micro survey), regen rate (high regen = bad output).

## Open questions

1. iOS-first or both platforms at launch? iOS is faster to a good demo and richer monetization. Android is half the market. Lean iOS for v1.
2. Watermarked-video share design: what does the watermark actually look and feel like? It needs to be visible enough to drive attribution but not ugly enough that people crop it out or refuse to share. Worth a dedicated design pass.
3. Auto-pick logic: which style do we pick for which breed, and does that selection get tuned over time based on which auto-picks have the highest convert-to-paid rate? Probably yes; this becomes a meaningful internal model.

*Decided:* monetization (Pro only, $4.99/mo or $29.99/yr, no trial), free flow (1 auto-picked gen ever), brand voice (internet-pilled), custom prompts (v2, not launch), one dog per account.

## Roadmap sketch

- **0 to 6 weeks:** Prototype generation pipeline, identity-preservation tests, ~10 styles. No app yet, just a Streamlit/Replit demo for internal testing.
- **6 to 14 weeks:** iOS app v0.1. Closed beta with ~50 dog owners across breeds. Iterate hard on quality. Pro tier wired up but free for beta.
- **14 to 20 weeks:** Public launch, 25 to 30 styles, free auto-picked gen plus Pro paywall (no trial), share features tuned for TikTok.
- **20 to 30 weeks:** Tune auto-pick logic and watermark design against install-to-paid conversion. Ship monthly style drops to drive Pro retention. First seasonal pack and one designer collab. Ship server-side video model for Pro users (v1.5).
- **30+ weeks:** Android, breed expansion, deeper style library, custom-prompt feature for Pro (v2).

---

## Build status (last updated 2026-05-06)

This is a web prototype, not the iOS app. The original plan is iOS-first. The web version exists to validate UX, brand voice, and the generation pipeline before any native investment.

### Deviations from the original plan

- **Web, not iOS.** Mobile-first React/Vite, mounted in a phone-frame on desktop. iOS native is still on the roadmap.
- **Generation provider:** Gemini 2.5 Flash Image instead of FLUX + ControlNet + IP-Adapter. Gemini is purpose-built for instruction-based multi-image editing and turns out to be the right tool for "apply this haircut to this exact dog while preserving everything else." Cost: ~$0.039 per gen.
- **Wes Anderson** style was removed (visual interpretation didn't land). **Frosted Tips** removed (concept doesn't translate to dogs). Library is currently 26 styles.
- **No native camera.** Photo upload via `<input type="file" capture="environment">`, which on phones opens the OS camera/library picker.

### Built

- **Capture flow:** photo upload, sample-dog fallback, lighting hints.
- **Breed identification:** auto-detected guess + free-text override (no list anymore).
- **Auto-pick first gen:** style selected by breed → immediate generation, no decision fatigue, per the doc's first-run flow.
- **Real img2img generation:** Gemini 2.5 Flash Image via a Vite-proxied API call. Supports two paths:
  - **Reference-based:** user photo + bundled reference photo + edit instruction. Default for any style with a `referenceImage`.
  - **Text-only fallback:** user photo + per-style edit instruction. Used when no reference exists.
  - **CSS-filter fallback:** when the API is disabled or fails. Cosmetic only.
- **Result screen:** auto-playing 4.5s before/after morph (client-side), side-by-side compare toggle, "looks like my dog" survey (UI only — not wired to storage), copyable prompt detail, watermark on free-tier output.
- **Share sheet** (UI only — TikTok / Reels / Stories / iMessage / Save / Copy link). Stub.
- **Paywall:** $4.99/mo and $29.99/yr tiers, no trial, no card capture in demo. Sets isPro state on tap.
- **Library:** 26 styles across groomer-real / fun / seasonal / designer-drops categories. Pro-gated. Reference photos shown on cards when available.
- **Profile:** generation history, breed override display, generation count.
- **Next Appointment Board:** the groomer share page, Pro-gated for export.
- **Settings:** subscription state, breed display, demo reset.
- **Tooling:**
  - `npm run dev -- --host` — dev server with LAN access
  - `npm run gen-refs` — text-to-image script that bootstraps reference photos for any style with `referenceImage` set
  - `npm run edit -- --input=foo.jpg --style=mohawk` — standalone CLI that runs the runtime img2img pipeline against any photo, bypassing the React app

### Not yet built

- **State persistence (localStorage).** Refresh wipes the dog profile and generations. Should be cheap to add.
- **Real share invocation.** The share sheet is decorative — `navigator.share()` is not wired up.
- **Watermark design pass.** Currently italic "made with coif" text, no logo, no styling work. Doc flagged this as worth a dedicated design pass.
- **Quality survey wiring.** "Looks like my dog" buttons toggle local UI state but don't log anywhere.
- **Per-breed eval set.** Doc lists this as the mitigation for breed bias. Not started.
- **Auto-pick tuning.** Open question in the doc — which style for which breed, tuned by install-to-paid conversion. Currently hardcoded mappings.
- **Cinematic Pro video.** Server-side image-to-video transition (Runway/Kling). v1.5 in the original roadmap.
- **Custom prompts** (v2).
- **Breed-coded reference quality.** A few invented styles still need better references (Father Figure, Witness Protection, Bouncer, designer drops). Currently text-only fallback.
- **Push notifications, async generation queue, server-side anything.** Currently fully client-side against Gemini.

### Next up (recommended order)

1. **localStorage persistence** so testing isn't a re-onboarding tax on every refresh.
2. **Real `navigator.share()` invocation** to close the loop on the design doc's stated viral mechanism.
3. **Watermark design.** Visible enough to drive attribution, not ugly enough to crop out.
4. **Reference photo iteration** for the styles that don't read well with Gemini's text-only interpretation.

# Funnel friction audit

**Page:** https://example-edtech.com/free-trial/  
**Device:** phone (390x844, iOS Safari)  
**Date:** 2026-11-18  
**Mode:** read-only (no form submitted)

## Taps from the ad to submit: **5**

| # | Step | Taps |
|---|---|---|
| 1 | Tap the ad | 1 |
| 2 | Close the cookie banner ("ACCEPT") | 1 |
| 3 | Fill "NAME" (required) | 1 |
| 4 | Fill "EMAIL" (required) | 1 |
| 5 | "By sending the form you agree to recei" (already ticked) | 0 |
| 6 | Tap submit ("Free access →") | 1 |

## What to fix

- **Speed:** The page took 5.9 s to load on a phone profile. Every second here loses leads from social.
- **Consent (EU):** Fired before any consent: Meta Pixel, Hotjar. These tags have no consent mode: block them until the lead accepts.
- **Consent mode (EU):** 5 Google request(s) before consent carried no consent signal (no gcs flag). Google consent mode v2 looks missing: GA4 / Ads data may be collected without consent.
- **Cookie banner over the form:** The banner covers part of the sign-up form on a phone. Use a smaller banner (bottom bar) so the form stays usable.
- **Not tested:** What happens after sign-up was not tested (read-only run). Run with --submit --email <your test address> to check it.

## Tracking seen

| Phase | Tags |
|---|---|
| Before consent | Google Tag Manager, Google tag (gtag.js), Meta Pixel, Hotjar, Google Ads, GA4 (Google requests: 0 with consent flag, 5 without) |
| After consent | Meta Pixel |
| After submit | not tested |

## Page facts

- Load time (phone profile): 5.9 s
- Cookie banner: yes ("ACCEPT")
- Form fields: 3
- First form field at: 346px (screen height 844px)
- First CTA: "Free access →" at 594px

## The 3-part fix

1. **Instant access.** Log the lead in, or give 1 button that opens the product. No inbox first.
2. **A success banner, not a thank-you page.** Fire the sign-up event on submit (browser + server), then send the lead straight to the result.
3. **Email only as a backup.** Welcome email with the login link, for later.

Then test it like a lead: on a phone, starting from the ad.

_Screenshots: 1-landing.png_

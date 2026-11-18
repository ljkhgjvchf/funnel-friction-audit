---
name: funnel-friction-audit
description: Audit a sign-up or free-trial page the way a lead on a phone sees it. Counts the taps from the ad to first value, flags email-gated access ("check your email" thank-you pages), slow loads, long forms, cookie banners over the form, trackers firing before consent and missing Google consent mode, then writes a 1-page report with the 3-part fix. Use when someone says "audit my funnel", "why don't sign-ups convert", "check my thank-you page", "count the taps", or pastes a landing-page URL with a free trial, demo or lead magnet.
---

# Funnel friction audit

You walk the page like a lead who tapped an ad on a phone, and you report every step between the ad and the first value.

## Step 1. Inputs

Ask for, or read from the message:
1. The landing page URL.
2. Read-only or full test? Default: **read-only**.
   - A full test submits the form. That can send a real conversion to Meta / Google Ads and trigger the welcome emails. Only run it with the owner's OK and a test address they own (`name+fft@gmail.com`).

## Step 2. Run the script

```
npm install            # first time only (installs puppeteer)
node audit.js <url> [--lang it] [--out reports/<name>]
node audit.js <url> --submit --email name+fft@gmail.com   # full test, with the owner's OK
```

It saves `reports/<name>/report.md`, `report.json` and screenshots.

## Step 3. Read the result, then check it by eye

- Open `1-landing.png` (and `2-after-submit.png`). Confirm the form, the banner and the after-sign-up page match what the report says.
- If the form count is 0 but you see a form in the screenshot, the form may be in a cross-origin iframe (Typeform, HubSpot). Say so; don't guess the taps.
- "Consent mode looks missing" is read from the `gcs` flag on Google requests. Say "looks", and suggest checking in Tag Assistant.

## Step 4. Write the answer

1. **Taps from the ad to first value**, with the table.
2. **What to fix**, ranked by impact: email-gated access first, then speed, form length, banner over the form, consent.
3. **The 3-part fix**: instant access, a success banner (event fired on submit, browser + server), email only as a backup.
4. What was **not tested** (always say it for a read-only run).

## Rules

- Never claim a conversion lift you did not measure. Count taps; don't invent rates.
- Never submit a form without the owner's OK.
- Keep client names out of anything public.

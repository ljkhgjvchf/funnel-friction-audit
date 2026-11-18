# funnel-friction-audit

**Count every tap between your ad and your product, on a phone.**

Most sign-up funnels lose leads after the form, not before it. The classic leak is the thank-you page that says *"check your email"*. In one funnel I studied, 82 leads signed up for a free trial, 57 never clicked a single email, and 1 started the trial. 94.8% of them were on a phone.

This tool walks your page like that lead does and tells you where the friction is.

## What it checks

| Check | Why it matters |
|---|---|
| **Taps from the ad to first value** | Every tap is a place to lose a lead. |
| **Email-gated access** ("check your email" after sign-up) | The lead must leave your page, open the inbox, find the email and tap a link. |
| **Load time on a phone profile** | Social traffic is impatient. |
| **Form length and position** | Fields you don't need, or a form below the fold. |
| **Cookie banner over the form** | On a phone it can hide the sign-up button. |
| **Trackers before consent + Google consent mode** | EU rules. Reads the `gcs` flag on GA4 / Google Ads requests. |
| **Sign-up event after submit** | If nothing fires, your ads can't learn from sign-ups. |

It ends with the 3-part fix: **instant access**, a **success banner** with the event fired in the background, and **email only as a backup**.

## Use it

```bash
git clone https://github.com/ljkhgjvchf/funnel-friction-audit
cd funnel-friction-audit
npm install

# read-only (default): never submits the form
node audit.js https://yoursite.com/free-trial/ --lang en

# full test: submits the form with a test address you own
node audit.js https://yoursite.com/free-trial/ --submit --email you+fft@gmail.com
```

Output goes to `reports/<site>/`: `report.md`, `report.json` and phone screenshots. See [examples/sample-report.md](examples/sample-report.md).

> **Why read-only by default:** a test sign-up can send a real conversion to Meta or Google Ads and trigger your welcome emails. Run the full test only on your own funnel, or with the owner's OK.

## Use it as a Claude skill

Copy `SKILL.md` to `~/.claude/skills/funnel-friction-audit/SKILL.md` (with this folder next to it), then ask Claude: *"audit my funnel: https://yoursite.com/free-trial/"*. Claude runs the script, checks the screenshots and writes the fix list.

## Limits

- Forms inside cross-origin iframes (Typeform, HubSpot embeds) can't be filled; the report says so.
- "Consent mode looks missing" is a signal, not a legal verdict. Confirm in Google Tag Assistant.
- It counts taps. It does not invent conversion rates.

## Test

```bash
npm test   # checks the language patterns (EN, IT, FR, ES, DE)
```

MIT licence. Built by [Nicola Da Dalto](https://www.linkedin.com/in/nicoladadalto/) · AI Marketing Operations.

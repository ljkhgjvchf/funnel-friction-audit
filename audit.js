#!/usr/bin/env node
// funnel-friction-audit: walk a sign-up page the way a lead on a phone does, and report every step between the ad and the first value.
// Usage:
//   node audit.js <url> [--submit --email you+test@domain.com] [--out reports/<name>] [--lang it]
// Default is READ-ONLY: it never submits a form unless you pass --submit (a test sign-up can feed real conversions to your ad platforms).
const fs = require("fs"), path = require("path");

function loadPuppeteer() {
  try { return require("puppeteer"); } catch (_) {}
  try { return require("puppeteer-core"); } catch (_) {}
  console.error("Puppeteer not found. Run: npm install");
  process.exit(1);
}

// ---------- args ----------
const argv = process.argv.slice(2);
const url = argv.find(a => /^https?:\/\//.test(a));
const flag = n => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
if (!url) { console.error("Usage: node audit.js <url> [--submit --email test@example.com] [--out reports/name]"); process.exit(1); }
const SUBMIT = flag("--submit"), EMAIL = opt("--email", ""), OUT = opt("--out", path.join("reports", new URL(url).hostname.replace(/\W+/g, "-")));
if (SUBMIT && !EMAIL) { console.error("--submit needs --email (use an address you own, e.g. you+fft@gmail.com)"); process.exit(1); }

const { TRACKERS, CHECK_EMAIL, INSTANT, ACCEPT, CTA } = require("./patterns");
const hit = u => TRACKERS.filter(([, re]) => re.test(u)).map(([n]) => n);

(async () => {
  const puppeteer = loadPuppeteer();
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--lang=" + opt("--lang", "en")] });
  const page = await browser.newPage();
  // iPhone 14-ish, the device most paid social traffic arrives on
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");

  // forms often live inside shadow DOM (web components, page builders): search through open shadow roots
  await page.evaluateOnNewDocument(() => {
    window.__all = (sel, root = document) => { let out = [...root.querySelectorAll(sel)]; root.querySelectorAll("*").forEach(e => { if (e.shadowRoot) out = out.concat(window.__all(sel, e.shadowRoot)); }); return out; };
    window.__vis = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
  });
  const gcs = { withFlag: 0, without: 0, denied: 0 };
  const phase = { now: "before-consent" }, reqs = { "before-consent": new Set(), "after-consent": new Set(), "after-submit": new Set() };
  page.on("request", r => {
    const u = r.url(), names = hit(u); names.forEach(n => reqs[phase.now].add(n));
    if (phase.now === "before-consent" && /GA4|Google Ads/.test(names.join())) {
      const m = (u + "&" + (r.postData() || "")).match(/[?&]gcs=G1(\d)(\d)/);
      if (!m) gcs.without++; else { gcs.withFlag++; if (m[1] === "0" && m[2] === "0") gcs.denied++; }
    }
  });

  const t0 = Date.now();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(e => console.error("load:", e.message));
  const loadMs = Date.now() - t0;
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(OUT, "1-landing.png") });

  // ---------- consent ----------
  const consent = await page.evaluate(src => {
    const re = new RegExp(src, "i");
    const els = __all("button,a,[role=button],input[type=button],input[type=submit]").filter(__vis);
    const b = els.find(e => re.test((e.innerText || e.value || "").trim()));
    if (!b) return { found: false };
    const r = b.getBoundingClientRect(); b.setAttribute("data-fft-accept", "1");
    return { found: true, text: (b.innerText || b.value).trim(), coversScreen: r.top < innerHeight };
  }, ACCEPT.source);
  if (consent.found) {
    phase.now = "after-consent";
    await page.evaluate(() => { const b = __all("[data-fft-accept]")[0]; b && b.click(); }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
  } else phase.now = "after-consent";

  // ---------- form + CTA ----------
  const form = await page.evaluate(ctaSrc => {
    const vis = __vis;
    const inputs = __all("input,select,textarea").filter(i => vis(i) && !["hidden", "submit", "button", "image", "reset"].includes(i.type) && !/cli-|cookie|consent|cmplz|cky-/i.test(i.name + i.id + i.className));
    const label = i => { const l = i.labels && i.labels[0]; return ((l && l.innerText) || i.getAttribute("aria-label") || i.name || i.placeholder || i.id || "").trim().slice(0, 40); };
    const fields = inputs.map(i => ({ type: i.type || i.tagName.toLowerCase(), name: label(i), prefilled: (i.type === "checkbox" || i.type === "radio") ? i.checked : false, required: i.required || i.getAttribute("aria-required") === "true", top: Math.round(i.getBoundingClientRect().top + scrollY) }));
    const firstTop = fields.length ? Math.min(...fields.map(f => f.top)) : null;
    const ctaRe = new RegExp(ctaSrc, "i");
    const ctas = __all("a,button").filter(e => vis(e) && ctaRe.test(e.innerText || "")).map(e => ({ text: (e.innerText || "").trim().slice(0, 60), top: Math.round(e.getBoundingClientRect().top + scrollY), href: e.getAttribute("href") || "" }));
    const firstCta = ctas.sort((a, b) => a.top - b.top)[0] || null;
    const submit = __all("button[type=submit],input[type=submit],form button").filter(vis).filter(e => !/accept|reject|cookie/i.test(e.innerText || e.value || "")).map(e => (e.innerText || e.value || "").trim())[0] || null;
    const iframes = __all("iframe").map(f => f.src).filter(s => /form|typeform|hubspot|jotform|tally|google\.com\/forms|calendly/i.test(s));
    return { fields, firstTop, viewport: innerHeight, pageHeight: document.documentElement.scrollHeight, firstCta, submit, iframes };
  }, CTA.source);

  // taps from ad to submit (the lead's real path on a phone)
  const steps = [{ step: "Tap the ad", taps: 1 }];
  if (consent.found && consent.coversScreen) steps.push({ step: `Close the cookie banner ("${consent.text}")`, taps: 1 });
  if (form.firstTop == null && form.firstCta) steps.push({ step: `Tap the CTA ("${form.firstCta.text}") to reach the form`, taps: 1 });
  else if (form.firstTop != null && form.firstTop > form.viewport) steps.push({ step: `Scroll to the form (${Math.round(form.firstTop / form.viewport * 10) / 10} screens down)`, taps: 1 });
  form.fields.forEach(f => steps.push(f.prefilled ? { step: `"${f.name || f.type}" (already ticked)`, taps: 0 } : { step: `${f.type === "checkbox" ? "Tick" : "Fill"} "${f.name || f.type}"${f.required ? " (required)" : ""}`, taps: 1 }));
  if (form.fields.length || form.submit) steps.push({ step: `Tap submit ("${form.submit || "submit"}")`, taps: 1 });

  // ---------- optional submit ----------
  let after = { tested: false };
  if (SUBMIT && form.fields.length) {
    const before = page.url();
    await page.evaluate(email => {
      const vis = __vis;
      for (const i of __all("input,select,textarea")) {
        if (!vis(i) || ["hidden", "submit", "button"].includes(i.type)) continue;
        if (i.type === "email" || /mail/i.test(i.name + i.id)) i.value = email;
        else if (i.type === "checkbox") { if (i.required) i.checked = true; }
        else if (i.type === "tel") i.value = "3330000000";
        else if (i.tagName === "SELECT") i.selectedIndex = Math.min(1, i.options.length - 1);
        else if (i.type === "radio") i.checked = true;
        else if (!i.value) i.value = "Test FFT";
        i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, EMAIL);
    phase.now = "after-submit";
    const dl0 = await page.evaluate(() => (window.dataLayer || []).length).catch(() => 0);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.evaluate(() => { const b = __all("button[type=submit],input[type=submit],form button").find(e => __vis(e) && !/accept|reject|cookie/i.test(e.innerText || e.value || "")); b && b.click(); }),
    ]);
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUT, "2-after-submit.png") });
    const text = await page.evaluate(() => [document.body.innerText, ...__all("*").filter(e => e.shadowRoot).map(e => e.shadowRoot.textContent)].join(" ").slice(0, 8000)).catch(() => "");
    const events = await page.evaluate(n => (window.dataLayer || []).slice(n).map(e => e && e.event).filter(Boolean), dl0).catch(() => []);
    after = { tested: true, from: before, to: page.url(), redirected: page.url() !== before, checkEmail: CHECK_EMAIL.test(text), instant: INSTANT.test(text), snippet: (text.match(CHECK_EMAIL) || [""])[0], events };
    if (after.checkEmail && !after.instant) steps.push({ step: "Leave the page/app", taps: 1 }, { step: "Open the inbox", taps: 1 }, { step: "Find the email (inbox, promotions or spam)", taps: 1 }, { step: "Tap the link, wait for a new tab", taps: 1 });
  }
  await browser.close();

  // ---------- score + report ----------
  const taps = steps.reduce((s, x) => s + x.taps, 0);
  const preConsent = [...reqs["before-consent"]];
  const flags = [];
  if (loadMs > 3000) flags.push(["Speed", `The page took ${(loadMs / 1000).toFixed(1)} s to load on a phone profile. Every second here loses leads from social.`]);
  if (form.fields.length > 3) flags.push(["Form length", `${form.fields.length} fields. Ask only what you need to give access (often just email).`]);
  if (form.firstTop != null && form.firstTop > form.viewport) flags.push(["Form below the fold", "The lead must scroll before they can sign up. Put the form or a CTA to it in the first screen."]);
  if (after.tested && after.checkEmail && !after.instant) flags.push(["Email-gated access", `After sign-up the page says "${after.snippet}". The lead must leave to get in. This is the bottleneck.`]);
  if (after.tested && !after.redirected && !after.checkEmail) flags.push(["Dead end", "After sign-up the lead stays on the same page with no clear next step."]);
  const nonGoogle = preConsent.filter(n => !/GA4|Google|gtag/.test(n));
  if (nonGoogle.length) flags.push(["Consent (EU)", `Fired before any consent: ${nonGoogle.join(", ")}. These tags have no consent mode: block them until the lead accepts.`]);
  if (gcs.without) flags.push(["Consent mode (EU)", `${gcs.without} Google request(s) before consent carried no consent signal (no gcs flag). Google consent mode v2 looks missing: GA4 / Ads data may be collected without consent.`]);
  if (consent.found && consent.coversScreen && form.firstTop != null && form.firstTop < form.viewport * 1.5) flags.push(["Cookie banner over the form", "The banner covers part of the sign-up form on a phone. Use a smaller banner (bottom bar) so the form stays usable."]);
  if (after.tested && !after.events.length && !reqs["after-submit"].size) flags.push(["Tracking", "No sign-up event was seen after submit (dataLayer or tracker requests). Your ads may not learn from sign-ups."]);
  if (!after.tested) flags.push(["Not tested", "What happens after sign-up was not tested (read-only run). Run with --submit --email <your test address> to check it."]);

  const md = `# Funnel friction audit\n\n**Page:** ${url}  \n**Device:** phone (390x844, iOS Safari)  \n**Date:** ${new Date().toISOString().slice(0, 10)}  \n**Mode:** ${SUBMIT ? "full (test sign-up sent)" : "read-only (no form submitted)"}\n\n` +
    `## Taps from the ad to ${after.tested ? "first value" : "submit"}: **${taps}**\n\n| # | Step | Taps |\n|---|---|---|\n` + steps.map((s, i) => `| ${i + 1} | ${s.step} | ${s.taps} |`).join("\n") +
    `\n\n## What to fix\n\n` + (flags.length ? flags.map(([k, v]) => `- **${k}:** ${v}`).join("\n") : "- Nothing flagged.") +
    `\n\n## Tracking seen\n\n| Phase | Tags |\n|---|---|\n| Before consent | ${preConsent.join(", ") || "none"}${gcs.withFlag + gcs.without ? ` (Google requests: ${gcs.withFlag} with consent flag, ${gcs.without} without)` : ""} |\n| After consent | ${[...reqs["after-consent"]].join(", ") || "none"} |\n| After submit | ${after.tested ? ([...reqs["after-submit"]].join(", ") || "none") + (after.events.length ? ` · dataLayer: ${after.events.join(", ")}` : "") : "not tested"} |\n` +
    `\n## Page facts\n\n- Load time (phone profile): ${(loadMs / 1000).toFixed(1)} s\n- Cookie banner: ${consent.found ? `yes ("${consent.text}")` : "not found"}\n- Form fields: ${form.fields.length}${form.iframes.length ? ` (+ embedded form: ${form.iframes.join(", ")})` : ""}\n- First form field at: ${form.firstTop == null ? "no form on this page" : `${form.firstTop}px (screen height ${form.viewport}px)`}\n- First CTA: ${form.firstCta ? `"${form.firstCta.text}" at ${form.firstCta.top}px` : "none found"}\n` +
    (after.tested ? `- After submit: ${after.redirected ? `redirected to ${after.to}` : "same page"}; "check your email" message: ${after.checkEmail ? "yes" : "no"}; instant-access signal: ${after.instant ? "yes" : "no"}\n` : "") +
    `\n## The 3-part fix\n\n1. **Instant access.** Log the lead in, or give 1 button that opens the product. No inbox first.\n2. **A success banner, not a thank-you page.** Fire the sign-up event on submit (browser + server), then send the lead straight to the result.\n3. **Email only as a backup.** Welcome email with the login link, for later.\n\nThen test it like a lead: on a phone, starting from the ad.\n\n_Screenshots: 1-landing.png${after.tested ? ", 2-after-submit.png" : ""}_\n`;
  fs.writeFileSync(path.join(OUT, "report.md"), md);
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ url, loadMs, consent, gcs, form, steps, taps, trackers: Object.fromEntries(Object.entries(reqs).map(([k, v]) => [k, [...v]])), after, flags }, null, 2));
  console.log(md);
  console.log("Saved:", path.join(OUT, "report.md"));
})();

// Patterns used by audit.js. Add a language by extending CHECK_EMAIL / INSTANT / ACCEPT, then run: npm test
const TRACKERS = [
  ["GA4", /google-analytics\.com\/(g\/)?collect|analytics\.google\.com\/g\/collect/],
  ["Google Tag Manager", /googletagmanager\.com\/gtm\.js/],
  ["Google tag (gtag.js)", /googletagmanager\.com\/gtag\/js/],
  ["Google Ads", /googleadservices\.com|googleads\.g\.doubleclick\.net|google\.com\/(pagead|ccm)\/(conversion|collect)/],
  ["Meta Pixel", /facebook\.com\/tr|connect\.facebook\.net/],
  ["TikTok Pixel", /analytics\.tiktok\.com/],
  ["LinkedIn Insight", /px\.ads\.linkedin\.com|snap\.licdn\.com/],
  ["Microsoft Clarity", /clarity\.ms/],
  ["Hotjar", /hotjar\.com/],
];
const CHECK_EMAIL = /(check|confirm|verify) (your )?(e-?mail|inbox)|we('ve| have)? (just )?sent (you )?(an? )?(e-?mail|link)|look in your inbox|controlla (la tua |la )?(e-?mail|casella|posta)|ti abbiamo (appena )?inviato|verifica (la tua )?e-?mail|riceverai (una |un'?)?e-?mail|conferma (la tua )?e-?mail|v[ée]rifiez votre (bo[iî]te|e-?mail)|nous vous avons envoy[ée]|revisa tu (correo|bandeja)|te (hemos|enviamos)|pr[üu]fe? (dein|ihr)e? (e-?mail|postfach)|wir haben (dir|ihnen)/i;
const INSTANT = /dashboard|my account|il mio account|area riservata|welcome|benvenut|start (your )?(trial|lesson)|inizia|download|scarica|watch now|guarda (ora|subito)|accedi ora|you'?re in/i;
const ACCEPT = /^(accept( all)?|allow( all)?|i agree|agree|ok|got it|accetta( tutto| tutti)?|accetto|consenti|tout accepter|accepter|aceptar( todo)?|alle akzeptieren|akzeptieren)$/i;
const CTA = /(prova|inizia|start|try|get|ottieni|scarica|download|sign ?up|iscriviti|registrati|richiedi|book|prenota|join|free|gratis|gratuit)/i;

module.exports = { TRACKERS, CHECK_EMAIL, INSTANT, ACCEPT, CTA };

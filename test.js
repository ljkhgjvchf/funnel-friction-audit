// Smallest check that fails if a pattern breaks: node test.js
const assert = require("assert");
const { CHECK_EMAIL, INSTANT, ACCEPT, TRACKERS } = require("./patterns");
const yes = ["Check your email to get started", "We've sent you a link", "Controlla la tua email", "Ti abbiamo inviato il link", "Vérifiez votre boîte mail", "Revisa tu correo", "Prüfe deine E-Mail"];
const no = ["Welcome! Your trial starts now", "Benvenuta, guarda subito la lezione"];
yes.forEach(t => assert(CHECK_EMAIL.test(t), "should flag: " + t));
no.forEach(t => assert(!CHECK_EMAIL.test(t), "should not flag: " + t));
assert(INSTANT.test("Go to your dashboard") && INSTANT.test("Guarda subito la lezione"));
["Accept", "ACCEPT", "Accetta tutto", "Tout accepter", "Alle akzeptieren"].forEach(t => assert(ACCEPT.test(t), t));
assert(!ACCEPT.test("Reject"));
const name = u => TRACKERS.filter(([, re]) => re.test(u)).map(([n]) => n);
assert.deepStrictEqual(name("https://region1.analytics.google.com/g/collect?v=2"), ["GA4"]);
assert.deepStrictEqual(name("https://www.facebook.com/tr/?id=1&ev=PageView"), ["Meta Pixel"]);
console.log("ok: all pattern checks pass");

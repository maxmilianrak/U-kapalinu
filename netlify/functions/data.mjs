/* ════════════════════════════════════════════════════════════════════
   API pro obsah webu — Restaurace U Kapalínů

   GET    /api/data        → vrátí uložený obsah (veřejné, bez přihlášení)
   POST   /api/prihlaseni  → { heslo } → { token }
   POST   /api/data        → uloží obsah (vyžaduje hlavičku Authorization)

   GET    /api/fotka/<id>    → vydá nahranou fotku (veřejné)
   GET    /api/fotka/<id>-n  → totéž, zmenšený náhled do galerie
   POST   /api/fotka         → nahraje fotku (vyžaduje Authorization)

   NASTAVENÍ V NETLIFY (Site configuration → Environment variables):
     ADMIN_HESLO   — heslo do administrace, které dostane klient
     ADMIN_TAJNY   — libovolný náhodný řetězec (podepisuje přihlášení)

   Když ADMIN_TAJNY nenastavíte, odvodí se z hesla. Funguje to, ale
   po změně hesla se odhlásí všichni — což je vlastně správně.

   Fotky: obrázek se zmenší už v prohlížeči klienta, sem přijde hotový
   JPEG. Ukládá se pod klíč fotka-<id> (velká) a fotka-<id>-n (náhled).
   Seznam fotek je součástí obsahu, takže mazání a pořadí řeší klient
   v administraci a uloží se spolu s menu.
   ════════════════════════════════════════════════════════════════════ */

import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const KLIC = "obsah";
const PLATNOST_HODIN = 12;
const MAX_FOTEK = 24;
const MAX_VELKA = 2 * 1024 * 1024;    // 2 MB po dekódování
const MAX_NAHLED = 700 * 1024;

/* prázdná kostra — když ještě nikdo nic neuložil, web si vezme
   vlastní výchozí obsah ze souboru obsah-vychozi.js */
const PRAZDNO = {};

function hlavicky(extra = {}) {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extra
  };
}

function odpoved(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: hlavicky() });
}

function tajny() {
  return process.env.ADMIN_TAJNY || ("odvozeno:" + (process.env.ADMIN_HESLO || "bez-hesla"));
}

function vytvorToken() {
  const platiDo = Date.now() + PLATNOST_HODIN * 3600 * 1000;
  const podpis = crypto.createHmac("sha256", tajny()).update(String(platiDo)).digest("hex");
  return platiDo + "." + podpis;
}

function tokenPlati(token) {
  if (!token || typeof token !== "string") return false;
  const [platiDo, podpis] = token.split(".");
  if (!platiDo || !podpis) return false;
  if (Number(platiDo) < Date.now()) return false;
  const ocekavany = crypto.createHmac("sha256", tajny()).update(String(platiDo)).digest("hex");
  // porovnání odolné vůči měření času
  const a = Buffer.from(podpis, "hex");
  const b = Buffer.from(ocekavany, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function prihlasen(req) {
  const hlavicka = req.headers.get("authorization") || "";
  return tokenPlati(hlavicka.replace(/^Bearer\s+/i, "").trim());
}

function hesloSedi(zadane) {
  const spravne = process.env.ADMIN_HESLO;
  if (!spravne) return false;
  const a = Buffer.from(String(zadane || ""), "utf8");
  const b = Buffer.from(spravne, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ─── jednoduchá kontrola tvaru dat, ať se do úložiště nedostane nesmysl ─── */
function text(v, max = 400) {
  return String(v == null ? "" : v).slice(0, max);
}

/* název souboru ve složce fotky/ — jen písmena, číslice a pomlčky */
function cistySrc(v) {
  return String(v == null ? "" : v).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

function cisteId(v) {
  const s = String(v == null ? "" : v);
  return /^[a-f0-9]{32}$/.test(s) ? s : "";
}

function ocisti(vstup) {
  const d = vstup && typeof vstup === "object" ? vstup : {};
  const out = {};

  if (d.tydenni && typeof d.tydenni === "object") {
    out.tydenni = { text: text(d.tydenni.text, 8000) };
  }

  if (d.stale && typeof d.stale === "object") {
    out.stale = {
      poznamka: text(d.stale.poznamka, 400),
      kategorie: (Array.isArray(d.stale.kategorie) ? d.stale.kategorie : []).slice(0, 30).map(k => ({
        nazev: text(k && k.nazev, 80),
        polozky: (Array.isArray(k && k.polozky) ? k.polozky : []).slice(0, 80).map(p => ({
          nazev: text(p && p.nazev, 200),
          popis: text(p && p.popis, 300),
          cena: text(p && p.cena, 20)
        })).filter(p => p.nazev)
      })).filter(k => k.nazev)
    };
  }

  if (d.akce && typeof d.akce === "object") {
    out.akce = {
      prazdnyText: text(d.akce.prazdnyText, 400),
      polozky: (Array.isArray(d.akce.polozky) ? d.akce.polozky : []).slice(0, 40).map(a => ({
        nazev: text(a && a.nazev, 200),
        datum: text(a && a.datum, 10),
        cas: text(a && a.cas, 20),
        popis: text(a && a.popis, 600)
      })).filter(a => a.nazev)
    };
  }

  if (Array.isArray(d.fotky)) {
    out.fotky = d.fotky.slice(0, MAX_FOTEK).map(f => {
      const polozka = { popis: text(f && f.popis, 120) };
      const id = cisteId(f && f.id);
      if (id) polozka.id = id;
      else {
        const src = cistySrc(f && f.src);
        if (!src) return null;
        polozka.src = src;
      }
      return polozka;
    }).filter(Boolean);
  }

  return out;
}

/* ─── fotky ──────────────────────────────────────────────────────── */

/* z „data:image/jpeg;base64,…“ udělá ArrayBuffer */
function zDataURL(hodnota, maxBajtu) {
  const s = String(hodnota == null ? "" : hodnota);
  const m = s.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > maxBajtu) return null;
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function nahrajFotku(req, store) {
  let telo;
  try { telo = await req.json(); } catch { return odpoved({ chyba: "Neplatná data." }, 400); }

  const velka = zDataURL(telo && telo.velka, MAX_VELKA);
  const nahled = zDataURL(telo && telo.nahled, MAX_NAHLED);
  if (!velka || !nahled) {
    return odpoved({ chyba: "Fotku se nepodařilo přečíst, nebo je moc velká." }, 400);
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  try {
    await store.set("fotka-" + id, velka);
    await store.set("fotka-" + id + "-n", nahled);
  } catch (e) {
    return odpoved({ chyba: "Uložení fotky se nepodařilo: " + (e && e.message ? e.message : "neznámá chyba") }, 500);
  }

  return odpoved({ ok: true, id: id, popis: text(telo && telo.popis, 120) });
}

async function vydejFotku(store, klic) {
  try {
    const data = await store.get(klic, { type: "arrayBuffer" });
    if (!data) return new Response("Fotka nenalezena", { status: 404 });
    return new Response(data, {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        /* id se nikdy nepoužije podruhé, takže se může držet natrvalo */
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Fotka nenalezena", { status: 404 });
  }
}

/* smaže obrázky, které klient vyhodil ze seznamu */
async function uklidFotky(store, stare, nove) {
  const zbyva = new Set(
    (Array.isArray(nove) ? nove : []).map(f => f && f.id).filter(Boolean)
  );
  const pryc = (Array.isArray(stare) ? stare : [])
    .map(f => f && f.id)
    .filter(id => id && !zbyva.has(id));

  for (const id of pryc) {
    try {
      await store.delete("fotka-" + id);
      await store.delete("fotka-" + id + "-n");
    } catch { /* když už tam není, nevadí */ }
  }
  return pryc.length;
}

/* ════════════════════════════════════════════════════════════════════ */
export default async (req) => {
  const url = new URL(req.url);
  const cesta = url.pathname.replace(/\/+$/, "");

  /* ─── přihlášení ─────────────────────────────────────────────── */
  if (cesta.endsWith("/prihlaseni")) {
    if (req.method !== "POST") return odpoved({ chyba: "Použijte POST." }, 405);

    if (!process.env.ADMIN_HESLO) {
      return odpoved({
        chyba: "Administrace zatím není nastavená. V Netlify doplňte proměnnou ADMIN_HESLO."
      }, 503);
    }

    let telo;
    try { telo = await req.json(); } catch { return odpoved({ chyba: "Neplatný požadavek." }, 400); }

    if (!hesloSedi(telo && telo.heslo)) {
      return odpoved({ chyba: "Heslo nesouhlasí." }, 401);
    }
    return odpoved({ token: vytvorToken(), platnostHodin: PLATNOST_HODIN });
  }

  const store = getStore({ name: "ukapalinu", consistency: "strong" });

  /* ─── fotky ──────────────────────────────────────────────────── */
  if (cesta.includes("/fotka")) {
    if (req.method === "GET") {
      const kus = cesta.split("/").pop();
      if (!/^[a-f0-9]{32}(-n)?$/.test(kus)) {
        return new Response("Neplatná adresa fotky", { status: 400 });
      }
      return vydejFotku(store, "fotka-" + kus);
    }
    if (req.method === "POST") {
      if (!prihlasen(req)) {
        return odpoved({ chyba: "Přihlášení vypršelo. Přihlaste se prosím znovu." }, 401);
      }
      return nahrajFotku(req, store);
    }
    return odpoved({ chyba: "Nepodporovaná metoda." }, 405);
  }

  /* ─── čtení obsahu ───────────────────────────────────────────── */
  if (req.method === "GET") {
    try {
      const data = await store.get(KLIC, { type: "json" });
      return odpoved(data || PRAZDNO);
    } catch {
      return odpoved(PRAZDNO);
    }
  }

  /* ─── uložení obsahu ─────────────────────────────────────────── */
  if (req.method === "POST" || req.method === "PUT") {
    if (!prihlasen(req)) {
      return odpoved({ chyba: "Přihlášení vypršelo. Přihlaste se prosím znovu." }, 401);
    }

    let telo;
    try { telo = await req.json(); } catch { return odpoved({ chyba: "Neplatná data." }, 400); }

    const cista = ocisti(telo);
    if (!Object.keys(cista).length) {
      return odpoved({ chyba: "Data neobsahují žádnou známou sekci." }, 400);
    }

    try {
      const stara = (await store.get(KLIC, { type: "json" })) || {};
      const nova = { ...stara, ...cista, upraveno: new Date().toISOString() };
      await store.setJSON(KLIC, nova);
      /* až po uložení — kdyby mazání selhalo, obsah je v pořádku */
      if (cista.fotky) await uklidFotky(store, stara.fotky, cista.fotky);
      return odpoved({ ok: true, upraveno: nova.upraveno });
    } catch (e) {
      return odpoved({ chyba: "Uložení se nepodařilo: " + (e && e.message ? e.message : "neznámá chyba") }, 500);
    }
  }

  return odpoved({ chyba: "Nepodporovaná metoda." }, 405);
};

export const config = {
  path: ["/api/data", "/api/prihlaseni", "/api/fotka", "/api/fotka/:id"]
};

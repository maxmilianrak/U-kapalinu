/* ════════════════════════════════════════════════════════════════════
   API pro obsah webu — Restaurace U Kapalínů

   GET  /api/data        → vrátí uložený obsah (veřejné, bez přihlášení)
   POST /api/prihlaseni  → { heslo } → { token }
   POST /api/data        → uloží obsah (vyžaduje hlavičku Authorization)

   NASTAVENÍ V NETLIFY (Site configuration → Environment variables):
     ADMIN_HESLO   — heslo do administrace, které dostane klient
     ADMIN_TAJNY   — libovolný náhodný řetězec (podepisuje přihlášení)

   Když ADMIN_TAJNY nenastavíte, odvodí se z hesla. Funguje to, ale
   po změně hesla se odhlásí všichni — což je vlastně správně.
   ════════════════════════════════════════════════════════════════════ */

import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const KLIC = "obsah";
const PLATNOST_HODIN = 12;

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

function ocisti(vstup) {
  const d = vstup && typeof vstup === "object" ? vstup : {};
  const out = {};

  if (d.tydenni && typeof d.tydenni === "object") {
    out.tydenni = {
      platnost: text(d.tydenni.platnost, 120),
      poznamka: text(d.tydenni.poznamka, 400),
      dny: (Array.isArray(d.tydenni.dny) ? d.tydenni.dny : []).slice(0, 7).map(x => ({
        den: text(x && x.den, 40),
        polevka: text(x && x.polevka, 200),
        jidla: (Array.isArray(x && x.jidla) ? x.jidla : []).slice(0, 20).map(j => ({
          nazev: text(j && j.nazev, 200),
          popis: text(j && j.popis, 300),
          cena: text(j && j.cena, 20)
        })).filter(j => j.nazev)
      }))
    };
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

  return out;
}

/* ════════════════════════════════════════════════════════════════════ */
export default async (req) => {
  const url = new URL(req.url);
  const cesta = url.pathname.replace(/\/+$/, "");
  const jePrihlaseni = cesta.endsWith("/prihlaseni");

  /* ─── přihlášení ─────────────────────────────────────────────── */
  if (jePrihlaseni) {
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

  /* ─── čtení obsahu ───────────────────────────────────────────── */
  const store = getStore({ name: "ukapalinu", consistency: "strong" });

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
    const hlavicka = req.headers.get("authorization") || "";
    const token = hlavicka.replace(/^Bearer\s+/i, "").trim();

    if (!tokenPlati(token)) {
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
      return odpoved({ ok: true, upraveno: nova.upraveno });
    } catch (e) {
      return odpoved({ chyba: "Uložení se nepodařilo: " + (e && e.message ? e.message : "neznámá chyba") }, 500);
    }
  }

  return odpoved({ chyba: "Nepodporovaná metoda." }, 405);
};

export const config = {
  path: ["/api/data", "/api/prihlaseni"]
};

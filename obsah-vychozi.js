/* ════════════════════════════════════════════════════════════════════
   VÝCHOZÍ OBSAH — Restaurace U Kapalínů

   Tenhle soubor je jediný zdroj výchozích dat. Používá ho:
     • index.html   — když se nepodaří načíst data ze serveru
     • admin.html   — tlačítko „Obnovit výchozí"
     • netlify/functions/data.mjs — první spuštění, než klient něco uloží

   Jakmile klient uloží změny v administraci, tenhle soubor se už
   nepoužívá — data jdou z úložiště. Není potřeba ho upravovat.
   ════════════════════════════════════════════════════════════════════ */

const OBSAH_VYCHOZI = {

  /* ─── TÝDENNÍ MENU ─────────────────────────────────────────────── */
  tydenni: {
    platnost: "",
    poznamka: "Polední menu podáváme v pracovní dny od 11:00 do 14:00.",
    dny: [
      { den: "Pondělí", polevka: "", jidla: [] },
      { den: "Úterý",   polevka: "", jidla: [] },
      { den: "Středa",  polevka: "", jidla: [] },
      { den: "Čtvrtek", polevka: "", jidla: [] },
      { den: "Pátek",   polevka: "", jidla: [] }
    ]
  },

  /* ─── STÁLÝ JÍDELNÍ LÍSTEK ─────────────────────────────────────── */
  /* Přepsáno z tištěného lístku. Ceny ověřte, než web pustíte živě.  */
  stale: {
    poznamka: "Ceny jsou uvedeny v korunách včetně DPH. Informace o alergenech vám rádi sdělíme u obsluhy.",
    kategorie: [
      {
        nazev: "Něco k pivku",
        polozky: [
          { nazev: "Utopenec, pečivo",            popis: "", cena: "45"  },
          { nazev: "Nakládaný hermelín, pečivo",  popis: "", cena: "75"  },
          { nazev: "Tresčí játra",                popis: "", cena: "95"  }
        ]
      },
      {
        nazev: "Minutky z kuřecího masa",
        polozky: [
          { nazev: "150 g Kuřecí steak „Tlapa“",       popis: "tatarka, strouhaný sýr", cena: "135" },
          { nazev: "150 g Kuřecí steak „Dracula“",     popis: "česneková omáčka, strouhaný sýr", cena: "135" },
          { nazev: "150 g Kuřecí steak se šunkou a sýrem", popis: "", cena: "135" },
          { nazev: "150 g Smažený kuřecí řízek",       popis: "", cena: "120" },
          { nazev: "150 g Pikantní kuřecí nudličky",   popis: "česnek, pórek, chilli, kečup, červené víno", cena: "135" },
          { nazev: "150 g Smažená kuřecí kapsa",       popis: "šunka, sýr", cena: "135" },
          { nazev: "350 g Kaplanova miska",            popis: "kuřecí nudličky, pórek, kapie, smetana, kečup, zapečený sýr, brambor", cena: "180" },
          { nazev: "350 g Kuřecí „Gyros“",             popis: "kuřecí nudličky, cibule, gyros koření", cena: "135" }
        ]
      },
      {
        nazev: "Minutky z vepřového masa",
        polozky: [
          { nazev: "150 g Vepřový steak se šunkou a vejci", popis: "", cena: "135" },
          { nazev: "150 g Vepřový steak „Paříž“",      popis: "vepřová pečeně, sázené vejce, hermelín", cena: "135" },
          { nazev: "150 g Smažená krkovička",          popis: "", cena: "120" },
          { nazev: "150 g Dračí dech",                 popis: "ostré vepřové nudličky", cena: "135" },
          { nazev: "150 g Panenské medailonky zapečené nivou", popis: "", cena: "155" },
          { nazev: "150 g Vepřový steak „Kavalerie“",  popis: "vepřová pečeně, hořčice, šunka, sýr, křen", cena: "135" },
          { nazev: "150 g Krkovice na grilu",          popis: "", cena: "135" }
        ]
      },
      {
        nazev: "Speciality kuchyně",
        polozky: [
          { nazev: "200 g Kovářovo kladivo",      popis: "kuřecí, svíčková, vepřové, šunka", cena: "165" },
          { nazev: "200 g Vozová hradba",         popis: "kuřecí řízek, vepřový řízek, smažený sýr", cena: "155" },
          { nazev: "200 g Biftek po židovsku",    popis: "třený česnekem", cena: "360" },
          { nazev: "200 g Biftek na zeleném pepři", popis: "", cena: "360" }
        ]
      },
      {
        nazev: "Saláty",
        polozky: [
          { nazev: "Míchaný salát",  popis: "", cena: "70"  },
          { nazev: "Šopský salát",   popis: "", cena: "85"  },
          { nazev: "Velký zeleninový salát s kuřecími řízečky", popis: "kuřecí maso, dresing", cena: "130" },
          { nazev: "Velký salát „CESAR“", popis: "ledový salát, krutony, kuřecí maso, dresing", cena: "150" }
        ]
      },
      {
        nazev: "Bezmasá jídla",
        polozky: [
          { nazev: "100 g Smažený sýr",      popis: "", cena: "120" },
          { nazev: "100 g Smažený hermelín", popis: "", cena: "130" },
          { nazev: "100 g Smažená niva",     popis: "", cena: "130" },
          { nazev: "150 g Smažený sýrový mix", popis: "eidam, niva, hermelín", cena: "140" }
        ]
      },
      {
        nazev: "Přílohy",
        polozky: [
          { nazev: "150 g Vařené brambory",    popis: "", cena: "30" },
          { nazev: "150 g Opečené brambory",   popis: "", cena: "40" },
          { nazev: "150 g Americké brambory",  popis: "", cena: "40" },
          { nazev: "150 g Hranolky",           popis: "", cena: "40" },
          { nazev: "150 g Krokety",            popis: "", cena: "40" },
          { nazev: "150 g Steakové hranolky",  popis: "", cena: "40" },
          { nazev: "4 ks Bramboráčky",         popis: "", cena: "40" }
        ]
      },
      {
        nazev: "Omáčky",
        polozky: [
          { nazev: "Kečup",            popis: "", cena: "20" },
          { nazev: "Tatarská omáčka",  popis: "", cena: "20" },
          { nazev: "Česneková omáčka", popis: "", cena: "20" }
        ]
      }
    ]
  },

  /* ─── AKCE ─────────────────────────────────────────────────────── */
  akce: {
    prazdnyText: "Momentálně žádné akce nepořádáme. Jakmile budeme něco chystat, najdete to tady.",
    polozky: []
  }
};

/* export pro prohlížeč i pro Node (serverless funkci) */
if (typeof module !== "undefined" && module.exports) module.exports = { OBSAH_VYCHOZI };

# Restaurace U Kapalínů — web + správa obsahu

Web má dvě části:

- **`index.html`** — veřejná stránka. Jeden soubor, otevře se dvojklikem,
  upravuje se ve VS Code.
- **`/admin`** — správa obsahu pro klienta. Mění tři věci: polední menu,
  stálý jídelní lístek a akce. Nic jiného rozbít nemůže.

---

## 0. Než cokoliv uděláte: ZIP rozbalte

Nestačí na archiv dvojklikem a pak otevřít `index.html` uvnitř. Windows
i macOS v takovém případě vytáhnou do dočasné složky **jen ten jeden
soubor** a složka `fotky` zůstane v archivu — web se otevře bez fotek.

Správně: pravým tlačítkem na ZIP → **Extrahovat vše** (macOS: dvojklik
rozbalí celou složku), a teprve pak otevřít `index.html` z rozbalené
složky. Vedle něj musí být složka `fotky` s 25 soubory.

Kdyby se fotky přesto nenačetly, web to sám napíše přímo na místě, kde
měla být fotka, a doplní podrobnost do konzole prohlížeče. Jedno dvě
přerušená stahování (což se při rychlém rolování stává běžně) si přitom
dotáhne potichu sám a nic nehlásí.

---

## 1. Co nasadit a v jakém pořadí

### Krok 1 — nahrát projekt

Netlify Drop (přetažení složky) **nestačí** — kvůli serverless funkci je
potřeba Git. Nahrajte celou složku do repozitáře na GitHubu a v Netlify
zvolte **Add new site → Import an existing project**.

Struktura musí zůstat zachovaná, hlavně tahle cesta:

```
netlify/functions/data.mjs
```

Když se při nahrávání na GitHub rozsype struktura (soubory skončí naplocho),
vytvořte soubor ručně přes **Create new file** a do pole s názvem napište
celou cestu `netlify/functions/data.mjs` — GitHub složky vytvoří sám.

### Krok 2 — nastavit heslo

V Netlify: **Site configuration → Environment variables → Add a variable**

| Název | Hodnota |
|---|---|
| `ADMIN_HESLO` | heslo, které dostane klient |
| `ADMIN_TAJNY` | libovolný náhodný řetězec, aspoň 20 znaků |

Bez `ADMIN_HESLO` se do administrace nedá přihlásit — funkce vrátí hlášku,
že administrace zatím není nastavená.

Po přidání proměnných **spusťte nové nasazení** (Deploys → Trigger deploy),
jinak je funkce neuvidí.

### Krok 3 — vyzkoušet

1. Otevřít `vase-adresa.netlify.app/admin`
2. Přihlásit se heslem
3. Klepnout na **Načíst výchozí lístek** → **Uložit a zveřejnit**
4. Zkontrolovat, že se jídelní lístek objevil na webu

### Krok 4 — doména

Domain settings → Add custom domain → u registrátora přesměrovat DNS.
HTTPS certifikát se vydá sám. Pak v `netlify.toml` odkomentovat
přesměrování na www a v `index.html`, `robots.txt` a `sitemap.xml`
nahradit `https://www.ukapalinu.cz/` finální adresou.

### Krok 5 — po spuštění

- Odeslat `sitemap.xml` v Google Search Console
- Doplnit odkaz na web do profilu na Google Maps a na Facebook

---

## 2. Proč není administrace přes Netlify Identity

Zkoušeli jsme to a nerozchodili — pozvánky chodily jako Team Member,
ověřovací odkazy vracely 404 a přihlašovací okno blokovaly doplňky
v prohlížeči. Netlify Identity je navíc v režimu údržby.

Tahle verze používá **jedno heslo v proměnné prostředí**. Server ho ověří
a vrátí podepsaný token s platností 12 hodin. Žádné pozvánky, žádné
potvrzovací e-maily, žádné okno třetí strany. Pro dva lidi, kteří mění
menu, to stačí a hlavně to funguje.

Heslo se mění přepsáním `ADMIN_HESLO` v Netlify. Po změně se všichni
odhlásí, což je správně.

---

## 3. Jak to funguje uvnitř

```
index.html ──GET──> /api/data ──> Netlify Blobs (úložiště)
admin.html ──POST─> /api/data      (vyžaduje token)
           ──POST─> /api/prihlaseni (heslo → token)
```

Když server neodpoví (třeba při otevření souboru dvojklikem), web si vezme
výchozí obsah ze souboru **`obsah-vychozi.js`** a vypadá normálně. Nikdy
se nestane, že by stránka zůstala prázdná.

`obsah-vychozi.js` je jediné místo, kde je výchozí jídelní lístek. Používá
ho web i administrace. Jakmile klient jednou uloží, čte se všechno
z úložiště a tenhle soubor už se neuplatní.

---

## 4. Co je ve složce

| Soubor | K čemu |
|---|---|
| `index.html` | Veřejný web |
| `admin.html` | Správa obsahu, dostupná na `/admin` |
| `obsah-vychozi.js` | Výchozí jídelní lístek |
| `netlify/functions/data.mjs` | API — čtení, ukládání, přihlášení |
| `netlify.toml` | Nastavení Netlify, hlavičky, přesměrování |
| `package.json` | Jediná závislost: `@netlify/blobs` |
| `404.html` | Stránka pro neexistující adresu |
| `robots.txt`, `sitemap.xml` | Pro Google |
| `fotky/` | Fotky z restaurace, dvě velikosti od každé |

---

## 5. Co ověřit u klienta

Tohle jsem bral z toho, co jste poslal, ale stojí za potvrzení:

- [ ] **IČO 04874986** — veřejné rejstříky (Firmy.cz, Zlaté stránky)
      uvádějí u téhle adresy **62974173**. Použil jsem vaše číslo.
- [ ] **Ceny ve stálém lístku** — přepsané z fotky. Hlavně *Biftek po
      židovsku* a *Biftek na zeleném pepři* za **360 Kč** stojí za kontrolu,
      vyskakují z řady.
- [ ] **Kapacita 40 míst** v lokále — převzato ze starších podkladů,
      ne od klienta.
- [ ] **Které číslo na WhatsApp** — hlavní tlačítka vedou na majitele
      (603 857 142), tlačítko u oslav na provozní (776 224 351).
- [ ] **PSČ** — na webu je jen „Sobín, Praha 17“ bez PSČ, protože
      se zdroje rozcházely.
- [ ] **Rozvoz obědů** — na webu zatím není, starší podklady ho zmiňovaly.
- [ ] **Platba kartou** — na fotce výčepu je terminál, ale na webu to
      netvrdím, dokud to nepotvrdí.

---

## 6. Jak je web postavený

**Stránková mřížka.** Místo jednoho úzkého sloupce uprostřed má stránka
tři pruhy (`.mrizka` v CSS). Obsah sedí ve středním, fotky se roztáhnou
až do kraje obrazovky. Díky tomu po stranách nezbývá prázdné místo ani
na širokém monitoru. Pomocné třídy: `.do-kraje`, `.do-kraje-vpravo`,
`.do-kraje-vlevo`. Není v tom nikde `100vw`, takže se nikdy neobjeví
vodorovný posuvník kvůli šířce lišty.

**Barvy.** Hlavní jsou modrá a zlatá. Červená se objevuje jen
v drobnostech — popisky sekcí, značka „zavřeno", rámeček dnešního dne
v poledním menu. Když budete přidávat prvek, držte se toho.

**Fotky prošly barevnou úpravou.** Vnitřní měly silný žlutý nádech od
zářivek, venkovní byly ploché a domodra. Skript, který to srovnal, je
`uprav-fotky.py` ve složce o úroveň výš (do balíku pro klienta nepatří).
Velké verze mají delší stranu 1400 px, náhledy 720 px, celoplošné pásy
1700 px a fotky v pozadí sekcí jen 1200 px při nízké kvalitě — stejně
jsou vidět přes 13% průhlednost.

---

## 7. Na co si dát pozor při úpravách

**Háčky a písmena pod linkou.** Nadpisy najíždějí zespodu a jsou v obalu
s `overflow:hidden`. Kdyby ten obal neměl místo nahoře i dole, ořízly by se
háčky (ě, š, č) a písmena j, y, g, p. Řeší to `.radek` a `.slovo` v CSS —
odsazení nahoře a dole, vyrušené záporným okrajem, a posun o 145 % místo
100 %. **Když budete přidávat podobnou animaci, zkopírujte tyhle třídy.**

**Tmavé sekce musí mít výslovně nastavenou barvu textu.** Jinak nadpisy
zdědí tmavou barvu z `<body>` a na tmavém pozadí zmizí. Stalo se to při
stavbě dvakrát — u `.akce-karta` (světlá karta v tmavé sekci) a
u `.vybaveni-sekce`. Pokaždé to vypadalo, že se nadpis „nenačetl".

**Pozor na stejné názvy tříd.** Třída `dnes` byla nejdřív na zlatém
pruhu nahoře i na dnešním řádku v otevírací době — řádek pak dostal
zlaté pozadí. Proto se teď jmenuje `hodiny__dnes`.

**Mřížky musí vycházet beze zbytku.** `auto-fit` nechává na posledním
řádku prázdná místa, která vypadají jako chyba. Sekce „Co u nás najdete"
má šest dlaždic a pevně 1/2/3 sloupce, galerie má deset dlaždic (devět
fotek a jednu výzvu) a pevně 1/2/5 sloupců.

**Výkon.** Animační smyčka běží jen při rolování, pak usne. Nevracejte
nekonečné `requestAnimationFrame`. Žádný `blur()` ani `mix-blend-mode`
přes velké plochy — na slabším notebooku to sekne. Druhá a třetí fotka
v úvodu se stahuje až těsně před tím, než se zobrazí, a jen dokud je
úvodní obrazovka vidět. První načtení je kolem 770 kB.

**Hlídání fotek.** Prohlížeč běžně ruší stahování obrázků, kolem kterých
uživatel rychle projede — není to chyba. Funkce `hlidejFotky` to proto
zkouší znovu, a to na pomocném obrázku stranou, aby ten na stránce
neblikal. Hlášku „fotka se nenačetla" ukáže, teprve když naráz selžou
aspoň tři fotky (= chybí složka `fotky`); u jedné dvou to ještě asi minutu
potichu zkouší. **Nedávejte sem nic, co fotku skryje hned po první chybě** —
přesně tím zmizely fotky při rolování na ostré verzi.

**Fotky v galerii** jsou vyjmenované v `index.html` v proměnné `FOTKY`.
Když přidáte desátou, přibude i jedenáctá dlaždice s výzvou — mřížka
by přestala vycházet, takže upravte i počet sloupců.

---

## 8. Údaje klienta

| | |
|---|---|
| Majitel | Jaromír Šťastný |
| Telefon — majitel | +420 603 857 142 |
| Telefon — provozní | +420 776 224 351 |
| E-mail | ukapalinu@seznam.cz |
| Adresa | Hostivická 8/10, Sobín, Praha 17 |
| IČO | 04874986 |
| Otevřeno | po–pá 10:00–22:00, so–ne 10:30–22:00 |
| Pivo | Staropramen |
| Facebook | facebook.com/p/Restaurace-u-Kapalínů-100066951035384 |

Komunikaci preferují přes **WhatsApp**.

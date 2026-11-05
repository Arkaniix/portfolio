// Moteur de la démo Deal Hunter. Code porté du vrai bot (dépôt Arkaniix/deal-hunter), sans changer la logique :
// - normalize, should_exclude et ses filtres, should_reject_vinted_noise, extract_gpu_model, is_recent_gpu,
//   build_model_index, extract_cpu_model, extract_ram_model, extract_ssd_model : matcher.py
// - is_pc_listing : pc_matcher.py
// - market_bias_correction, evaluate_deal, evaluate_ram_deal, evaluate_ssd_deal, match_cpu_to_market,
//   apply_scam_flags : evaluator.py
// - detect_hs : hs_detector.py ; make_fingerprint : fp_dedup.py ; check_price_drop : tracker.py
// - route_deal : notifier.py ; should_user_be_pinged : user_settings.py ; ordre des étapes : main.py (process_ad)
// Hors démo : alimentations et cartes mères (alias du catalogue Videntis), PC complets et lots de composants.
// Seul ajout : chaque étape note ce qu'elle a vu, pour l'affichage.
(function (root) {
  "use strict";

  // ---------- Texte (matcher.py) ----------
  function normalize(text) {
    return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function rx(src, flags) { return new RegExp(src, flags || "i"); }

  // ---------- Exclusions (should_exclude) ----------
  var EXCLUDE_RE = rx("\\b(?:" +
    "lot\\s+de|pack\\b|bundle\\b|x\\s*[2-9]\\b" +
    "|cass[ée]e?|bris[ée]e?|morte?|dead" +
    "|bo[iî]te\\s+vide|bo[iî]te\\s+seule|juste\\s+la\\s+bo[iî]te" +
    "|emballage\\s+seul|emballage\\s+uniquement" +
    "|sans\\s+(?:la\\s+)?carte|carte\\s+non\\s+(?:incluse|fournie)" +
    "|dissipateur|ventirad|ventilateur|cooler\\b|(?:^|\\s)fan\\b|heatsink" +
    "|back\\s*plate|bracket|equerre" +
    "|c[aâ]ble|adaptateur" +
    "|autocollant|sticker|miniature|figurine|maquette|affiche|poster" +
    "|ray\\s*-?\\s*ban|rayban" +
    "|lunettes?|eyeglasses|sunglasses|monture|solaire" +
    "|optique|verres?\\b" +
    ")");
  var EMPTY_BOX_RE = rx("(?:" +
    "carton\\s+(?:vide|seul|seulement|uniquement)|" +
    "(?:bo[iî]te|carton)\\s+pour\\s+collection|" +
    "(?:uniquement|seulement|que)\\s+(?:la\\s+|le\\s+)?(?:bo[iî]te|carton|emballage)|" +
    "(?:vente|vends?)\\s+(?:de\\s+la\\s+|du\\s+|la\\s+)?(?:bo[iî]te|carton|emballage)\\s+(?:vide|seul|seule|uniquement)|" +
    "sans\\s+(?:le\\s+|la\\s+|les\\s+|l['‘’])?" +
    "(?:gpu|cpu|processeur|ssd|nvme|ram|m[ée]moire|alim(?:entation)?|" +
    "carte\\s+m[èe]re|motherboard|composant|produit)\\b|" +
    "empty\\s+box|box\\s+only|packaging\\s+only|carton\\s+only|(?:just|only)\\s+the\\s+box|" +
    "scatola\\s+vuot[oa]|solo\\s+(?:la\\s+)?(?:scatola|imballo|confezione)|(?:imballo|confezione)\\s+vuot[oa]|" +
    "(?:nur|only)\\s+(?:die\\s+)?(?:verpackung|karton|schachtel|originalverpackung)\\b|" +
    "(?:verpackung|karton|schachtel)\\s+(?:leer|nur)\\b|\\bovp\\s+nur\\b|\\bnur\\s+ovp\\b|" +
    "leere?\\s+(?:verpackung|karton|schachtel|box)\\b|" +
    "(?:solo|s[oó]lo)\\s+(?:la\\s+)?(?:caja|embalaje)\\b|caja\\s+vac[ií]a\\b|embalaje\\s+vac[ií]o\\b" +
    ")");
  var BOX_WORD_START_RE = rx("^\\s*(?:scatola|karton|verpackung|schachtel|caja|embalaje|imballo|confezione)\\b");
  var BOX_POSITIVE_CONTEXT_RE = rx("\\b(?:con|mit|avec|with|includes?|inclus[ea]?|fourni[ea]?)\\b");
  function isEmptyBox(t) { return EMPTY_BOX_RE.test(t) || (BOX_WORD_START_RE.test(t) && !BOX_POSITIVE_CONTEXT_RE.test(t)); }

  var LAPTOP_GENERIC_RE = rx("\\b(?:laptop|notebook|pc\\s+portable|ordinateur\\s+portable|tragbar(?:er?)?\\s+(?:pc|computer|rechner)|portatile|port[aá]til)\\b");
  var LAPTOP_SERIES_RE = rx("\\b(?:" +
    "legion|ideapad\\s+gaming|(?:hp\\s+)?omen|victus|nitro|predator|aspire" +
    "|katana|pulse|cyborg|vector|raider|stealth|sword|gf63|gf65|gf75|ge76|gs66" +
    "|zephyrus|rog\\s+strix\\s+g\\d|aorus\\s+\\d|swift\\s+(?:go|x|edge)|alienware\\s+(?:m|x)\\d+" +
    "|xps\\s+\\d{2}|thinkpad|pavilion\\s+gaming" +
    ")\\b");
  var MOBILE_ONLY_GPU_RE = rx("\\brtx\\s*2050\\b");
  function isLaptop(t) { return LAPTOP_GENERIC_RE.test(t) || LAPTOP_SERIES_RE.test(t) || MOBILE_ONLY_GPU_RE.test(t); }

  var EXCHANGE_START_RE = rx("^\\s*(?:[ée]change|troc|cherche\\b.*\\bcontre\\b|recherche\\b.*\\bcontre\\b|exchange|swap|trade|looking\\s+for\\b.*\\bfor\\b|tausch|suche\\b.*\\bgegen\\b|cambio|intercambio|scambio)");
  var EXCHANGE_KEYWORD_RE = rx("\\b(?:[ée]change|troc|swap|tausch|cambio|intercambio|scambio)\\b");
  function isExchange(t, price) { return EXCHANGE_START_RE.test(t) || (price !== null && price !== undefined && price <= 2.0 && EXCHANGE_KEYWORD_RE.test(t)); }

  var ACCESSORY_GADGET_RE = rx("\\b(?:usb\\s+(?:drive|stick|key|cl[ée]|flash)|cl[ée]\\s+usb|clef\\s+usb|capuchon|porte[- ]cl[ée]f?s?|(?:tapis\\s+(?:de\\s+)?souris|mousepad|mouse\\s+pad)|mug|coque|t[- ]?shirt|hoodie)\\b");

  var BOITE_POSITIVE_QUALIFIER_RE = rx("(?:" +
    "bo[iî]te\\s+(?:incluse|fournie|compl[èe]te|livr[ée]e?)|" +
    "bo[iî]te\\s+d['’’]origine\\s+(?:incluse|fournie|compl[èe]te|livr[ée]e?)|" +
    "(?:avec|inclus|incluse|fournie|livr[ée]e?|comprend)\\s+(?:sa\\s+|la\\s+|une\\s+|du\\s+)?bo[iî]te|" +
    "bo[iî]te\\s+(?:intacte|ouverte|scell[ée]e|ferm[ée]e)|" +
    "\\S+\\s+bo[iî]te\\s+d['’’]origine|" +
    "(?:with|includes?)\\s+(?:original\\s+)?box\\b|\\bbox\\s+included\\b|" +
    "con\\s+(?:la\\s+)?scatola\\b|scatola\\s+(?:inclusa|originale)\\s+\\S|" +
    "mit\\s+(?:original)?(?:verpackung|karton|schachtel)\\b|" +
    "con\\s+(?:la\\s+)?caja\\b|caja\\s+incluida\\b" +
    ")");
  var NON_GPU_KEYWORDS_RE = rx("\\b(?:alim|alimentation|psu|ssd|nvme|m\\.2|m2\\b|ram|ddr[345]|barrette|cpu|ryzen|processeur|core\\s+i[3579]|carte\\s+m[èe]re|motherboard|mobo|chipset|watt)\\b");
  var BOITE_RE = rx("\\b(?:bo[iî]te|scatola|karton|verpackung|schachtel|caja|box)\\b");
  var SUPPORT_RE = rx("\\bsupport\\b");
  var GPU_KEYWORD_RE = rx("\\b(?:rtx|gtx|gt\\s*\\d+|rx|geforce|radeon|nvidia|amd|arc\\s+[ab]\\d+)\\b");

  var GPU_MODEL_RE = rx("(?:(?:nvidia|geforce|amd|radeon|intel)\\s+)*(" +
    "(?:rtx|gtx)\\s*\\d{3,4}\\s*(?:ti\\s*super|super|ti)?" +
    "|gt\\s*\\d{3,4}" +
    "|rx\\s*\\d{3,4}\\s*(?:xtx|xt|gre)?" +
    "|(?:rx\\s+)?vega\\s+\\d{2}" +
    "|radeon\\s+vii" +
    "|arc\\s+[ab]\\d{3}" +
    "|t[-\\s]?(?:400|600|1000)" +
    "|titan\\s+rtx" +
    ")(?=[\\s,;/\\)\\]\\-\\.\\!\\?:'\"»’]|$)");
  var FALLBACK_RE = rx("\\b(\\d{4})\\s*(ti\\s+super|super|ti)\\b");
  var GPU_CONTEXT_RE = rx("\\b(?:nvidia|geforce|radeon|amd|gpu|carte\\s+graphique|graphics?\\s*card)\\b");

  function boiteBeforeGpu(t) {
    if (BOITE_POSITIVE_QUALIFIER_RE.test(t)) return false;
    if (NON_GPU_KEYWORDS_RE.test(t)) return false;
    var mb = BOITE_RE.exec(t);
    if (!mb) return false;
    var mg = GPU_KEYWORD_RE.exec(t);
    if (!mg) return true;
    return mb.index < mg.index;
  }

  // Renvoie la règle qui écarte l'annonce et le passage repéré, ou null.
  function shouldExclude(title, price) {
    var t = normalize(title), m;
    if (isEmptyBox(t)) return { why: "boîte vide ou emballage seul", hit: (EMPTY_BOX_RE.exec(t) || [t])[0] };
    if ((m = EXCLUDE_RE.exec(t))) {
      var h = m[0].trim();
      var why = /lot|pack|bundle|x\s*\d/.test(h) ? "lot ou pack" :
        /cass|bris|mort|dead/.test(h) ? "pièce morte, titre trop pauvre pour la réparer" :
        /boite|emballage/.test(h) ? "boîte vide ou emballage seul" :
        /sans|non/.test(h) ? "carte non fournie" :
        /ray|lunette|eyeglass|sunglass|monture|solaire|optique|verre/.test(h) ? "lunettes (« RX » n'est pas une Radeon)" :
        /autocollant|sticker|miniature|figurine|maquette|affiche|poster/.test(h) ? "objet de collection" : "accessoire, pas la pièce";
      return { why: why, hit: h };
    }
    if (boiteBeforeGpu(t)) return { why: "boîte avant le modèle : sans doute l'emballage seul", hit: (BOITE_RE.exec(t) || [""])[0] };
    if (isLaptop(t)) return { why: "PC portable : sa carte n'est pas une carte de bureau", hit: ((LAPTOP_GENERIC_RE.exec(t) || LAPTOP_SERIES_RE.exec(t) || MOBILE_ONLY_GPU_RE.exec(t)) || [""])[0] };
    if (isExchange(t, price)) return { why: "échange, pas une vente", hit: ((EXCHANGE_START_RE.exec(t) || EXCHANGE_KEYWORD_RE.exec(t)) || [""])[0] };
    if ((m = ACCESSORY_GADGET_RE.exec(t))) return { why: "goodies", hit: m[0] };
    if (SUPPORT_RE.test(t) && !GPU_MODEL_RE.test(t)) return { why: "support, sans modèle", hit: "support" };
    return null;
  }

  // ---------- Bruit multilingue de Vinted (should_reject_vinted_noise) ----------
  var DEFECTIVE_MULTILANG_RE = rx("(?:defekt\\b|kaputt\\b|nicht\\s+funktionier|bastler\\b|ersatzteile?\\b|ohne\\s+funktion|funktioniert\\s+nicht|besch[aä]digt" +
    "|per\\s+ricambi|non\\s+funziona\\w*|difettos[oa]|guast[oa]|rott[oa]|dannegiat[oa]" +
    "|para\\s+piezas|no\\s+funciona|defectuos[oa]|averiado|estropead[oa]|da[ñn]ad[oa]" +
    "|kapot\\b|niet\\s+werkend|voor\\s+onderdelen|beschadigd" +
    "|para\\s+pe[çc]as|n[aã]o\\s+funciona|defeituos[oa]|avariado)");
  var BUNDLE_MULTILANG_RE = rx("(?:komplett\\s*(?:pc|rechner|system)|gaming\\s*rechner|zusammenbau|set\\s+aus\\b|paket\\b|\\brechner\\b" +
    "|pc\\s+(?:completo|fisso|assemblato)|computer\\s+(?:fisso|desktop|completo)|configurazione\\b|postazione\\b|lotto\\s+di\\b" +
    "|pc\\s+(?:completo|sobremesa|montado)|ordenador\\s+(?:sobremesa|completo|gaming)|torre\\s+(?:gaming|completa)|configuraci[oó]n\\b|lote\\s+de\\b" +
    "|complete?\\s*(?:pc|computer)\\s+met\\b|complete?\\s*gaming\\s*pc\\s+met\\b|samenstel|pakket\\b" +
    "|computador\\s+(?:completo|desktop)|configura[çc][aã]o\\b)");
  var ACCESSORY_MULTILANG_RE = rx("(?:\\bdisipador\\b|\\bventilador\\b|\\brefrigeraci[oó]n\\b|\\bpieza\\s+de\\s+repuesto|\\bcubierta\\b|\\btorniller[ií]a\\b" +
    "|\\bbloque\\s+de\\s+agua\\b|\\bpasta\\s+t[eé]rmica\\b" +
    "|\\bk[uü]hler\\b|\\bl[uü]fter\\b|\\bersatzteil\\b|\\babdeckung\\b|\\bwasserblock\\b|\\bw[aä]rmeleitpaste\\b" +
    "|\\bdissipatore\\b|\\bventola\\b|\\bricambio\\b|\\bcopertura\\b|\\bblocco\\s+(?:ad\\s+)?acqua\\b|\\bpasta\\s+termica\\b" +
    "|\\bkoeler\\b|\\bvervangonderdeel\\b|\\bwaterblok\\b|\\bkoelpasta\\b" +
    "|\\bdissipador\\b|\\bventoinha\\b|\\bbloco\\s+de\\s+[aá]gua\\b|\\bpasta\\s+t[eé]rmica\\b" +
    "|\\bventirad\\b|\\bwaterblock\\b|\\bbloc\\s+eau\\b|\\bp[aâ]te\\s+thermique\\b" +
    "|\\bheat\\s*sink\\b|\\bshroud\\b|\\bfan\\s+only\\b|\\bbackplate\\s+only\\b" +
    "|\\breplacement\\s+(?:part|fan|cooler|shroud)|\\bspare\\s+part|\\bwater\\s*block\\b|\\bthermal\\s+(?:paste|compound|pad)\\b)");
  var NON_HARDWARE_RE = rx("(?:\\b(?:taille|gr[oö][sß]e|taglia|talla)\\s*[XSML]{1,3}\\b|\\b(?:kleid|vestito|vestido|jurk)\\b|\\b(?:hemd|camicia|camisa|overhemd)\\b" +
    "|\\b(?:schuh|scarpa|zapato|schoen)\\b|\\b(?:tasche|borsa|bolso)\\b|\\bparfum\\b|\\beau\\s+de\\s+(?:toilette|parfum)\\b|\\bduft\\b|\\bprofumo\\b)");
  var FR_EN_INDICATOR_RE = rx("\\b(?:carte|graphique|processeur|m[eé]moire|alimentation|alim\\b|occasion|comme\\s+neu[fv]|vendu?|avec|sans|facture|[eé]tat|neuf" +
    "|envoi|livraison|garantie|gaming|used|brand\\s+new|like\\s+new|boxed|working|great\\s+condition|shipping|free|sealed|mint|warranty)\\b");
  var FOREIGN_INDICATOR_RE = rx("(?:\\b(?:sehr|zustand|gebraucht|versand|wie\\s+neu|ovp|einwandfrei|grafikkarte|netzteil)\\b" +
    "|\\b(?:come\\s+nuovo|usato|ottimo|spedizione|stato|scheda\\s+video|alimentatore)\\b" +
    "|\\b(?:como\\s+nuevo|usado|buen\\s+estado|env[ií]o|tarjeta\\s+gr[aá]fica|fuente)\\b" +
    "|\\b(?:zeer\\s+goed|gebruikt|verzending|videokaart|voeding)\\b" +
    "|\\b(?:como\\s+novo|usado|bom\\s+estado|envio|placa\\s+de\\s+v[ií]deo)\\b)");
  var PHOTO_SCAM_RE = rx("(?:\\bfoto\\s+(?:von|de|di|of|van)\\b|\\bbild\\s+von\\b|\\bimmagine\\s+di\\b|\\bfoto\\s+da\\b|\\bfoto\\s+van\\b" +
    "|\\bnur\\s+(?:ein\\s+)?(?:foto|bild)\\b|\\bsolo\\s+(?:una?\\s+)?foto\\b|\\bseulement\\s+(?:une?\\s+)?photo\\b|\\balleen\\s+(?:een\\s+)?foto\\b|\\bjust\\s+a\\s+(?:photo|picture)\\b" +
    "|\\bkein(?:e)?\\s+(?:hardware|grafikkarte|karte)\\b|\\bkein\\s+verkauf\\b|\\bnicht\\s+(?:die|das|der)\\s+(?:karte|hardware)\\b" +
    "|\\bphoto\\s+imprim[eé]e?\\b|\\bfoto\\s+stampata\\b|\\bfoto\\s+(?:impresa|imprimida)\\b|\\bgedrucktes?\\s+(?:foto|bild)\\b|\\bprinted\\s+(?:photo|picture|image)\\b)");

  function vintedNoise(title) {
    var t = normalize(title), m;
    if ((m = ACCESSORY_MULTILANG_RE.exec(t))) return { why: "pièce détachée, pas la carte", hit: m[0] };
    if ((m = DEFECTIVE_MULTILANG_RE.exec(t))) return { why: "en panne, dans une autre langue", hit: m[0] };
    if ((m = BUNDLE_MULTILANG_RE.exec(t))) return { why: "PC complet ou lot, dans une autre langue", hit: m[0] };
    if ((m = NON_HARDWARE_RE.exec(t))) return { why: "pas du matériel informatique", hit: m[0] };
    if (!FR_EN_INDICATOR_RE.test(t) && (m = FOREIGN_INDICATOR_RE.exec(t))) return { why: "titre en langue étrangère", hit: m[0] };
    if ((m = PHOTO_SCAM_RE.exec(t))) return { why: "vend une photo de la carte", hit: m[0] };
    return null;
  }

  // ---------- Modèle de carte graphique ----------
  function normalizeCore(s) {
    s = s.toLowerCase().trim();
    s = s.replace(/([a-z])(\d)/g, "$1 $2").replace(/(\d)([a-z])/g, "$1 $2").replace(/(\w)-(\w)/g, "$1 $2").replace(/(ti)(super)/g, "$1 $2");
    return s.replace(/\s+/g, " ").trim();
  }
  function extractGpuModel(title) {
    var t = normalize(title), m = GPU_MODEL_RE.exec(t);
    if (m) {
      var core = m[1].toLowerCase();
      if (core.indexOf("rx") === 0 && /(?:\bray\b|rayban)/.test(t)) return null;
      return normalizeCore(m[1]);
    }
    if (GPU_CONTEXT_RE.test(t)) {
      m = FALLBACK_RE.exec(t);
      if (m) {
        var num = m[1], suffix = normalizeCore(m[2]), d = num[0], prefix;
        if ("2345".indexOf(d) !== -1) prefix = "rtx"; else if (d === "1") prefix = "gtx"; else return null;
        return normalizeCore(prefix + " " + num + " " + suffix);
      }
    }
    return null;
  }
  function isRecentGpu(extracted) {
    var s = extracted.toLowerCase().trim(), m;
    if (s.indexOf("arc ") === 0) return true;
    if (s === "titan rtx") return true;
    if ((m = /^(?:rtx|gtx|gt)\s+(\d{3,4})/.exec(s))) return s.indexOf("rtx") === 0 && +m[1] >= 2000;
    if ((m = /^rx\s+(\d{3,4})/.exec(s))) return +m[1] >= 5000;
    return false;
  }
  function buildModelIndex(models) {
    var index = {};
    models.forEach(function (mo) { var c = extractGpuModel(mo.name); if (c && !(c in index)) index[c] = mo; });
    return index;
  }

  // ---------- Processeur ----------
  var INTEL_CPU_RE = /\b(?:core\s+)?i([3579])\s*-?\s*(\d{4,5})([a-z]{0,3})\b/;
  var INTEL_BARE_RE = /\bintel\s+(\d{4,5})([a-z]{0,3})\b/;
  var AMD_CPU_RE = /\bryzen\s*([3579])\s+(\d{4})([a-z0-9]{0,4})\b/;
  function recentIntel(n) { return (n.length === 5 && +n >= 10000) || (n.length === 4 && +n >= 8000); }
  function extractCpuModel(title) {
    var t = normalize(title), m;
    if ((m = INTEL_CPU_RE.exec(t)) && recentIntel(m[2])) return "i" + m[1] + " " + m[2] + m[3];
    if ((m = INTEL_BARE_RE.exec(t)) && recentIntel(m[1])) return "intel " + m[1] + m[2];
    if ((m = AMD_CPU_RE.exec(t)) && +m[2] >= 3000) return "ryzen " + m[1] + " " + m[2] + m[3];
    return null;
  }
  function matchCpuToMarket(extracted, cpuPrices) {
    if (!extracted || !cpuPrices) return null;
    var m = /(\d{4,5}[a-z0-9]{0,4})\b/.exec(extracted);
    if (!m) return null;
    var p = new RegExp("\\b" + m[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
    var keys = Object.keys(cpuPrices);
    for (var i = 0; i < keys.length; i++) if (p.test(keys[i].replace(/-/g, " "))) return { id: cpuPrices[keys[i]].model_id, name: cpuPrices[keys[i]].name || keys[i] };
    return null;
  }

  // ---------- Mémoire ----------
  var RAM_BRAND_RE = /\b(?:corsair|kingston|crucial|gskill|g\.skill|hyperx|vengeance|trident|fury|ballistix)\b/i;
  var RAM_DDR_RE = /\b(ddr[45])\b/i, RAM_CAPACITY_RE = /(\d+)\s*(?:go|gb)\b/i, RAM_KIT_RE = /(\d)\s*x\s*(\d+)\s*(?:go|gb)?\b/i;
  var RAM_SPEED_RE = /(\d{4,5})\s*(?:mhz|mt\/?s)\b/i, RAM_EXCLUDE_RE = /\b(?:sodimm|so-dimm|pour\s+pc\s+portable|laptop|ecc|registered|rdimm|serveur)\b/i;
  var VALID_RAM_GB = [8, 16, 32, 64, 128];
  function extractRamModel(title) {
    var t = normalize(title);
    if (RAM_EXCLUDE_RE.test(t)) return null;
    var ddrM = RAM_DDR_RE.exec(t), brandM = RAM_BRAND_RE.exec(t);
    if (!ddrM && !brandM) return null;
    var ddr = ddrM ? ddrM[1].toLowerCase() : "ddr4", cap, kit, km = RAM_KIT_RE.exec(t);
    if (km) { cap = +km[1] * +km[2]; kit = true; }
    else { var cm = RAM_CAPACITY_RE.exec(t); if (!cm) return null; cap = +cm[1]; kit = false; }
    if (VALID_RAM_GB.indexOf(cap) === -1) return null;
    var sm = RAM_SPEED_RE.exec(t), speed = sm ? +sm[1] : null;
    var label = [ddr.toUpperCase(), cap + "Go"].concat(speed ? [speed + "MHz"] : []).concat(kit ? ["(kit)"] : []).join(" ");
    return { type: "ram", capacity_gb: cap, ddr: ddr, speed_mhz: speed, kit: kit, label: label };
  }

  // ---------- SSD ----------
  var SSD_KEYWORD_RE = /\b(?:ssd|nvme|m\.2|m2)\b/i;
  var SSD_BRAND_RE = /\b(?:samsung|crucial|wd|western\s+digital|kingston|sandisk|seagate|sabrent|corsair\s+mp|silicon\s+power|pny|transcend|lexar)\b/i;
  var SSD_EXCLUDE_RE = /\b(?:disque\s+dur|hdd|nas|externe|portable)\b/i;
  var SSD_EXTERNAL_LANG_RE = /\b(?:ssd\s+(?:externe|portable|nomade)|disque\s+(?:externe|portable|nomade)|(?:external|portable)\s+ssd|enclosure|bo[îi]tier)\b/i;
  var SSD_EXTERNAL_BRAND_RE = /\b(samsung\s+t[579](?:\s+shield)?|samsung\s+x5|crucial\s+x[689]\b|crucial\s+x10\b|sandisk\s+extreme\s+(?:pro\s+)?portable|wd\s+(?:my\s+passport\s+ssd|elements\s+se)|seagate\s+(?:one\s+touch|fast)\s+ssd|lexar\s+sl[256]00|kingston\s+xs[12]000)\b/i;
  var VALID_SSD_GB = [120, 128, 240, 250, 256, 480, 500, 512, 960, 1000, 2000, 4000];
  function extractSsdModel(title) {
    var t = normalize(title);
    if (SSD_EXCLUDE_RE.test(t) || SSD_EXTERNAL_LANG_RE.test(t) || SSD_EXTERNAL_BRAND_RE.test(t)) return null;
    if (!SSD_KEYWORD_RE.test(t) && !SSD_BRAND_RE.test(t)) return null;
    var cap = null, tb = /(\d+)\s*(?:to|tb)\b/i.exec(t);
    if (tb) cap = +tb[1] * 1000;
    if (cap === null) { var gb = /(\d+)\s*(?:go|gb)\b/i.exec(t); if (gb) cap = +gb[1]; }
    if (cap === null) return null;
    var best = VALID_SSD_GB.reduce(function (a, v) { return Math.abs(v - cap) < Math.abs(a - cap) ? v : a; });
    if (Math.abs(best - cap) > best * 0.10) return null;
    cap = best;
    var im = /\b(nvme|sata|m\.?2|2\.5)\b/i.exec(t), iface = null;
    if (im) { var raw = im[1].toLowerCase().replace(".", ""); iface = raw === "nvme" ? "nvme" : (raw === "sata" || raw === "25") ? "sata" : raw === "m2" ? "m2" : null; }
    var label = ["SSD"].concat(iface ? [iface.toUpperCase()] : []).concat([cap >= 1000 ? (cap / 1000) + "To" : cap + "Go"]).join(" ");
    return { type: "ssd", capacity_gb: cap, interface: iface, label: label };
  }

  // ---------- PC complet (pc_matcher.py) ----------
  var PC_POSITIVE_RE = /\b(?:pc\s+gam(?:ing|er)|pc\s+fixe|pc\s+bureau|ordinateur|tour\s+gam(?:ing|er)|tour\s+pc|tour\s+informatique|config(?:uration)?\s+gam(?:ing|er)|configuration|unite\s+centrale|uc\s+gaming)\b/;
  var PC_WEAK_RE = /\b(?:desktop|setup)\b/, PC_HARD_EXCLUDE_RE = /\b(?:portable|laptop|notebook|tout\s+en\s+un|all\s+in\s+one|aio|composants?|pieces?\s+detachees?|pieces?\s+seules?)\b/;
  var PC_PERIPHERAL_RE = /\b(?:ecran|moniteur|clavier|souris|casque)\b/;
  function isPcListing(title) {
    var t = normalize(title);
    if (PC_HARD_EXCLUDE_RE.test(t)) return false;
    var strong = PC_POSITIVE_RE.test(t);
    if (!strong && PC_PERIPHERAL_RE.test(t)) return false;
    if (strong) return true;
    return PC_WEAK_RE.test(t) && !!(extractGpuModel(t) || extractCpuModel(t));
  }

  // ---------- Revente et profit (evaluator.py) ----------
  function round2(x) { return Math.round(x * 100) / 100; }
  function marketBiasCorrection(median, newPrice) {
    var c = median >= 300 ? median * 0.85 : median >= 150 ? median * 0.80 : median * 0.75;
    if (newPrice && newPrice > 0) c = Math.min(c, newPrice * 0.90);
    return round2(c);
  }
  var RESALE_FEES = { lbc: 0.0, vinted: 0.05, ebay: 0.13 };
  var SHIPPING_COST_EUR = 8.0, SMALL_SHIPPING_EUR = 4.0;
  function verdictOf(p) {
    if (p === null) return { v: "PAS DE RÉFÉRENCE", k: "none" };
    if (p >= 100) return { v: "ÉNORME DEAL", k: "huge" };
    if (p >= 80) return { v: "TRÈS BON DEAL", k: "vgood" };
    if (p >= 50) return { v: "BON PRIX", k: "good" };
    if (p >= 20) return { v: "PRIX CORRECT", k: "ok" };
    return { v: "PAS RENTABLE", k: "bad" };
  }
  function profitsFor(resale, price, shipping) {
    var profits = {}, best = null;
    Object.keys(RESALE_FEES).forEach(function (ch) {
      var fee = RESALE_FEES[ch], ship = ch === "lbc" ? 0 : shipping;
      profits[ch] = { gross: resale, fee: fee, feeEur: round2(resale * fee), ship: ship, profit: round2(resale * (1 - fee) - price - ship) };
      if (!best || profits[ch].profit > profits[best].profit) best = ch;
    });
    return { profits: profits, best: best, bestProfit: profits[best].profit };
  }
  function evaluateDeal(ad, marketPrices, matched) {
    var price = ad.total_cost_eur || ad.price_eur, stats = matched ? marketPrices[matched.name.toLowerCase().trim()] : null;
    var median = stats ? stats.median_price : null, composite = stats ? stats.composite_price : null, ref = composite || median;
    var sample = stats ? stats.sample_size : 0, newP = stats ? stats.new_price_eur : null;
    var ev = { ad: ad, matched_model: matched, market_median: ref, observation_count: sample, new_price_eur: newP,
      confidence: sample >= 10 ? "high" : sample >= 5 ? "medium" : sample >= 1 ? "low" : "unknown",
      realistic_sell_price: null, profits_by_channel: {}, best_channel: null, best_profit: null, tier: null };
    if (ref && ref > 0) {
      var rs = marketBiasCorrection(ref, newP);
      if (newP && newP > 0) rs = Math.min(rs, newP * 0.90);
      rs = round2(rs);
      ev.realistic_sell_price = rs;
      ev.tier = ref >= 300 ? 0.85 : ref >= 150 ? 0.80 : 0.75;
      ev.capped = !!(newP && newP * 0.90 < ref * ev.tier);
      var p = profitsFor(rs, price, SHIPPING_COST_EUR);
      ev.profits_by_channel = p.profits; ev.best_channel = p.best; ev.best_profit = p.bestProfit;
    }
    ev.verdict = verdictOf(ev.best_profit);
    return ev;
  }
  // Mémoire et SSD : sans prix en base, le bot prend ses estimations fixes (tables du code).
  var RAM_RESALE_ESTIMATES = { ddr3: { 4: 8, 8: 12, 16: 25 }, ddr4: { 8: 15, 16: 55, 32: 95, 64: 150 }, ddr5: { 8: 30, 16: 70, 32: 160, 64: 280, 128: 450 } };
  var SSD_RESALE_ESTIMATES = { 256: 12, 500: 20, 512: 20, 1000: 35, 2000: 60, 4000: 110 };
  function evaluateSmall(ad, resale, label, kind) {
    var price = ad.total_cost_eur || ad.price_eur, p = profitsFor(resale, price, SMALL_SHIPPING_EUR);
    var ev = { ad: ad, matched_model: { name: label }, market_median: resale, realistic_sell_price: resale, observation_count: 0, confidence: "low",
      profits_by_channel: p.profits, best_channel: p.best, best_profit: p.bestProfit, staticEstimate: true };
    ev["is_" + kind] = true;
    ev.verdict = verdictOf(ev.best_profit);
    return ev;
  }
  function evaluateRam(ad, info) {
    var r = (RAM_RESALE_ESTIMATES[info.ddr] || {})[info.capacity_gb];
    return evaluateSmall(ad, r === undefined ? 15 : r, info.label, "ram");
  }
  function evaluateSsd(ad, info) {
    var keys = Object.keys(SSD_RESALE_ESTIMATES).map(Number), cap = info.capacity_gb;
    var closest = keys.reduce(function (a, k) { return Math.abs(k - cap) < Math.abs(a - cap) ? k : a; });
    return evaluateSmall(ad, SSD_RESALE_ESTIMATES[closest], info.label, "ssd");
  }

  // ---------- Arnaque (apply_scam_flags) ----------
  var FOREIGN_MARKERS = ["verkaufe", "gebraucht", "zustand", "versand", "preis", "funktioniert", "keine", "sehr", "gut", "biete", "nur", "mit", "hallo", "zusammen", "wegen", "eines",
    "vendo", "usato", "spedizione", "prezzo", "funziona", "ottime", "condizioni", "pari", "nuovo",
    "usado", "envío", "precio", "funciona", "buen", "estado", "venta", "vendido",
    "verkoop", "gebruikt", "verzending", "werkt", "sprzedam", "używany", "wysyłka", "cena", "działa",
    "vand", "folosit", "livrare", "pret", "functioneaza"];
  var FOREIGN_CHARS = "äöüßñćąęśźżã";
  var FRENCH_MARKERS = ["vends", "vend", "vente", "état", "etat", "envoi", "livraison", "fonctionne", "occasion", "neuf", "très", "bon", "prix", "déstockage", "urgent", "cause"];
  function isForeignLanguage(text) {
    if (!text) return false;
    var tl = text.toLowerCase(), words = {}, hits = 0, french = false;
    tl.replace(/[^a-z0-9àáâäæçèéêëìíîïñòóôœùúûüýÿ]/g, " ").split(/\s+/).forEach(function (w) { if (w) words[w] = 1; });
    Object.keys(words).forEach(function (w) { if (FOREIGN_MARKERS.indexOf(w) !== -1) hits++; if (FRENCH_MARKERS.indexOf(w) !== -1) french = true; });
    var chars = FOREIGN_CHARS.split("").some(function (c) { return tl.indexOf(c) !== -1; });
    return !french && (hits >= 2 || (hits >= 1 && chars));
  }
  function applyScamFlags(ev) {
    var ad = ev.ad, price = ad.total_cost_eur || ad.price_eur || 0, resale = ev.realistic_sell_price || 0;
    ev.scam_flags = []; ev.is_scam_suspect = false;
    if (resale < 100) { ev.scam_skip = true; return ev; }
    var hard = 0.35, soft = 0.50, level = null;
    if (price > 0 && resale > 0) {
      var r = price / resale;
      ev.ratio = r;
      if (r < hard) { ev.scam_flags.push("Prix à " + fmtRatio(r) + " de la revente (sous 0,35)"); level = "hard"; }
      else if (r <= soft) { ev.scam_flags.push("Prix à " + fmtRatio(r) + " de la revente (0,50 ou moins)"); level = "soft"; }
    }
    if (isForeignLanguage((ad.title || "") + " " + (ad.description || ""))) ev.scam_flags.push("Annonce en langue étrangère");
    if (ad.platform === "vinted" && resale >= 600) ev.scam_flags.push("Vinted et composant de " + Math.round(resale) + " € à la revente (600 € ou plus)");
    var others = ev.scam_flags.filter(function (f) { return f.indexOf("Prix à") !== 0; }).length;
    ev.is_scam_suspect = level === "hard" || level === "soft" || others >= 2;
    return ev;
  }
  function fmtRatio(r) { return r.toFixed(2).replace(".", ","); }

  // ---------- Pour pièces (hs_detector.py) ----------
  var HS_RE = rx("(?:^|[\\s,;.\\(\\[])hs(?:[\\s,;.\\)\\]]|$)|en\\s+panne|d[ée]fectueu(?:se|x)|ne\\s+(?:fonctionne|d[ée]marre|s['‘’]allume)\\s+plus|[àa]\\s+r[ée]parer|pour\\s+pi[eè]ces?|[ée]cran\\s+noir|art[ée]facts?|(?:^|[\\s,;.])ko(?:[\\s,;.]|$)" +
    "|\\bbroken\\b|\\bfaulty\\b|\\bdefective\\b|\\bfor\\s+parts\\b|\\bnot\\s+working\\b|\\bdoesn['‘’]t\\s+(?:work|boot|post)\\b|\\bDOA\\b", "gi");
  var NEG_PATTERNS = [/sans\s+panne/i, /aucun(?:e)?\s+panne/i, /aucun(?:e)?\s+d[ée]fectueu/i, /aucun(?:e)?\s+d[ée]faut/i, /pas\s+de\s+(?:panne|d[ée]faut)/i, /sans\s+d[ée]faut/i, /no\s+defect/i, /works?\s+(?:fine|perfectly)/i];
  var WEAK_KW_RE = /art[ée]facts?|artefactos|artefakte|artefatti|(?:^|[\s,;.\(\[])hs(?:[\s,;.\)\]]|$)|(?:^|[\s,;.])ko(?:[\s,;.]|$)|en\s+panne|d[ée]fectueu(?:se|x)/i;
  var NEG_TOKEN_RE = /(?:\b(?:aucune?|sans|pas|ni|jamais|z[ée]ro|non|sin|ning[uú]n[ao]?|no|without|never|zero|ohne|keine?|nie|null|senza|nessun[ao]?|n[ée])\b|(?:^|[\s,;])0(?=\s))/i;
  var VETO_PATTERNS = [/\bhooded\b|\bregenjacke\b|\bhardshell\b|\bjacket\b|\bjacke\b|\bdamen\b|\bveste\b/i, /\b(?:typing\s+of\s+the|of\s+the|day\s+of\s+the)\s+dead\b/i, /\bhouse\s+of\s+the\s+dead\b/i, /\bradio\s+cassette\b/i];
  function hsMatches(text) {
    var out = [], m;
    if (!text) return out;
    HS_RE.lastIndex = 0;
    while ((m = HS_RE.exec(text))) {
      var ws = Math.max(0, m.index - 30), win = text.slice(ws, m.index + m[0].length + 30);
      var neg = NEG_PATTERNS.some(function (p) { return p.test(win); });
      if (!neg && WEAK_KW_RE.test(m[0]) && NEG_TOKEN_RE.test(text.slice(Math.max(0, m.index - 40), m.index))) neg = true;
      var kw = m[0].replace(/^[\s,;.()\[\]]+|[\s,;.()\[\]]+$/g, "").toLowerCase();
      if (!neg && kw) out.push(kw);
      if (m[0].length === 0) HS_RE.lastIndex++;
    }
    return out;
  }
  function detectHs(title, description, lbcCondition, price, marketRef) {
    title = title || ""; description = description || "";
    var veto = VETO_PATTERNS.filter(function (p) { return p.test(title) || p.test(description); })[0];
    if (veto) return { is_hs: false, signals: [], confidence: 0, price_anomaly: false, veto: (veto.exec(title) || veto.exec(description) || [""])[0] };
    var signals = [], cond = typeof lbcCondition === "string" && lbcCondition.trim().toLowerCase() === "pourpieces";
    if (cond) signals.push("état « pour pièces » sur Leboncoin");
    var tk = hsMatches(title), dk = hsMatches(description), seen = {};
    tk.concat(dk).forEach(function (k) { if (!seen[k] && signals.length < 6) { seen[k] = 1; signals.push("« " + k + " »"); } });
    var isHs = cond || tk.length > 0 || dk.length > 0, anomaly = false;
    if (isHs && price !== null && marketRef && marketRef > 0 && price < 0.40 * marketRef) { anomaly = true; signals.push("prix sous 40 % de la revente"); }
    var conf = 0;
    if (isHs) {
      conf = cond && (tk.length || dk.length) ? 0.80 : cond ? 0.70 : 0.60;
      if (Object.keys(seen).length >= 2) conf = Math.min(1, conf + 0.10);
      if (anomaly) conf = Math.min(1, conf + 0.15);
    }
    return { is_hs: isHs, signals: signals, confidence: Math.round(conf * 100) / 100, price_anomaly: anomaly };
  }

  // ---------- Doublons et baisses (fp_dedup.py, tracker.py) ----------
  function makeFingerprint(platform, title, price) {
    return platform + "|" + String(title || "").toLowerCase().replace(/[^a-z0-9]/g, "") + "|" + Math.round((price || 0) / 5) * 5;
  }

  // ---------- Salon et mentions (notifier.py, user_settings.py) ----------
  var CHANNELS = {
    deals_fire: "bonnes-affaires", deals_price_drop: "baisses-de-prix", deals_hs: "pour-pieces",
    deals_suspect: "suspectes", deals_not_rentable: "pas-rentables", deals_other: "autres"
  };
  function routeDeal(ev, settings) {
    if (ev.is_hs) return "deals_hs";
    if (ev.is_scam_suspect) return "deals_suspect";
    if (ev.price_drop) return "deals_price_drop";
    var fire = ev.fire_threshold || settings.min_profit_fire;
    if (ev.best_profit !== null && ev.best_profit >= fire) return "deals_fire";
    if (ev.best_profit !== null && ev.best_profit < 0) return "deals_not_rentable";
    return "deals_other";
  }
  function category(ev) { return ev.is_ram ? "ram" : ev.is_ssd ? "ssd" : ev.is_cpu ? "cpu" : ev.is_gpu ? "gpu" : null; }
  // Renvoie la raison du refus, ou null si la personne est mentionnée.
  function pingRefusal(s, ev, channel) {
    if (!s.channels_to_ping[channel]) return "ce salon n'est pas dans sa liste";
    var platform = ev.ad.platform === "leboncoin" ? "lbc" : ev.ad.platform;
    if (!s.platforms[platform]) return "elle ne suit pas " + (platform === "lbc" ? "Leboncoin" : "Vinted");
    var cat = category(ev);
    if (!cat || !s.categories[cat]) return "elle ne suit pas cette famille";
    if ((ev.ad.price_eur || 0) > s.max_price_perso) return "prix au-dessus de son maximum (" + s.max_price_perso + " €)";
    if (ev.best_profit === null || ev.best_profit < s.min_profit_to_ping) return "profit sous son seuil (" + s.min_profit_to_ping + " €)";
    return null;
  }
  function mentions(users, ev, channel) {
    return users.map(function (s) {
      var refusal = pingRefusal(s, ev, channel), pinged = false, why = refusal;
      if (!refusal) {
        if (s.presence === "ON") pinged = true;
        else if (s.notify_when_offline) pinged = true;
        else why = "présence OFF";
      }
      return { name: s.username, pinged: pinged, why: why };
    });
  }

  // ---------- Parcours complet d'une annonce (main.py, process_ad puis _enrich_and_notify) ----------
  // state : { seen: {ad_id: dernier prix}, sent: {empreinte: 1} }, conservé d'une annonce à l'autre.
  function processAd(ad, data, state, settings, users) {
    var steps = [], title = ad.title;
    function stop(code, note) { return { ad: ad, steps: steps, stop: code, note: note || null }; }
    // 1. Écartée d'office ?
    if (ad.price_eur > settings.max_price) { steps.push({ k: "exclude", ok: false, why: "au-dessus du prix maximum (" + settings.max_price + " €)" }); return stop("price"); }
    var ex = shouldExclude(title, ad.price_eur);
    if (ex) { steps.push({ k: "exclude", ok: false, why: ex.why, hit: ex.hit }); return stop("excluded"); }
    if (ad.platform === "vinted") {
      var vn = vintedNoise(title);
      if (vn) { steps.push({ k: "exclude", ok: false, why: vn.why, hit: vn.hit, vinted: true }); return stop("excluded"); }
    }
    steps.push({ k: "exclude", ok: true });

    // 2. Quel modèle ?
    var ev = null, model = null, gpu = extractGpuModel(title), oldGpu = null, family = null;
    if (gpu) {
      if (isRecentGpu(gpu)) {
        var matched = data.index[gpu] || null;
        model = { family: "Carte graphique", token: gpu, name: matched ? matched.name : null };
        ev = evaluateDeal(ad, data.market, matched); ev.is_gpu = true; family = "gpu";
      } else oldGpu = gpu;
    }
    if (!ev) {
      var cpu = extractCpuModel(title);
      if (cpu) {
        var mc = matchCpuToMarket(cpu, data.cpu);
        if (mc) { model = { family: "Processeur", token: cpu, name: mc.name }; ev = evaluateDeal(ad, data.cpu, mc); ev.is_cpu = true; family = "cpu"; }
      }
    }
    if (!ev) {
      var ram = extractRamModel(title);
      if (ram && !isPcListing(title)) { model = { family: "Mémoire", token: ram.label, name: ram.label }; ev = evaluateRam(ad, ram); family = "ram"; }
    }
    if (!ev) {
      var ssd = extractSsdModel(title);
      if (ssd && !isPcListing(title)) { model = { family: "SSD", token: ssd.label, name: ssd.label }; ev = evaluateSsd(ad, ssd); family = "ssd"; }
    }
    if (!ev) {
      if (isPcListing(title)) { steps.push({ k: "model", ok: false, why: "PC complet : le bot l'estime pièce par pièce, hors de cette démo" }); return stop("pc"); }
      if (oldGpu) { steps.push({ k: "model", ok: false, token: oldGpu, why: "génération trop ancienne (RTX 20, RX 5000, Arc et plus récentes seulement)" }); return stop("old"); }
      steps.push({ k: "model", ok: false, why: "aucun modèle reconnu (la démo couvre cartes graphiques, processeurs, mémoire et SSD)" });
      return stop("nomatch");
    }
    steps.push({ k: "model", ok: true, family: model.family, token: model.token, name: model.name });

    // 3. Déjà vue ?
    var prev = state.seen[ad.ad_id];
    if (prev !== undefined) {
      var drop = prev > 0 ? (prev - ad.price_eur) / prev * 100 : 0;
      if (drop < 5) { steps.push({ k: "seen", ok: false, why: "déjà vue à " + prev + " €, rien de neuf", prev: prev }); return stop("seen"); }
      ev.price_drop = { old_price: prev, new_price: ad.price_eur, drop_pct: Math.round(drop * 10) / 10 };
      state.seen[ad.ad_id] = ad.price_eur;
    } else if (family === "ram" || family === "ssd") {
      if (ev.best_profit < -10) {
        steps.push({ k: "seen", ok: true, first: true });
        steps.push({ k: "profit", ev: ev });
        steps.push({ k: "risk", skipped: true });
        steps.push({ k: "route", ok: false, why: "perte de plus de 10 € : la mémoire et les SSD ne sont même pas postés" });
        return stop("lowprofit");
      }
      state.seen[ad.ad_id] = ad.price_eur;
    } else state.seen[ad.ad_id] = ad.price_eur;
    var fp = makeFingerprint(ad.platform, title, ad.price_eur);
    if (state.sent[fp]) {
      steps.push({ k: "seen", ok: false, why: "même titre, même prix à 5 € près : le même objet sous un autre numéro", fp: fp, dup: true });
      return stop("dup");
    }
    steps.push({ k: "seen", ok: true, drop: ev.price_drop || null, first: !ev.price_drop });

    // 4. Combien ça rapporte ?
    steps.push({ k: "profit", ev: ev });

    // 5. Pour pièces ? Arnaque ?
    var hs = detectHs(title, ad.description || "", ad.condition || null, ad.price_eur, ev.realistic_sell_price);
    ev.is_hs = hs.is_hs; ev.hs = hs;
    if (hs.is_hs) { ev.is_scam_suspect = false; ev.scam_flags = []; } else applyScamFlags(ev);
    steps.push({ k: "risk", hs: hs, flags: ev.scam_flags || [], suspect: !!ev.is_scam_suspect, skip: !!ev.scam_skip, ratio: ev.ratio });

    // 6. Quel salon ?
    var ch = routeDeal(ev, settings);
    state.sent[fp] = 1;
    var who = mentions(users, ev, ch);
    steps.push({ k: "route", ok: true, channel: ch, label: CHANNELS[ch], who: who });
    return { ad: ad, steps: steps, ev: ev, channel: ch, who: who, stop: null };
  }

  root.DealHunterEngine = {
    normalize: normalize, shouldExclude: shouldExclude, vintedNoise: vintedNoise, extractGpuModel: extractGpuModel, isRecentGpu: isRecentGpu,
    buildModelIndex: buildModelIndex, extractCpuModel: extractCpuModel, extractRamModel: extractRamModel, extractSsdModel: extractSsdModel,
    isPcListing: isPcListing, marketBiasCorrection: marketBiasCorrection, evaluateDeal: evaluateDeal, applyScamFlags: applyScamFlags,
    detectHs: detectHs, makeFingerprint: makeFingerprint, routeDeal: routeDeal, mentions: mentions, processAd: processAd,
    verdictOf: verdictOf, CHANNELS: CHANNELS, RESALE_FEES: RESALE_FEES
  };
})(typeof window !== "undefined" ? window : globalThis);

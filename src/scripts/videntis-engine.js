// Moteur de la démo Videntis. Code porté du vrai produit, sans changement de logique :
// - normalize, extractGpuModel, matchComponent : monark-lens/src/content/detect.ts
// - classifyWithRules (et la compilation des règles) : monark-lens/src/content/classify.ts, intent-rules-client.ts
// - verdictMargin : compute_verdict_margin de monark-api/app/services/estimator_components.py
// Seuls ajouts : matchComponent note la règle qui a tranché et les candidats écartés, pour l'affichage.
(function (root) {
  "use strict";

  // ---------- Lecture du titre (detect.ts) ----------
  function normalize(text) {
    var t = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    t = t.replace(/(\d)\s+(x3d|x3|xt|xtx|xs|kf|ks|kx|hx|hs|x|k|g|f|e|s|u|h|p|ti|super)\b/g, "$1$2");
    t = t.replace(/\b(gtx|rtx|rx)\s+(\d)/g, "$1$2");
    return t;
  }

  function extractGpuModel(title) {
    var m = /\b(?:geforce\s*)?(?:rtx|gtx)\s*(\d{3,4})\s*(ti\s*super|super|ti)?\b/i.exec(title);
    if (m) return m[0].trim();
    m = /\b(?:nvidia\s*)?(?:geforce\s*)?(\d{4})\s*(ti\s*super|super|ti)\b/i.exec(title);
    if (m) { var num = parseInt(m[1], 10); return ((num >= 2000 ? "RTX" : "GTX") + " " + m[1] + " " + (m[2] || "")).trim(); }
    m = /\b(?:radeon\s*)?rx\s*(\d{3,4})\s*(xt|xtx)?\b/i.exec(title);
    if (m) return m[0].trim();
    m = /\brx(\d{4})\s*(xt|xtx)?\b/i.exec(title);
    if (m) return ("RX " + m[1] + (m[2] ? " " + m[2] : "")).trim();
    m = /\barc\s*(a\d{3,4})\b/i.exec(title);
    if (m) return m[0].trim();
    return null;
  }

  function matchComponent(componentDb, title) {
    var info = { token: null, rule: null, rejected: [] };
    if (!componentDb.length) return { match: null, info: info };
    var normalizedTitle = normalize(title), bestMatch = null;
    componentDb.forEach(function (component) {
      var normalizedName = normalize(component.name);
      if (normalizedTitle.indexOf(normalizedName) !== -1) {
        var score = normalizedName.length * 2;
        if (!bestMatch || score > bestMatch.matchScore) bestMatch = { componentId: component.id, componentName: component.name, category: component.category || "", matchScore: score, matchType: "exact_name" };
        return;
      }
      (component.aliases || []).forEach(function (alias) {
        var normalizedAlias = normalize(alias);
        if (normalizedAlias.length >= 3 && normalizedTitle.indexOf(normalizedAlias) !== -1) {
          var s = normalizedAlias.length;
          if (!bestMatch || s > bestMatch.matchScore) bestMatch = { componentId: component.id, componentName: component.name, category: component.category || "", matchScore: s, matchType: "alias" };
        }
      });
    });
    // Filet GPU (correctif « faux Ti ») : égalité exacte du token, sinon plus petit sur-ensemble
    // en rejetant tout nom portant un suffixe absent du token.
    var gpuModel = extractGpuModel(title);
    if (gpuModel) {
      var normalizedGpu = normalize(gpuModel);
      var SUFFIX_RE = /(tisuper|super|ti|xtx|xt)$/;
      var tokenSuffix = (normalizedGpu.match(SUFFIX_RE) || [""])[0];
      var coreOf = function (nn) { return nn.replace(/^(?:nvidia|geforce|amd|radeon|intel|arc)+/, ""); };
      info.token = normalizedGpu;
      var gpuComponent = null, i, c, nn;
      for (i = 0; i < componentDb.length; i++) {
        c = componentDb[i]; nn = normalize(c.name);
        if (nn === normalizedGpu || coreOf(nn) === normalizedGpu) { gpuComponent = c; info.rule = "exact"; break; }
      }
      if (!gpuComponent) {
        var bestDelta = Infinity;
        for (i = 0; i < componentDb.length; i++) {
          c = componentDb[i];
          var core = coreOf(normalize(c.name));
          if (!(core.indexOf(normalizedGpu) !== -1 || normalizedGpu.indexOf(core) !== -1)) continue;
          var coreSuffix = (core.match(SUFFIX_RE) || [""])[0];
          if (coreSuffix && coreSuffix !== tokenSuffix) { info.rejected.push(c.name); continue; }
          var delta = Math.abs(core.length - normalizedGpu.length);
          if (delta < bestDelta) { gpuComponent = c; bestDelta = delta; info.rule = "closest"; }
        }
      }
      if (gpuComponent) {
        var gpuScore = normalizedGpu.length * 3;
        if (!bestMatch || gpuScore > bestMatch.matchScore || bestMatch.matchType === "alias" || bestMatch.category !== "gpu") {
          bestMatch = { componentId: gpuComponent.id, componentName: gpuComponent.name, category: gpuComponent.category || "", matchScore: gpuScore, matchType: "gpu_regex" };
        }
      }
    }
    if (bestMatch && bestMatch.matchType !== "gpu_regex") info.rule = bestMatch.matchType;
    return { match: bestMatch, info: info };
  }

  // ---------- Vraie vente ? (classify.ts) ----------
  function compilePatterns(patterns) {
    var out = [];
    (patterns || []).forEach(function (p) { try { out.push(new RegExp(p, "i")); } catch (e) { /* motif invalide ignoré */ } });
    return out;
  }
  function compileRules(rs) {
    var families = rs.families.slice().sort(function (a, b) { return b.priority - a.priority; }).map(function (f) {
      return { slug: f.slug, label: f.label, overlay_message: f.overlay_message, gate: f.gate, should_signal: f.should_signal, priority: f.priority,
        title: compilePatterns(f.title_patterns), desc: compilePatterns(f.desc_patterns), negation: compilePatterns(f.negation_patterns),
        negation_window: f.negation_window_chars, veto: compilePatterns(f.veto_patterns) };
    });
    return { version: rs.version, desc_char_limit: rs.desc_char_limit, symbolic_price_thresholds: rs.symbolic_price_thresholds,
      symbolic_placeholder_max: rs.symbolic_placeholder_max, price_aberration_min: rs.price_aberration_min,
      aberration_exempt_keywords: rs.aberration_exempt_keywords || [], families: families };
  }
  function cnorm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function vetoed(fam, t, d) { return fam.veto.some(function (r) { return r.test(t) || r.test(d); }); }
  function negatedBefore(text, idx, fam) {
    if (!fam.negation.length) return false;
    var before = text.slice(Math.max(0, idx - fam.negation_window), idx);
    return fam.negation.some(function (r) { return r.test(before); });
  }
  function firstMatch(patterns, text, fam, t, d) {
    if (vetoed(fam, t, d)) return null;
    for (var i = 0; i < patterns.length; i++) {
      var m = patterns[i].exec(text);
      if (m && m[0]) { if (negatedBefore(text, m.index, fam)) continue; return m[0]; }
    }
    return null;
  }
  function classifyWithRules(rules, title, price, description, category) {
    var nt = cnorm(title), nd = cnorm(description).slice(0, rules.desc_char_limit), hit = null, i, h;
    for (i = 0; i < rules.families.length && !hit; i++) { h = firstMatch(rules.families[i].title, nt, rules.families[i], nt, nd); if (h) hit = { fam: rules.families[i], where: "titre", extract: h }; }
    for (i = 0; i < rules.families.length && !hit; i++) { h = firstMatch(rules.families[i].desc, nd, rules.families[i], nt, nd); if (h) hit = { fam: rules.families[i], where: "description", extract: h }; }
    var exempt = rules.aberration_exempt_keywords.some(function (k) { return nt.indexOf(k) !== -1 || nd.indexOf(k) !== -1; });
    if (price !== null && price >= rules.price_aberration_min && !exempt) return { intent: "sale", counts: false, label: "Prix suspect", extract: price + " €", where: "prix" };
    if (!hit && price !== null) {
      var sym = rules.families.filter(function (f) { return f.slug === "symbolic_price"; })[0];
      var th = category ? (rules.symbolic_price_thresholds[category] || rules.symbolic_price_thresholds.default) : rules.symbolic_price_thresholds.default;
      if (price <= rules.symbolic_placeholder_max || price <= th) return { intent: "symbolic_price", counts: sym ? sym.should_signal : false, label: sym ? sym.label : "Prix symbolique", extract: price + " €", where: "prix" };
    }
    if (hit) return { intent: hit.fam.slug, counts: hit.fam.should_signal, label: hit.fam.label, extract: hit.extract, where: hit.where };
    return { intent: "sale", counts: true, label: "Vente normale", extract: null, where: null };
  }

  // ---------- Verdict (estimator_components.py) ----------
  // Profils plateforme réels : marge de négociation habituelle et frais vendeur.
  var PLATFORMS = {
    leboncoin: { label: "Leboncoin", neg: 12, sellerFees: 0 },
    vinted: { label: "Vinted", neg: 5, sellerFees: 0 },
    ebay: { label: "eBay", neg: 5, sellerFees: 13 }
  };
  function verdictMargin(price, resaleNet, achatMax, culturePct, confLevel) {
    if (price <= 0 || !resaleNet || resaleNet <= 0) return { code: "AVOID" };
    var mAsk = (resaleNet - price) / price;
    var pNeg = price * (1 - culturePct);
    var mNeg = pNeg > 0 ? (resaleNet - pNeg) / pNeg : mAsk;
    var discMax = achatMax ? (price - achatMax) / price : 1;
    var code;
    if (mAsk >= 0.30) code = "BUY";
    else if (mNeg >= 0.20) code = "NEGOTIATE";
    else if (discMax <= 0.30) code = "LOWBALL";
    else code = "AVOID";
    if (confLevel === "low") code = { BUY: "NEGOTIATE", NEGOTIATE: "NEGOTIATE", LOWBALL: "LOWBALL", AVOID: "AVOID" }[code];
    return { code: code, mAsk: mAsk, pNeg: pNeg, mNeg: mNeg, discMax: discMax };
  }

  // ---------- Analyse complète d'une annonce ----------
  function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
  function analyse(input, data) {
    var res = { input: input };
    var mc = matchComponent(data.catalog, input.title);
    res.match = mc.match; res.matchInfo = mc.info;
    res.intent = classifyWithRules(data.rules, input.title, input.price, input.description || "", mc.match ? mc.match.category : null);
    if (!res.match || !res.intent.counts) return res;
    var mk = data.market[res.match.componentId];
    if (!mk) return res;
    var best = null;
    Object.keys(PLATFORMS).forEach(function (k) {
      var net = Math.round(mk.plat[k] * (1 - PLATFORMS[k].sellerFees / 100));
      if (!best || net > best.net) best = { key: k, label: PLATFORMS[k].label, gross: mk.plat[k], fees: PLATFORMS[k].sellerFees, net: net };
    });
    var n = mk.obs.length;
    var resaleNet = best.net, achatMax = Math.round(resaleNet / 1.20);
    var conf = n < 15 ? "low" : n < 30 ? "medium" : "high";
    var culture = PLATFORMS[input.platform].neg / 100;
    res.market = { obs: mk.obs, n: n, median: median(mk.obs), best: best, resaleNet: resaleNet, achatMax: achatMax, conf: conf, culture: culture };
    res.verdict = verdictMargin(input.price, resaleNet, achatMax, culture, conf);
    return res;
  }

  root.VidentisEngine = { normalize: normalize, extractGpuModel: extractGpuModel, matchComponent: matchComponent, compileRules: compileRules,
    classifyWithRules: classifyWithRules, verdictMargin: verdictMargin, analyse: analyse, PLATFORMS: PLATFORMS };
})(typeof window !== "undefined" ? window : globalThis);

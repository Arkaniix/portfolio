// Messages de Deal Hunter tels que Discord les affiche (thème sombre), reconstitués d'après notifier.py et bot.py :
// mêmes titres, emojis, champs, couleurs d'embed et boutons. Utilisé au build (page) et dans le navigateur (démo).
(function (root) {
  "use strict";
  var NB = " ";
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function e0(x) { return Math.round(x) + "€"; }                     // format du bot : « 210€ »
  function s0(x) { var r = Math.round(x); return (r >= 0 ? "+" : "") + r + "€"; }
  // Verdicts et couleurs d'embed, repris d'evaluator.py
  var VERDICT = { huge: "🔥 ÉNORME DEAL", vgood: "💰 TRÈS BON DEAL", good: "👍 BON PRIX", ok: "ℹ️ PRIX CORRECT", bad: "⚠️ PAS RENTABLE", none: "❓ PAS DE RÉFÉRENCE" };
  var COLOR = { huge: "#2ECC71", vgood: "#27AE60", good: "#F1C40F", ok: "#F39C12", bad: "#E74C3C", none: "#95A5A6", sus: "#FF0000", drop: "#3498DB", ai: "#3498DB" };
  var PLATFORM = { leboncoin: "Leboncoin", vinted: "Vinted" }, FOOT = { leboncoin: "LBC", vinted: "VINTED" };
  var FAM = { gpu: "", cpu: "CPU • ", ram: "RAM • ", ssd: "SSD • " };
  var EXT = "<svg class=\"ext\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14zM5 5h6v2H7v10h10v-4h2v6H5z\" fill=\"currentColor\"/></svg>";
  function bold(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }

  function head(o) {
    return "<span class=\"msg-av\" aria-hidden=\"true\">DH</span>" +
      "<p class=\"msg-h\"><b>Deal Hunter</b><span class=\"botp\">APP</span><time>" + esc(o.time || "Aujourd’hui à 14:31") + "</time></p>";
  }
  function embed(color, title, desc, fields, foot, thumb, link) {
    return "<div class=\"emb\" style=\"--ec:" + color + "\"><div class=\"emb-g\">" +
      "<div class=\"emb-c\"><p class=\"emb-t" + (link ? " lk" : "") + "\">" + esc(title) + "</p>" + (desc ? "<div class=\"emb-d\">" + desc + "</div>" : "") +
      (fields && fields.length ? "<div class=\"emb-f\">" + fields.map(function (f) {
        return "<div class=\"" + (f[2] ? "fi" : "fw") + "\">" + (f[0] ? "<p class=\"fn\">" + esc(f[0]) + "</p>" : "") + "<p class=\"fv\">" + f[1] + "</p></div>";
      }).join("") + "</div>" : "") + "</div>" +
      (thumb ? "<span class=\"emb-th\" data-bg=\"" + esc(thumb.bg) + "\">" + thumb.svg + "</span>" : "") +
      "</div>" + (foot ? "<p class=\"emb-foot\">" + esc(foot) + "</p>" : "") + "</div>";
  }

  // Message d'une annonce (o.ev : évaluation du moteur, o.ad : annonce, o.who : noms mentionnés)
  function deal(o) {
    var ev = o.ev, ad = o.ad, drop = ev.price_drop, k = ev.verdict.k;
    var model = ev.matched_model ? ev.matched_model.name : (o.token || "GPU");
    var kind = ev.is_scam_suspect ? "sus" : drop ? "drop" : k;
    var title = (o.fresh === false ? "" : "🆕 ") + (drop ? "📉 BAISSE DE PRIX" : VERDICT[k]) + "  " + model;
    var desc = esc(ad.title) + (ad.description ? "<br><br>📝 " + esc(ad.description) : "") +
      (ev.is_scam_suspect ? "<br><br>⛔ <b>NE PAS ACHETER SANS VÉRIFIER LE VENDEUR</b>" : "");
    var f = [["💰 Prix", "<b>" + e0(ad.price_eur) + "</b>", 1]];
    if (drop) f.push(["📉 Baisse", e0(drop.old_price) + " → " + e0(drop.new_price) + " (-" + Math.round(drop.drop_pct) + "%)", 1]);
    f.push(ev.realistic_sell_price !== null ? ["📊 Revente estimée", "~" + e0(ev.realistic_sell_price), 1] : ["📊 Revente", "N/A", 1]);
    f.push(ev.best_profit !== null ? ["💵 Profit net", "<b>" + s0(ev.best_profit) + "</b> via " + ev.best_channel.toUpperCase(), 1] : ["💵 Profit", "N/A", 1]);
    if (o.city) f.push(["📍 Localisation", esc(o.city), 1]);
    f.push(["🏷️ Plateforme", PLATFORM[ad.platform] || "?", 1]);
    var n = ev.observation_count;
    if (n > 0) f.push(["🔢 Observations", n + (n >= 30 ? " ✅ fiable" : n >= 15 ? "" : " ⚠️ faible"), 1]);
    if (ev.new_price_eur) f.push(["🏷️ Prix neuf", e0(ev.new_price_eur), 1]);
    if (ev.best_channel) f.push(["📋 Détail profits", ["lbc", "vinted", "ebay"].map(function (c) { return c.toUpperCase() + ": " + s0(ev.profits_by_channel[c].profit); }).join(" | ")]);
    if (ev.is_scam_suspect) f.push(["🚩 Drapeaux", ev.scam_flags.map(function (x) { return "• " + esc(x); }).join("<br>")]);
    f.push(["🕒 Publiée", esc(o.ago || "à l’instant"), 1]);
    if (ev.is_hs) {
      if (ev.hs.signals.length) f.push(["🔍 Signaux HS", esc(ev.hs.signals.slice(0, 3).join(" · ")), 1]);
      if (ev.hs.price_anomaly) f.push(["🔥 Prix exceptionnellement bas", "Prix &lt; 40% de la revente estimée — vérifier la cohérence.", 1]);
      f.push(["", "⚠️ <b>Annonce détectée comme HS / pour pièces</b> — Le verdict ci-dessus est basé sur la valeur fonctionnelle du composant. La rentabilité réelle dépend de la réparabilité. Utilise 🔍 <b>Analyser</b> pour un diagnostic technique détaillé."]);
    }
    var fam = ev.is_cpu ? "cpu" : ev.is_ram ? "ram" : ev.is_ssd ? "ssd" : "gpu";
    var who = (o.who || []).map(function (w) { return "<span class=\"ment\">@" + esc(w) + "</span>"; }).join(" ");
    return "<div class=\"msg" + (o.mine ? " mnt" : "") + (o.cls ? " " + o.cls : "") + "\">" + head(o) +
      "<div class=\"msg-b\">" + (who ? "<p class=\"msg-c\">" + who + "</p>" : "") +
      embed(COLOR[kind], title, desc, f, "Deal Hunter • " + FAM[fam] + (FOOT[ad.platform] || ""), o.thumb, true) +
      "<div class=\"msg-btns\"><span class=\"mb mb-link\">🛒 Acheter" + EXT + "</span>" +
      "<button type=\"button\" class=\"mb mb-pri\"" + (o.aiId ? " id=\"" + o.aiId + "\"" : "") + ">🔍 Analyser</button>" +
      "<button type=\"button\" class=\"mb mb-dan\"" + (o.repId ? " id=\"" + o.repId + "\"" : "") + ">🚩 Signaler</button></div>" +
      (o.after || "") + "</div></div>";
  }

  // Réponse au clic sur « Analyser » : un embed « 🔍 Analyse du deal », en réponse au message de l'annonce
  function analysis(o) {
    var lines = [];
    o.sections.forEach(function (s) {
      lines.push("<p class=\"ai-h" + (o.pend ? " pend" : "") + "\"><b>" + esc(s.h) + "</b></p>");
      s.l.forEach(function (l) { lines.push("<p class=\"ai-l" + (o.pend ? " pend\" data-t=\"" + esc(l) + "\">" : "\">" + bold(l)) + "</p>"); });
    });
    return "<div class=\"msg msg-rp" + (o.cls ? " " + o.cls : "") + "\">" +
      "<p class=\"msg-re\"><span class=\"re-av\">DH</span><b>@Deal Hunter</b><span>" + esc(o.quote || "") + "</span></p>" + head(o) +
      "<div class=\"msg-b\">" + embed(COLOR.ai, "🔍 Analyse du deal", lines.join(""), null,
        "Analyse par Claude Haiku (texte + image) • usage personnel", null, false) + "</div></div>";
  }

  // Panneau de chasse d'un utilisateur (user_panel.py) : embed et composants. data-f : réglage modifié au clic (démo).
  var CH_ORDER = ["deals_fire", "deals_price_drop", "deals_other", "deals_not_rentable", "deals_suspect", "deals_hs"];
  var CH_OPT = { deals_fire: "🔥 Fire", deals_price_drop: "📉 Baisses prix", deals_other: "📋 Other", deals_not_rentable: "💸 Pas rentables", deals_suspect: "⛔ Suspects", deals_hs: "🔧 HS" };
  function yes(v) { return v ? "✅" : "❌"; }
  function panel(u, o) {
    o = o || {};
    var on = u.presence === "ON";
    var f = [
      ["🔧 Options", yes(u.notify_when_offline) + " Ping même quand je suis OFF (l’autre est ON)<br>" + yes(u.auto_off !== false) + " Auto-OFF si je me déconnecte de Discord"],
      ["🏪 Plateformes", Object.keys(u.platforms).map(function (k) { return yes(u.platforms[k]) + " " + k.toUpperCase(); }).join("  ")],
      ["📦 Catégories", Object.keys(u.categories).map(function (k) { return yes(u.categories[k]) + " " + k.toUpperCase(); }).join("  ")],
      ["🔔 Channels pingés", CH_ORDER.map(function (k) { return yes(u.channels_to_ping[k]) + " " + k.replace("deals_", ""); }).join("  ")],
      ["💰 Seuils perso", "Profit min pour être pingé : <b>" + u.min_profit_to_ping + "€</b><br>Prix max d’annonce pour être pingé : <b>" + u.max_price_perso + "€</b>"],
    ];
    var desc = on ? "🟢 <b>Présence : ON</b> — tu es sur le terrain" : "🔴 <b>Présence : OFF</b> — aucun ping n’arrive";
    var btn = function (cls, f, v, label, pressed) { return "<button type=\"button\" class=\"mb " + cls + "\" data-f=\"" + f + "\"" + (v != null ? " data-v=\"" + v + "\"" : "") + " aria-pressed=\"" + pressed + "\">" + label + "</button>"; };
    return "<div class=\"msg\">" + head({ time: o.time || "Aujourd’hui à 09:12" }) + "<div class=\"msg-b\">" +
      embed(on ? "#2ECC71" : "#95A5A6", "⚙️ Panneau de chasse — " + u.username, desc, f, null, null, false) +
      "<div class=\"msg-btns\">" + btn(on ? "mb-ok" : "mb-dan", "presence", null, on ? "🟢 Présence ON" : "🔴 Présence OFF", on) +
        btn(u.notify_when_offline ? "mb-ok" : "mb-sec", "notify_when_offline", null, (u.notify_when_offline ? "✅" : "❌") + " Ping si OFF", !!u.notify_when_offline) + "</div>" +
      "<div class=\"msg-btns sm\"><span class=\"mb-k\">💰 Profit min</span>" + [25, 50, 80].map(function (v) { return btn(u.min_profit_to_ping === v ? "mb-pri" : "mb-sec", "min_profit_to_ping", v, v + "€", u.min_profit_to_ping === v); }).join("") + "</div>" +
      "<div class=\"dsc-sel\"><p class=\"dsc-sel-h\">🔔 Channels où je veux être pingé</p>" + CH_ORDER.map(function (k) {
        return "<button type=\"button\" class=\"dsc-opt\" data-f=\"ch\" data-v=\"" + k + "\" aria-pressed=\"" + !!u.channels_to_ping[k] + "\">" + CH_OPT[k] + "<i aria-hidden=\"true\"></i></button>";
      }).join("") + "</div></div></div>";
  }

  root.DHDiscord = { deal: deal, analysis: analysis, panel: panel, VERDICT: VERDICT, COLOR: COLOR, esc: esc };
})(typeof globalThis !== "undefined" ? globalThis : this);

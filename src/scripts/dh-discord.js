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
  // Panneau de chasse (user_panel.py) : embed, puis rangée 0 (Présence, Modifier seuils, Ping si OFF, Auto-OFF)
  // et trois menus multi-choix repliés (plateformes, catégories, salons pingés), comme dans Discord.
  // o.compact : embed réduit au titre, au statut et aux seuils (les autres champs sont dans les menus).
  var DD = {
    platforms: { ph: "🏪 Plateformes activées", lab: { lbc: "Leboncoin", vinted: "Vinted" } },
    categories: { ph: "📦 Catégories à recevoir", lab: { gpu: "GPU", cpu: "CPU", ram: "RAM", ssd: "SSD", psu: "Alim.", mobo: "Carte mère", pc: "PC complet" } },
    channels_to_ping: { ph: "🔔 Channels où je veux être pingé", lab: CH_OPT },
  };
  function ddHtml(key, vals) {
    var d = DD[key], ks = Object.keys(vals), on = ks.filter(function (k) { return vals[k]; });
    return "<div class=\"dsc-dd\" data-dd=\"" + key + "\"><button type=\"button\" class=\"dsc-dd-b\" aria-haspopup=\"listbox\" aria-expanded=\"false\">" +
      "<span class=\"dsc-dd-v" + (on.length ? "" : " ph") + "\">" + esc(on.length ? on.map(function (k) { return d.lab[k]; }).join(", ") : d.ph) + "</span></button>" +
      "<div class=\"dsc-dd-l\" role=\"listbox\" aria-multiselectable=\"true\" aria-label=\"" + esc(d.ph) + "\">" + ks.map(function (k) {
        return "<button type=\"button\" class=\"dsc-opt\" role=\"option\" data-v=\"" + k + "\" aria-selected=\"" + !!vals[k] + "\">" + esc(d.lab[k]) + "<i aria-hidden=\"true\"></i></button>";
      }).join("") + "</div></div>";
  }
  function panel(u, o) {
    o = o || {};
    var on = u.presence === "ON", auto = u.auto_off !== false;
    var seuils = ["💰 Seuils perso", "Profit min pour être pingé : <b>" + u.min_profit_to_ping + "€</b><br>Prix max d’annonce pour être pingé : <b>" + u.max_price_perso + "€</b>"];
    var f = o.compact ? [seuils] : [
      ["🔧 Options", yes(u.notify_when_offline) + " Ping même quand je suis OFF (l’autre est ON)<br>" + yes(auto) + " Auto-OFF si je me déconnecte de Discord"],
      ["🏪 Plateformes", Object.keys(u.platforms).map(function (k) { return yes(u.platforms[k]) + " " + k.toUpperCase(); }).join("  ")],
      ["📦 Catégories", Object.keys(u.categories).map(function (k) { return yes(u.categories[k]) + " " + k.toUpperCase(); }).join("  ")],
      ["🔔 Channels pingés", CH_ORDER.map(function (k) { return yes(u.channels_to_ping[k]) + " " + k.replace("deals_", ""); }).join("  ")],
      seuils,
    ];
    var desc = on ? "🟢 <b>Présence : ON</b> — tu es sur le terrain" : "🔴 <b>Présence : OFF</b> — aucun ping n’arrive";
    var btn = function (cls, f, label, pressed) { return "<button type=\"button\" class=\"mb " + cls + "\" data-f=\"" + f + "\"" + (pressed == null ? "" : " aria-pressed=\"" + pressed + "\"") + ">" + label + "</button>"; };
    var ch = {}; CH_ORDER.forEach(function (k) { ch[k] = !!u.channels_to_ping[k]; });
    return "<div class=\"msg\">" + head({ time: o.time || "Aujourd’hui à 09:12" }) + "<div class=\"msg-b\">" +
      embed(on ? "#2ECC71" : "#95A5A6", "⚙️ Panneau de chasse — " + u.username, desc, f, null, null, false) +
      "<div class=\"msg-btns\">" + btn(on ? "mb-ok" : "mb-dan", "presence", on ? "🟢 Présence ON" : "🔴 Présence OFF", on) +
        btn("mb-pri", "thresholds", "💰 Modifier seuils") +
        btn(u.notify_when_offline ? "mb-ok" : "mb-sec", "notify_when_offline", (u.notify_when_offline ? "✅" : "❌") + " Ping si OFF", !!u.notify_when_offline) +
        btn(auto ? "mb-ok" : "mb-sec", "auto_off", (auto ? "✅" : "❌") + " Auto-OFF", auto) + "</div>" +
      ddHtml("platforms", u.platforms) + ddHtml("categories", u.categories) + ddHtml("channels_to_ping", ch) + "</div></div>";
  }

  // Mise à jour sur place (même structure) : les couleurs passent en transition au lieu d'un remplacement brutal.
  var PATCH = [".emb", ".emb-d", ".emb-f", ".mb", ".dsc-dd-v", ".dsc-opt"];
  function patch(el, html) {
    var tmp = document.createElement("div"); tmp.innerHTML = html;
    var ok = PATCH.every(function (q) { return el.querySelectorAll(q).length === tmp.querySelectorAll(q).length; });
    if (!ok) { el.innerHTML = html; return; }
    PATCH.forEach(function (q) {
      var A = el.querySelectorAll(q), B = tmp.querySelectorAll(q);
      for (var i = 0; i < A.length; i++) {
        ["class", "style", "aria-pressed", "aria-selected"].forEach(function (at) {
          var v = B[i].getAttribute(at);
          if (v === null) A[i].removeAttribute(at); else if (A[i].getAttribute(at) !== v) A[i].setAttribute(at, v);
        });
        if (q !== ".emb" && q !== ".dsc-opt" && A[i].innerHTML !== B[i].innerHTML) A[i].innerHTML = B[i].innerHTML;
      }
    });
  }

  // Comportement du panneau dans la page : boutons, menus (validés à la fermeture, comme Discord), fenêtre des seuils.
  // o : { user(), host (élément où poser la fenêtre), maxGlobal(), change(), say(texte) }
  function bindPanel(box, o) {
    var open = null;
    function draw() { patch(box, panel(o.user(), { compact: o.compact, time: (box.querySelector(".msg-h time") || {}).textContent })); }
    function close(apply) {
      if (!open) return;
      var dd = open, key = dd.getAttribute("data-dd"), u = o.user(), changed = false;
      open = null; dd.classList.remove("open"); dd.querySelector(".dsc-dd-b").setAttribute("aria-expanded", "false");
      if (apply) dd.querySelectorAll(".dsc-opt").forEach(function (b) {
        var v = b.getAttribute("data-v"), sel = b.getAttribute("aria-selected") === "true";
        if (!!u[key][v] !== sel) { u[key][v] = sel; changed = true; }
      });
      draw();
      if (changed) o.change();
    }
    document.addEventListener("click", function (e) { if (open && !open.contains(e.target)) close(true); });
    box.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { close(true); } });
    box.addEventListener("click", function (e) {
      var t = e.target, b, u = o.user();
      if ((b = t.closest(".dsc-dd-b"))) {
        var dd = b.parentNode;
        if (open === dd) return close(true);
        close(true); open = dd; dd.classList.remove("up"); dd.classList.add("open"); b.setAttribute("aria-expanded", "true");
        var l = dd.querySelector(".dsc-dd-l"), r = dd.getBoundingClientRect(), sc = dd.closest(".dsc-feed"), lo = sc ? sc.getBoundingClientRect() : { top: 0, bottom: innerHeight };
        dd.classList.toggle("up", r.bottom + l.offsetHeight + 8 > lo.bottom && r.top - l.offsetHeight - 8 > lo.top);   // vers le haut s'il manque de place
        return;
      }
      if ((b = t.closest(".dsc-dd .dsc-opt"))) { b.setAttribute("aria-selected", String(b.getAttribute("aria-selected") !== "true")); return; }
      if (!(b = t.closest("[data-f]"))) return;
      var fl = b.getAttribute("data-f");
      if (fl === "thresholds") return modal(u);
      if (fl === "presence") u.presence = u.presence === "ON" ? "OFF" : "ON";
      else if (fl === "notify_when_offline") u.notify_when_offline = !u.notify_when_offline;
      else if (fl === "auto_off") u.auto_off = u.auto_off === false;
      draw(); o.change(fl);
    });
    // Fenêtre « Seuils — {nom} » : mêmes contrôles et mêmes réponses que ThresholdsModal
    function modal(u) {
      var m = document.createElement("div");
      m.className = "dsc dsc-modal";
      m.innerHTML = "<form class=\"dsc-mod\"><p class=\"dsc-mod-t\">" + esc("Seuils — " + u.username) + "</p>" +
        "<label>Profit min pour être pingé (€)<input name=\"p\" maxlength=\"5\" required inputmode=\"numeric\" autocomplete=\"off\" value=\"" + u.min_profit_to_ping + "\"></label>" +
        "<label>Prix max d’annonce pour être pingé (€)<input name=\"x\" maxlength=\"5\" required inputmode=\"numeric\" autocomplete=\"off\" value=\"" + u.max_price_perso + "\"></label>" +
        "<p class=\"dsc-mod-b\"><button type=\"button\" class=\"dsc-cancel\">Annuler</button><button type=\"submit\" class=\"mb mb-pri\">Envoyer</button></p></form>";
      o.host.appendChild(m);
      var f = m.querySelector("form"), done = function () { m.remove(); };
      f.p.focus({ preventScroll: true }); f.p.select();
      m.addEventListener("click", function (e) { if (e.target === m || e.target.closest(".dsc-cancel")) done(); });
      m.addEventListener("keydown", function (e) { if (e.key === "Escape") done(); });
      f.addEventListener("submit", function (e) {
        e.preventDefault(); done();
        var P = f.p.value.trim(), X = f.x.value.trim();
        if (!/^[+-]?\d+$/.test(P) || !/^[+-]?\d+$/.test(X)) return o.say("⚠️ Valeurs invalides : profit et prix doivent être des nombres entiers.");
        var profit = parseInt(P, 10), price = parseInt(X, 10);
        if (profit < 0 || price <= 0 || profit > 99999 || price > 99999) return o.say("⚠️ Valeurs invalides : profit ≥ 0, prix > 0, max 99999€.");
        var g = o.maxGlobal(), clamped = price > g;
        if (clamped) price = g;
        u.min_profit_to_ping = profit; u.max_price_perso = price;
        draw(); o.change("thresholds");
        o.say("✅ Seuils mis à jour : profit min " + profit + "€, prix max " + price + "€" + (clamped ? " (plafonné par max global " + g + "€)" : ""));
      });
    }
    return { draw: draw };
  }

  // Panneau de #bot-settings (settings.py) : killswitch des plateformes, prix max absolu, seuil fire, signalements.
  // data-a : réglage modifié (démo). Le second panneau perso n'est pas nommé.
  function select(a, values, cur, label) {
    return "<label class=\"dsc-pick\"><select data-a=\"" + a + "\">" + values.map(function (v) {
      return "<option value=\"" + v + "\"" + (v === cur ? " selected" : "") + ">" + label(v) + "</option>";
    }).join("") + "</select></label>";
  }
  function adminPanel(s, o) {
    o = o || {};
    var n = o.reports || 0;
    var tog = function (k, label) { return "<button type=\"button\" class=\"mb " + (s[k] ? "mb-ok" : "mb-dan") + "\" data-a=\"" + k + "\" aria-pressed=\"" + !!s[k] + "\">" + yes(s[k]) + " " + label + "</button>"; };
    var f = [
      ["🚦 Plateformes (killswitch)", yes(s.lbc_enabled) + " Leboncoin" + NB + NB + NB + yes(s.vinted_enabled) + " Vinted"],
      ["🚧 Sécurité", "Prix max absolu : <b>" + s.max_price + "€</b><br><i>Les panneaux perso sont plafonnés par cette valeur.</i>"],
      ["🔥 Routage", "Seuil fire profit : <b>" + s.min_profit_fire + "€</b><br><i>Les annonces avec best_profit ≥ " + s.min_profit_fire + "€ sont routées vers <code>#deals-fire</code>.</i>"],
      ["🚩 Signalements en cours", "<b>" + n + "</b> signalement(s) actif(s).<br>" + (n > 0 ? "Clique <b>Voir détails</b> ci-dessous pour la liste." : "Aucun signalement à examiner.")],
    ];
    var desc = "Filtres globaux du pipeline. Pour le routage des <b>mentions</b> (qui se fait pinger pour quoi), voir les panneaux perso, dont <code>#settings-etienne</code>.<br><br>Le bot tourne tant qu’au moins un chasseur est ON.";
    return "<div class=\"msg\">" + head({ time: o.time || "Aujourd’hui à 09:10" }) + "<div class=\"msg-b\">" +
      embed("#5865F2", "⚙️ Pipeline Deal Hunter — Killswitch & Routage", desc, f, "Les changements sont appliqués immédiatement", null, false) +
      "<div class=\"msg-btns\">" + tog("lbc_enabled", "Leboncoin") + tog("vinted_enabled", "Vinted") + "</div>" +
      select("max_price", [300, 500, 800, 1000, 1500], s.max_price, function (v) { return v + "€"; }) +
      select("min_profit_fire", [10, 25, 50, 75, 100], s.min_profit_fire, function (v) { return v + "€ profit"; }) +
      "<div class=\"msg-btns\"><button type=\"button\" class=\"mb mb-sec\" data-a=\"reports\">🚩 Voir détails</button></div></div></div>";
  }
  // Liste des signalements actifs (report_view.py, ReportsListView), affichée en message éphémère.
  // items : { id, title, price, ch, by, reason, ts, i } ; sel : id sélectionné.
  function reports(items, sel) {
    var f = items.map(function (r) {
      return ["#" + r.id + " · " + r.title.slice(0, 60),
        "💰 " + (r.price ? Math.round(r.price) + "€" : "—") + " · 📌 #" + esc(r.ch) + " · <span class=\"ment\">@" + esc(r.by) + "</span><br>" +
        "💬 " + (r.reason ? esc(r.reason) : "<i>aucune raison</i>") + "<br>🕑 <code>" + esc(r.ts) + "</code><br>" +
        "<button type=\"button\" class=\"dsc-lk\" data-a=\"goto\" data-v=\"" + r.i + "\">→ message</button>"];
    });
    var e = embed("#E74C3C", "🚩 Signalements actifs (" + items.length + ")", items.length ? "" : "Aucun signalement actif. 🎉", f, "Page 1/1", null, false);
    var nav = "<div class=\"msg-btns\"><button type=\"button\" class=\"mb mb-sec\" disabled>◀</button><button type=\"button\" class=\"mb mb-sec\" disabled>▶</button>" +
      "<button type=\"button\" class=\"mb mb-sec\" data-a=\"close\">↩ Retour</button></div>";
    if (!items.length) return e + nav;
    return e + nav + "<label class=\"dsc-pick\"><select data-a=\"pick\"><option value=\"\"" + (sel == null ? " selected" : "") + ">Sélectionner un signalement à résoudre</option>" +
      items.map(function (r) { return "<option value=\"" + r.id + "\"" + (r.id === sel ? " selected" : "") + ">#" + r.id + " " + esc(r.title.slice(0, 80)) + " — " + (r.price ? Math.round(r.price) + "€ · " : "") + "#" + esc(r.ch) + "</option>"; }).join("") +
      "</select></label><div class=\"msg-btns\"><button type=\"button\" class=\"mb mb-ok\" data-a=\"resolve\"" + (sel == null ? " disabled" : "") + ">✅ Résoudre la sélection</button></div>";
  }

  root.DHDiscord = { deal: deal, analysis: analysis, panel: panel, adminPanel: adminPanel, reports: reports, head: head, patch: patch, bindPanel: bindPanel, VERDICT: VERDICT, COLOR: COLOR, esc: esc };
})(typeof globalThis !== "undefined" ? globalThis : this);

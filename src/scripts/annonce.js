// Annonce dessinée à la manière de Leboncoin ou de Vinted (styles dans src/styles/annonces.css).
// Utilisée au build (pages Astro) et dans le navigateur (démos), pour un rendu identique des deux côtés.
(function (root) {
  "use strict";
  var NB = " ";
  var HEART = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.5 0 5.6 3.6 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"/></svg>";
  var SHIELD = "<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><path d=\"M8 1.2 2.5 3.3v4.2c0 3.4 2.4 6 5.5 7.3 3.1-1.3 5.5-3.9 5.5-7.3V3.3z\" fill=\"currentColor\"/><path d=\"m5.4 8.1 1.8 1.8 3.5-3.6\" fill=\"none\" stroke=\"#fff\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
  var KEY = { leboncoin: "lbc", vinted: "vin", ebay: "ebay" };
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function euros(x, cents) {
    var v = cents ? (Math.round(x * 100) / 100).toFixed(2).replace(".", ",") : String(Math.round(x));
    return v.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + NB + "€";
  }
  // Protection acheteurs de Vinted : 0,70 € + 5 % du prix de l'article
  function vintedIncl(p) { return Math.round((p + 0.7 + p * 0.05) * 100) / 100; }
  // « il y a 3 min » devient l'heure du jour, comme sur Leboncoin (référence : 14 h 31)
  function lbcDate(ago) {
    var m = /(\d+)\s*min/.exec(ago || ""), h = /(\d+)\s*h/.exec(ago || "");
    var t = 14 * 60 + 31 - (m ? +m[1] : 0) - (h ? +h[1] * 60 : 0);
    return "Aujourd’hui, " + Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  }
  // o : { pl, art, bg, title (HTML déjà échappé), price, city, zip, ago, brand, cond, likes, ship, row, cls, attrs, pics }
  function html(o) {
    var k = KEY[o.pl] || "lbc", body;
    if (k === "vin") {
      body = "<p class=\"ann-t\">" + o.title + "</p>" +
        (o.brand || o.cond ? "<p class=\"ann-s\">" + esc([o.brand, o.cond].filter(Boolean).join(" · ")) + "</p>" : "") +
        "<p class=\"ann-p\">" + euros(o.price, true) + "</p>" +
        "<p class=\"ann-incl\">" + euros(vintedIncl(o.price), true) + " incl." + SHIELD + "</p>";
    } else {
      body = "<p class=\"ann-t\">" + o.title + "</p>" +
        "<p class=\"ann-p\">" + euros(o.price, false) + "</p>" +
        (o.ship ? "<p class=\"ann-ship\">Livraison possible</p>" : "") +
        "<p class=\"ann-s\">" + esc((o.city || "") + (o.zip ? " " + o.zip : "")) + "</p>" +
        "<p class=\"ann-s\">" + esc(lbcDate(o.ago)) + "</p>";
    }
    var heart = k === "vin" ? "<span class=\"ann-heart\">" + HEART + (o.likes || 0) + "</span>" : "<span class=\"ann-heart\">" + HEART + "</span>";
    return "<article class=\"ann " + k + (o.row ? " row" : "") + (o.cls ? " " + o.cls : "") + "\"" + (o.attrs || "") + ">" +
      "<div class=\"ann-pic\" data-bg=\"" + esc(o.bg || "") + "\">" + (o.pics || o.art || "") + "<span class=\"ann-fake\">annonce inventée</span>" + heart + "</div>" +
      "<div class=\"ann-b\">" + body + "</div></article>";
  }
  root.Annonce = { html: html, euros: euros, vintedIncl: vintedIncl, lbcDate: lbcDate, key: function (pl) { return KEY[pl] || "lbc"; } };
})(typeof globalThis !== "undefined" ? globalThis : this);

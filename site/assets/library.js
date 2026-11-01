/* ==========================================================================
   MASTER-UI-ENGINE — library experience
   Shared behaviour for /library.html, /templates.html and /preview.html.
   Plain ES5 (no arrow functions, no template literals, no async/await) so the
   file runs in the browser exactly as written: there is no build step.

   Everything on these pages comes from one source of truth, the real catalog
   at /engine/showcase/data/component-catalog.json, which the site build copies
   out of showcase/data/. Nothing is hardcoded from assumption: the filter
   options are derived from the items themselves, and a preview is always an
   iframe of the actual /engine/<path> file, never a picture of one.
   ========================================================================== */
(function () {
  "use strict";

  var CATALOG_URL = "/engine/showcase/data/component-catalog.json";
  var GITHUB_BASE = "https://github.com/STEVOHCODER/master-ui-engine/blob/main/";
  var ENGINE_BASE = "/engine/";

  var KIND_LABEL = { COMPONENT: "Component", EXAMPLE: "Example", TEMPLATE: "Template" };
  var KIND_ORDER = ["COMPONENT", "EXAMPLE", "TEMPLATE"];
  var KIND_PARAM = { components: "COMPONENT", examples: "EXAMPLE", templates: "TEMPLATE" };

  /* Framework bindings. The design lives in styles/components.css; a binding is
     markup plus behaviour for one framework over those same classes. Status is
     never inferred here: it is read from frameworks/registry.json through the
     catalog, and an entry with no binding for a framework is absent, not hidden. */
  var FW_ORDER = ["vanilla", "react", "vue", "web-components", "svelte", "angular"];
  var FW_LABEL = {
    vanilla: "HTML/CSS/JS",
    react: "React",
    vue: "Vue",
    "web-components": "Web Components",
    svelte: "Svelte",
    angular: "Angular"
  };
  var FW_LIVE = { stable: "live", experimental: "live", planned: "planned", unsupported: "absent" };

  function bindingList(item) {
    var out = [];
    var table = item && item.frameworks ? item.frameworks : {};
    for (var i = 0; i < FW_ORDER.length; i++) {
      var name = FW_ORDER[i];
      if (name === "vanilla") {
        var base = { status: "stable", source: item.path, preview: item.path };
        var recorded = table.vanilla || {};
        for (var vk in recorded) {
          if (recorded[vk] !== null && recorded[vk] !== undefined) base[vk] = recorded[vk];
        }
        if (!base.source) base.source = item.path;
        if (!base.preview) base.preview = item.path;
        out.push({ name: "vanilla", status: base.status || "stable", binding: base });
        continue;
      }
      if (table[name]) out.push({ name: name, status: String(table[name].status || "unsupported"), binding: table[name] });
    }
    return out;
  }

  function liveBindings(item) {
    var list = bindingList(item);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (FW_LIVE[list[i].status] === "live") out.push(list[i].name);
    }
    return out;
  }

  var THUMB_WIDTH = 1280; /* the iframe viewport the thumbnail is scaled from */
  var THUMB_HEIGHT = 800;

  /* ---- tiny DOM helpers --------------------------------------------------- */
  function $id(x) { return document.getElementById(x); }
  function on(node, type, fn) { if (node) node.addEventListener(type, fn); }

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  /* Text is always set through textContent, never through innerHTML, so the
     prose stored in the catalog can only ever be content, never markup. */
  function icon(paths, size) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size || 16));
    svg.setAttribute("height", String(size || 16));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    for (var i = 0; i < paths.length; i++) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", paths[i]);
      svg.appendChild(p);
    }
    return svg;
  }

  var ICON = {
    shield: ["M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z", "M9 12l2 2 4-4"],
    eye: ["M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z", "M12 15a3 3 0 100-6 3 3 0 000 6z"],
    code: ["M8 6l-5 6 5 6", "M16 6l5 6-5 6"],
    copy: ["M9 9h10v10H9z", "M5 15V5h10"],
    close: ["M6 6l12 12", "M18 6L6 18"]
  };

  /* ---- query string ------------------------------------------------------- */
  function readQuery(search) {
    var out = {}, raw = String(search || "").replace(/^[?#&]/, "");
    if (!raw) return out;
    var parts = raw.split("&");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split("=");
      if (kv.length < 2) continue;
      try {
        out[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1].replace(/\+/g, " "));
      } catch (e) {
        out[kv[0]] = kv[1];
      }
    }
    return out;
  }

  function writeQuery(params) {
    var parts = [];
    for (var k in params) {
      if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
      var v = params[k];
      if (v === "" || v === undefined || v === null || v === "all") continue;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
    var url = location.pathname + (parts.length ? "?" + parts.join("&") : "") + location.hash;
    if (window.history && history.replaceState) history.replaceState(null, "", url);
  }

  /* ---- analytics ---------------------------------------------------------- */
  /* The collector is optional: these pages must work with it, and with it
     missing entirely. Events are only fired on real user actions. */
  function track(name, payload) {
    if (typeof window.mueTrack === "function") {
      try { window.mueTrack(name, payload); } catch (e) { /* never block the UI */ }
    }
  }

  function previewEventFor(item) {
    return item && item.kind === "TEMPLATE" ? "template_preview_open" : "component_preview_open";
  }

  /* ---- catalog ------------------------------------------------------------ */
  var catalogPromise = null;

  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    catalogPromise = new Promise(function (resolve, reject) {
      var req;
      try { req = new XMLHttpRequest(); } catch (e) { req = null; }
      if (req) {
        req.open("GET", CATALOG_URL, true);
        req.withCredentials = false;
        req.onload = function () {
          if (req.status >= 200 && req.status < 300) {
            try { resolve(JSON.parse(req.responseText)); }
            catch (err) { reject(new Error("The catalog at " + CATALOG_URL + " is not valid JSON.")); }
          } else {
            reject(new Error("The catalog could not be loaded (HTTP " + req.status + ")."));
          }
        };
        req.onerror = function () { reject(new Error("The catalog could not be loaded (network error).")); };
        req.send();
        return;
      }
      if (window.fetch) {
        fetch(CATALOG_URL, { credentials: "same-origin" })
          .then(function (r) {
            if (!r.ok) throw new Error("The catalog could not be loaded (HTTP " + r.status + ").");
            return r.json();
          })
          .then(resolve)
          .catch(function (e) { reject(new Error(e && e.message ? e.message : "The catalog could not be loaded.")); });
        return;
      }
      reject(new Error("This browser cannot load the catalog."));
    });
    return catalogPromise;
  }

  function itemsOf(catalog) {
    return catalog && Object.prototype.toString.call(catalog.items) === "[object Array]"
      ? catalog.items : [];
  }

  function byId(catalog, id) {
    var list = itemsOf(catalog);
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i];
    return null;
  }

  /* Deployed URLs are the extension-less form: Vercel's cleanUrls 308s every
     /engine/**.html to the same path without it, and a URL we hand a crawler
     that costs a redirect shows up in Search Console as a "Redirect page"
     instead of the page itself. Relative asset paths still resolve, because
     the directory half of the URL is unchanged. */
  function engineUrl(item) { return ENGINE_BASE + String(item.path || "").replace(/\.html$/i, ""); }
  function githubUrl(item) { return GITHUB_BASE + String(item.path || ""); }

  function kindLabel(item) {
    return KIND_LABEL[item.kind] || (item.group ? String(item.group) : String(item.kind || "Item"));
  }

  function listText(value, limit) {
    if (!value || !value.length) return "";
    var out = [];
    for (var i = 0; i < value.length && i < (limit || value.length); i++) out.push(String(value[i]));
    return out.join(", ");
  }

  /* Filter values are collected from the data, sorted, and de-duplicated. */
  function facet(items, key) {
    var seen = {}, out = [];
    for (var i = 0; i < items.length; i++) {
      var v = items[i][key];
      if (v === undefined || v === null || v === "") continue;
      v = String(v);
      if (!seen[v]) { seen[v] = 1; out.push(v); }
    }
    out.sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0; });
    return out;
  }

  function kindsPresent(items) {
    var out = [];
    for (var i = 0; i < KIND_ORDER.length; i++) {
      var k = KIND_ORDER[i], found = false;
      for (var j = 0; j < items.length; j++) if (items[j].kind === k) { found = true; break; }
      if (found) out.push(k);
    }
    for (var m = 0; m < items.length; m++) {
      if (out.indexOf(items[m].kind) === -1 && items[m].kind) out.push(items[m].kind);
    }
    return out;
  }

  /* Searchable blob per item: name, id, category, summary, variants and the
     assurance prose the catalog stores in `verified` and `theming`. */
  function haystack(item) {
    return [
      item.name, item.id, item.category, item.group, item.kind, item.summary,
      item.framework, item.designSystem, item.path, item.license,
      listText(item.variants, 40), listText(item.breakpoints, 40),
      item.theming, item.verified,
      Object.keys(item.frameworks || {}).join(" "), item.supportMatrix || ""
    ].join(" ").toLowerCase();
  }

  /* ---- clipboard ---------------------------------------------------------- */
  /* Returns a promise of true/false. Nothing on these pages may claim a copy
     that did not actually happen, so the caller only celebrates `true`. */
  function writeClipboard(text) {
    if (window.MUE && typeof window.MUE.writeClipboard === "function") {
      try {
        var r = window.MUE.writeClipboard(text);
        if (r && typeof r.then === "function") return r;
      } catch (e) { /* fall through to the local paths */ }
    }
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-9999px;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      ta.parentNode.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  /* Fetch the real file out of /engine and put it on the clipboard. */
  function copyFile(path, item, done, noun) {
    var url = ENGINE_BASE + String(path);
    var req;
    try { req = new XMLHttpRequest(); } catch (e) { req = null; }

    function finish(result) { done(result); }

    function handle(text) {
      writeClipboard(text).then(function (ok) {
        if (!ok) {
          finish({ ok: false, stage: "clipboard", text: "The file was fetched, but your browser blocked the clipboard. Select the source on GitHub and copy it from there." });
          return;
        }
        track("copy_code", { id: String(item.id), target: String(path) });
        finish({ ok: true, stage: "copied", text: "Copied " + characterCount(text) + " of " + noun + "." });
      }, function () {
        finish({ ok: false, stage: "clipboard", text: "The file was fetched, but your browser blocked the clipboard." });
      });
    }

    if (req) {
      req.open("GET", url, true);
      req.onload = function () {
        if (req.status >= 200 && req.status < 300) handle(req.responseText);
        else finish({ ok: false, stage: "fetch", text: "Could not fetch " + url + " (HTTP " + req.status + "). Nothing was copied." });
      };
      req.onerror = function () {
        finish({ ok: false, stage: "fetch", text: "Could not fetch " + url + " (network error). Nothing was copied." });
      };
      req.send();
      return;
    }
    if (window.fetch) {
      fetch(url, { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(handle)
        .catch(function (e) {
          finish({ ok: false, stage: "fetch", text: "Could not fetch " + url + " (" + (e && e.message ? e.message : "error") + "). Nothing was copied." });
        });
      return;
    }
    finish({ ok: false, stage: "fetch", text: "This browser cannot fetch the file. Nothing was copied." });
  }

  function copyMarkup(item, done) { copyFile(item.path, item, done, "markup"); }

  function characterCount(text) {
    var n = String(text).length;
    return n >= 1000 ? (Math.round(n / 100) / 10) + "k chars" : n + " chars";
  }

  /* Copy button + its own visible confirmation, shared by all three pages. */
  function copyControl(item, cls) {
    var wrap = make("span", (cls || "lib-copy"));
    var btn = make("button", "lib-btn lib-btn-ghost");
    btn.type = "button";
    btn.appendChild(icon(ICON.copy, 15));
    btn.appendChild(make("span", null, "Copy markup"));
    var note = make("span", "lib-copy-note");
    note.setAttribute("role", "status");
    wrap.appendChild(btn);
    wrap.appendChild(note);

    on(btn, "click", function () {
      if (btn.disabled) return;
      btn.disabled = true;
      note.className = "lib-copy-note is-busy";
      note.textContent = "Loading " + item.path + " …";
      copyMarkup(item, function (res) {
        btn.disabled = false;
        note.className = "lib-copy-note " + (res.ok ? "is-ok" : "is-fail");
        note.textContent = res.text;
        if (res.ok) {
          btn.className = "lib-btn lib-btn-ghost is-done";
          window.setTimeout(function () {
            btn.className = "lib-btn lib-btn-ghost";
          }, 2000);
        }
      });
    });
    return wrap;
  }

  /* ---- shared card pieces -------------------------------------------------- */
  function chip(text, cls) { return make("span", cls || "lib-chip", text); }

  function metaLine(label, value, cls) {
    var line = make("p", cls || "lib-meta");
    line.appendChild(make("span", "lib-meta-key", label));
    line.appendChild(make("span", "lib-meta-val", value));
    return line;
  }

  function assuranceLine(item, cls) {
    var line = make("p", cls || "lib-verified");
    line.appendChild(icon(ICON.shield, 15));
    line.appendChild(make("span", null, item.verified ? String(item.verified) : "No verification note in the catalog for this entry."));
    return line;
  }

  function variantList(item, limit) {
    var box = make("div", "lib-variants");
    var list = item.variants || [];
    if (!list.length) {
      box.appendChild(make("span", "lib-variants-none", "No variants listed in the catalog"));
      return box;
    }
    var shown = list.length > (limit || 6) ? list.slice(0, limit || 6) : list;
    for (var i = 0; i < shown.length; i++) box.appendChild(chip(String(shown[i]), "lib-chip lib-chip-variant"));
    if (list.length > shown.length) box.appendChild(chip("+" + (list.length - shown.length) + " more", "lib-chip lib-chip-more"));
    return box;
  }

  /* Description for the template/example grid. A catalog summary wins when the
     entry has one; otherwise the sentence is built only from fields the catalog
     really holds: group, kind, category, variants, breakpoints, theming. No
     invented marketing prose. */
  function dataDescription(item) {
    var parts = [];
    var v = item.variants || [], b = item.breakpoints || [];
    parts.push(
      item.summary
        ? String(item.summary)
        : v.length
          ? v.length + (v.length === 1 ? " variant" : " variants") + " listed in the catalog: " + listText(v, 4) + (v.length > 4 ? "…" : ".")
          : "No variants are listed in the catalog for this entry."
    );
    parts.push(
      b.length
        ? "Breakpoints noted in the catalog: " + listText(b, 3) + (b.length > 3 ? "…" : ".")
        : "No breakpoint notes in the catalog."
    );
    parts.push("Theming: " + (item.theming ? String(item.theming) : "not recorded in the catalog") + ".");
    return parts.join(" ");
  }

  /* Which frameworks this entry exists in, straight from the registry-backed
     catalog. A binding that is planned is labelled planned — the chip never
     implies a file that is not in the repository. */
  function frameworkChips(item) {
    var list = bindingList(item);
    if (list.length < 2) return null;
    var box = make("div", "lib-fw");
    for (var i = 0; i < list.length; i++) {
      var entry = list[i];
      var state = FW_LIVE[entry.status] || "absent";
      var label = FW_LABEL[entry.name] + " · " + entry.status;
      box.appendChild(chip(label, "lib-chip lib-chip-fw is-" + state));
    }
    return box;
  }

  function techChips(item) {
    var box = make("div", "lib-tech");
    if (item.framework) box.appendChild(chip(String(item.framework), "lib-chip lib-chip-tech"));
    if (item.designSystem) box.appendChild(chip(String(item.designSystem) + " design system", "lib-chip lib-chip-tech"));
    if (item.tokens) box.appendChild(chip(String(item.tokens), "lib-chip lib-chip-mono"));
    box.appendChild(chip(String(item.license || "MIT"), "lib-chip lib-chip-tech"));
    return box;
  }

  function actionsRow(item, opts) {
    var row = make("div", (opts && opts.cls) || "lib-actions");

    var prev = make("a", "lib-btn lib-btn-solid");
    prev.href = "/preview?id=" + encodeURIComponent(item.id);
    prev.appendChild(icon(ICON.eye, 15));
    prev.appendChild(make("span", null, (opts && opts.previewLabel) || "Open preview"));
    on(prev, "click", function () { track(previewEventFor(item), { id: String(item.id) }); });
    row.appendChild(prev);

    var src = make("a", "lib-btn lib-btn-ghost");
    src.href = githubUrl(item);
    src.target = "_blank";
    src.rel = "noreferrer";
    src.appendChild(icon(ICON.code, 15));
    src.appendChild(make("span", null, "View source"));
    row.appendChild(src);

    row.appendChild(copyControl(item));
    return row;
  }

  /* ---- thumbnail frames ---------------------------------------------------- */
  /* A scaled live iframe, not a screenshot: the real page renders into a 1280px
     viewport and CSS transform shrinks it into the fixed 16:10 frame web.css
     already reserves (.tpl-shot), so nothing shifts when the preview loads. */
  function thumbFrame(item, lazy) {
    var doc = document.createElement("iframe");
    /* Cards below the fold stay unloaded until the browser reaches them, so 21
       live pages do not all load at once. */
    if (lazy) doc.setAttribute("data-src", engineUrl(item));
    else doc.setAttribute("src", engineUrl(item));
    doc.setAttribute("loading", "lazy");
    doc.setAttribute("tabindex", "-1");
    doc.setAttribute("scrolling", "no");
    doc.setAttribute("title", String(item.name) + " live preview");
    return doc;
  }

  var thumbObserver = null;
  function watchThumbs(root) {
    var nodes = root.querySelectorAll("iframe[data-src]");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].setAttribute("src", nodes[i].getAttribute("data-src"));
        nodes[i].removeAttribute("data-src");
      }
      scheduleFit();
      return;
    }
    if (!thumbObserver) {
      thumbObserver = new IntersectionObserver(function (entries, obs) {
        for (var e = 0; e < entries.length; e++) {
          var node = entries[e].target;
          if (!entries[e].isIntersecting) continue;
          node.setAttribute("src", node.getAttribute("data-src"));
          node.removeAttribute("data-src");
          obs.unobserve(node);
          scheduleFit();
        }
      }, { rootMargin: "320px 0px" });
    }
    for (var n = 0; n < nodes.length; n++) thumbObserver.observe(nodes[n]);
  }

  /* Scale = frame width / 1280, which lands the shrunken 1280x800 viewport
     exactly inside the 16:10 box the shell already reserves for it. */
  function fitThumbs() {
    var shots = document.querySelectorAll(".tpl-shot");
    for (var i = 0; i < shots.length; i++) {
      var shot = shots[i], w = shot.clientWidth || 0;
      var child = shot.querySelector("iframe");
      if (!w || !child) continue;
      child.style.transform = "scale(" + (w / THUMB_WIDTH) + ")";
    }
  }

  var fitQueued = false;
  function scheduleFit() {
    if (fitQueued) return;
    fitQueued = true;
    (window.requestAnimationFrame || function (fn) { window.setTimeout(fn, 60); })(function () {
      fitQueued = false;
      fitThumbs();
    });
  }

  /* ---- page: library ------------------------------------------------------- */
  function initLibrary(catalog) {
    var items = itemsOf(catalog);
    var grid = $id("lib-grid");
    var empty = $id("lib-empty");
    var count = $id("lib-count");
    var error = $id("lib-error");
    var search = $id("lib-search");
    var kindSel = $id("lib-kind");
    var catSel = $id("lib-category");
    var fwSel = $id("lib-framework");
    var clear = $id("lib-clear");
    var live = $id("lib-live");
    if (!grid) return;

    if (error) error.hidden = true;

    /* Build the facets from the data. */
    var kinds = kindsPresent(items);
    var cats = facet(items, "category");
    var fwCounts = {};
    for (var f = 0; f < items.length; f++) {
      var live = liveBindings(items[f]);
      for (var g = 0; g < live.length; g++) fwCounts[live[g]] = (fwCounts[live[g]] || 0) + 1;
    }
    var fws = [];
    for (var h = 0; h < FW_ORDER.length; h++) if (fwCounts[FW_ORDER[h]]) fws.push(FW_ORDER[h]);

    function fillOptions(sel, values, labelFn) {
      for (var i = 0; i < values.length; i++) {
        var o = document.createElement("option");
        o.value = values[i];
        o.textContent = labelFn ? labelFn(values[i]) : values[i];
        sel.appendChild(o);
      }
    }

    fillOptions(kindSel, kinds, function (k) {
      var n = 0;
      for (var i = 0; i < items.length; i++) if (items[i].kind === k) n++;
      return (KIND_LABEL[k] || k) + " (" + n + ")";
    });
    fillOptions(catSel, cats);
    fillOptions(fwSel, fws, function (n) { return FW_LABEL[n] + " (" + fwCounts[n] + ")"; });

    var summary = $id("lib-summary");
    if (summary) {
      var bits = [];
      var ported = 0;
      for (var s = 0; s < kinds.length; s++) {
        var n = 0;
        for (var t = 0; t < items.length; t++) if (items[t].kind === kinds[s]) n++;
        bits.push(n + " " + (KIND_LABEL[kinds[s]] || String(kinds[s])).toLowerCase());
      }
      for (var p = 0; p < items.length; p++) if (liveBindings(items[p]).length > 1) ported++;
      var names = fws.slice(1).map(function (name) { return FW_LABEL[name]; });
      var joined = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
      var portNote = fws.length > 1
        ? " " + ported + (ported === 1 ? " of them is also shipped" : " of them are also shipped") + " as " + joined + " components over the same stylesheet."
        : " Every entry is HTML/CSS/JS with no build step.";
      summary.textContent = items.length + " catalogued entries — " + bits.join(", ") + "." + portNote +
        " The cards, the filters and these counts come from showcase/data/component-catalog.json" +
        (catalog.generated ? " (generated " + catalog.generated + ")" : "") +
        ", so they cannot drift away from the files they preview.";
    }

    /* A facet with a single value across the whole catalog is not a choice, so
       it is shown disabled and explained instead of pretending to filter. */
    function markSingle(sel, values, noun) {
      if (values.length > 1) return;
      sel.disabled = true;
      var hint = sel.parentNode.querySelector(".lib-facet-hint");
      if (!hint) {
        hint = make("span", "lib-facet-hint");
        sel.parentNode.appendChild(hint);
      }
      hint.textContent = "Every catalogued " + noun + " is " + (FW_LABEL[values[0]] || values[0] || "—") + ", so there is nothing to narrow.";
    }
    markSingle(catSel, cats, "entry");
    markSingle(fwSel, fws, "entry");

    var query = readQuery(location.search);

    /* Deep links: ?kind=templates / components / examples (case-insensitive),
       or the raw catalog value. Anything the catalog does not hold falls back
       to "all" and is reported to the visitor rather than ignored. */
    function parseKind(raw) {
      if (typeof raw !== "string" || !raw) return "all";
      var lower = raw.toLowerCase();
      if (lower === "all") return "all";
      var mapped = KIND_PARAM[lower] || raw.toUpperCase();
      return kinds.indexOf(mapped) > -1 ? mapped : lower;
    }

    var state = {
      q: typeof query.q === "string" ? query.q : "",
      kind: parseKind(query.kind),
      category: typeof query.category === "string" ? query.category : "all",
      framework: typeof query.framework === "string" ? query.framework : "all"
    };
    if (search) search.value = state.q;
    if (kindSel) kindSel.value = state.kind;
    if (catSel) catSel.value = state.category;
    if (fwSel) fwSel.value = state.framework;

    /* A category that does not exist in the data must not silently render an
       empty grid with no explanation. */
    function unknownFacet(param, values, sel) {
      if (!param || param === "all") return null;
      for (var i = 0; i < values.length; i++) if (values[i].toLowerCase() === String(param).toLowerCase()) return null;
      sel.value = "all";
      return param;
    }
    var rejected = [];
    var badCat = unknownFacet(state.category, cats, catSel); if (badCat) { state.category = "all"; rejected.push("category=" + badCat); }
    var badFw = unknownFacet(state.framework, fws, fwSel); if (badFw) { state.framework = "all"; rejected.push("framework=" + badFw); }
    if (state.kind !== "all" && kinds.indexOf(state.kind) === -1) {
      rejected.push("kind=" + state.kind.toLowerCase());
      state.kind = "all";
      if (kindSel) kindSel.value = "all";
    }

    var notice = $id("lib-notice");
    if (notice) {
      if (rejected.length) {
        notice.hidden = false;
        notice.textContent = "That link asked for " + rejected.join(", ") + ", which the catalog does not contain. Showing everything else that matches instead.";
      } else {
        notice.hidden = true;
      }
    }

    function matches(item) {
      if (state.kind !== "all" && item.kind !== state.kind) return false;
      if (state.category !== "all" && String(item.category || "").toLowerCase() !== state.category.toLowerCase()) return false;
      if (state.framework !== "all" && liveBindings(item).indexOf(state.framework) === -1) return false;
      if (state.q) {
        var words = state.q.toLowerCase().split(/\s+/);
        var hay = haystack(item);
        for (var i = 0; i < words.length; i++) {
          if (!words[i]) continue;
          if (hay.indexOf(words[i]) === -1) return false;
        }
      }
      return true;
    }

    function card(item) {
      var box = make("article", "lib-card");
      box.setAttribute("data-kind", String(item.kind));

      var top = make("div", "lib-card-top");
      top.appendChild(chip(kindLabel(item), "lib-chip lib-chip-kind lib-chip-" + String(item.kind).toLowerCase()));
      if (item.category) top.appendChild(chip(String(item.category), "lib-chip lib-chip-cat"));
      if (item.engineLinked === true) top.appendChild(chip("engine-linked", "lib-chip lib-chip-flag"));
      box.appendChild(top);

      var title = make("h3", "lib-card-name");
      var link = make("a", null, String(item.name));
      link.href = "/preview?id=" + encodeURIComponent(item.id);
      on(link, "click", function () { track(previewEventFor(item), { id: String(item.id) }); });
      title.appendChild(link);
      box.appendChild(title);

      box.appendChild(metaLine("id", String(item.id)));
      box.appendChild(metaLine("file", String(item.path), "lib-meta lib-meta-mono"));
      box.appendChild(variantList(item, 6));
      var fw = frameworkChips(item);
      if (fw) box.appendChild(fw);
      box.appendChild(assuranceLine(item));
      box.appendChild(actionsRow(item));
      return box;
    }

    function render() {
      var shown = [];
      for (var i = 0; i < items.length; i++) if (matches(items[i])) shown.push(items[i]);

      grid.textContent = "";
      for (var j = 0; j < shown.length; j++) grid.appendChild(card(shown[j]));

      if (count) {
        count.textContent = shown.length === items.length
          ? "All " + items.length + " catalogued entries"
          : shown.length + " of " + items.length + " catalogued entries";
      }
      if (empty) empty.hidden = shown.length !== 0;
      if (live) {
        live.textContent = "Showing " + shown.length + " of " + items.length + " entries.";
      }
      writeQuery({ q: state.q, kind: state.kind, category: state.category, framework: state.framework });
      scheduleFit();
    }

    var searchTimer = null;
    function onSearch() {
      state.q = search.value;
      render();
      if (searchTimer) window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(function () {
        var q = state.q.trim();
        if (q) track("library_search", { id: q.slice(0, 64) });
      }, 700);
    }

    on(search, "input", onSearch);
    on(search, "search", onSearch); /* clears via the native × button */
    on(kindSel, "change", function () { state.kind = kindSel.value; render(); });
    on(catSel, "change", function () { state.category = catSel.value; render(); });
    on(fwSel, "change", function () { state.framework = fwSel.value; render(); });

    on(clear, "click", function () {
      state.q = ""; state.kind = "all"; state.category = "all"; state.framework = "all";
      if (search) search.value = "";
      if (kindSel) kindSel.value = "all";
      if (catSel) catSel.value = "all";
      if (fwSel) fwSel.value = "all";
      render();
      if (search) search.focus();
    });

    var form = $id("lib-filters");
    if (form) on(form, "submit", function (e) { e.preventDefault(); render(); });

    render();
  }

  /* ---- page: templates ----------------------------------------------------- */
  /* Card anatomy comes from the shell: .tpl-card > .tpl-shot (the live,
     scaled iframe) + .tpl-body (facts) + .tpl-foot (the actions). */
  function templateCard(item, eager) {
    var box = make("article", "tpl-card");

    var shot = make("a", "tpl-shot");
    shot.href = "/preview?id=" + encodeURIComponent(item.id);
    shot.setAttribute("aria-label", "Open the live preview of " + item.name);
    shot.appendChild(thumbFrame(item, !eager));
    on(shot, "click", function () { track(previewEventFor(item), { id: String(item.id) }); });
    box.appendChild(shot);

    var body = make("div", "tpl-body");

    var head = make("div", "tpl-entry-head");
    head.appendChild(chip(kindLabel(item), "lib-chip lib-chip-kind lib-chip-" + String(item.kind).toLowerCase()));
    if (item.category) head.appendChild(chip(String(item.category), "lib-chip lib-chip-cat"));
    body.appendChild(head);

    body.appendChild(make("h3", "tpl-card-name", String(item.name)));
    body.appendChild(make("p", "tpl-card-desc", dataDescription(item)));
    body.appendChild(techChips(item));
    body.appendChild(metaLine("file", String(item.path), "lib-meta lib-meta-mono"));
    if (item.variants && item.variants.length) body.appendChild(variantList(item, 4));
    body.appendChild(assuranceLine(item, "lib-verified tpl-card-verified"));

    var foot = make("div", "tpl-foot");
    foot.appendChild(actionsRow(item, { previewLabel: "Full preview", cls: "tpl-foot-actions lib-actions" }));
    body.appendChild(foot);

    box.appendChild(body);
    return box;
  }

  function gridSection(title, copy, list, eagerCount) {
    var wrap = make("section", "tpl-block");
    wrap.appendChild(make("h2", "tpl-block-title", title));
    wrap.appendChild(make("p", "tpl-block-copy", copy));
    wrap.appendChild(make("p", "tpl-block-count", list.length + " " + (list.length === 1 ? "entry" : "entries") + " in this group, taken from the catalog."));

    if (!list.length) {
      wrap.appendChild(make("p", "tpl-empty", "The catalog has no entries of this kind."));
      return wrap;
    }

    var grid = make("div", "tpl-grid");
    for (var i = 0; i < list.length; i++) {
      grid.appendChild(templateCard(list[i], i < (eagerCount || 0)));
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function initTemplates(catalog) {
    var root = $id("tpl-root");
    if (!root) return;
    var items = itemsOf(catalog);
    var templates = [], examples = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === "TEMPLATE") templates.push(items[i]);
      else if (items[i].kind === "EXAMPLE") examples.push(items[i]);
    }
    var total = itemsOf(catalog).length;
    var head = $id("tpl-summary");
    if (head) {
      head.textContent = "Templates (" + templates.length + ") and examples (" + examples.length +
        ") out of " + total + " catalogued entries. Every thumbnail below is the real file running in an iframe — " +
        "not a screenshot — scaled down into a fixed-aspect frame, so what you see is what the browser actually renders.";
    }
    root.textContent = "";
    root.appendChild(gridSection("Templates — full starting points", "A template is a complete page: its own shell, navigation and content, wired to the same token file as every component. Open one, read its source, copy what you need.", templates, 6));
    root.appendChild(gridSection("Examples — single-screen builds", "An example is a smaller, self-contained screen built from the library. Use it when a whole template is more than you need.", examples, 2));

    var note = $id("tpl-note");
    if (note) note.hidden = false;

    watchThumbs(root);
    fitThumbs();
    if (window.ResizeObserver) {
      try {
        var ro = new ResizeObserver(scheduleFit);
        var shots = document.querySelectorAll(".tpl-shot");
        for (var f = 0; f < shots.length; f++) ro.observe(shots[f]);
      } catch (e) { /* older engines: the resize listener below still works */ }
    }
    window.addEventListener("resize", scheduleFit);
  }

  /* ---- page: preview ------------------------------------------------------- */
  /* Emulating a viewport inside the shell's fixed-height stage: a device
     narrower than the stage is drawn at its true width, one wider is scaled
     down so the whole width stays visible instead of pretending to be another
     size. Same approach the homepage live frame uses. */
  function fitFrame(view, stage, width) {
    if (!view || !stage) return null;
    var avail = stage.clientWidth;
    var height = stage.clientHeight;
    if (!avail || !height) return null;
    var wanted = width && width > 0 ? width : avail;
    if (wanted >= avail) {
      var k = avail / wanted;
      view.style.width = wanted + "px";
      view.style.height = Math.round(height / k) + "px";
      view.style.transform = "scale(" + k + ")";
      view.style.left = "0";
      return { width: wanted, fitted: wanted > avail };
    }
    view.style.width = wanted + "px";
    view.style.height = height + "px";
    view.style.transform = "none";
    view.style.left = Math.max(0, Math.round((avail - wanted) / 2)) + "px";
    return { width: wanted, fitted: false };
  }

  function initPreview(catalog) {
    var block = $id("pv-block");
    var stage = $id("pv-stage");
    var iframe = $id("pv-iframe");
    var missing = $id("pv-missing");
    if (!block || !stage || !iframe) return;

    var query = readQuery(location.search);
    var item = byId(catalog, query.id);

    if (!item) {
      block.hidden = true;
      if (missing) {
        missing.hidden = false;
        var target = $id("pv-missing-id");
        if (target) target.textContent = query.id ? String(query.id) : "(no id given)";
        var list = $id("pv-missing-list");
        if (list) {
          var ids = itemsOf(catalog);
          list.textContent = "";
          for (var i = 0; i < ids.length; i++) {
            var a = make("a", "pv-suggest", String(ids[i].name) + " — " + String(ids[i].id));
            a.href = "/preview?id=" + encodeURIComponent(ids[i].id);
            list.appendChild(a);
          }
        }
      }
      return;
    }
    if (missing) missing.hidden = true;
    block.hidden = false;

    document.title = String(item.name) + " — live preview | MASTER-UI-ENGINE";
    var desc = $id("pv-desc-meta");
    if (desc) {
      desc.setAttribute("content", "Live preview of " + item.name + ", a " +
        kindLabel(item).toLowerCase() + " (" + String(item.category || "uncategorised") +
        ") running from its real file in MASTER-UI-ENGINE.");
    }

    $id("pv-name").textContent = String(item.name);
    var chips = $id("pv-chips");
    chips.appendChild(chip(kindLabel(item), "lib-chip lib-chip-kind lib-chip-" + String(item.kind).toLowerCase()));
    if (item.category) chips.appendChild(chip(String(item.category), "lib-chip lib-chip-cat"));
    if (item.framework) chips.appendChild(chip(String(item.framework), "lib-chip lib-chip-tech"));
    if (item.designSystem) chips.appendChild(chip(String(item.designSystem) + " design system", "lib-chip lib-chip-tech"));
    chips.appendChild(chip(listText(item.breakpoints, 3) ? "breakpoints " + listText(item.breakpoints, 3) : "no breakpoint notes in the catalog", "lib-chip lib-chip-mono"));

    var verified = $id("pv-verified");
    verified.textContent = "";
    verified.appendChild(icon(ICON.shield, 15));
    verified.appendChild(make("span", null, item.verified ? String(item.verified) : "No verification note in the catalog for this entry."));

    var summary = $id("pv-summary");
    if (summary) {
      if (item.summary) { summary.textContent = String(item.summary); summary.hidden = false; }
      else { summary.textContent = ""; summary.hidden = true; }
    }

    var variants = $id("pv-variants");
    var vlist = item.variants || [];
    var vlabel = $id("pv-variants-label");
    if (vlabel) vlabel.hidden = !vlist.length;
    variants.textContent = "";
    if (!vlist.length) {
      variants.appendChild(make("span", "lib-variants-none", "This is one composition, not a variant set — the page itself is the resource."));
    } else {
      for (var v = 0; v < vlist.length; v++) variants.appendChild(chip(String(vlist[v]), "lib-chip lib-chip-variant"));
    }

    var src = $id("pv-source");
    src.href = githubUrl(item);
    src.target = "_blank";
    src.rel = "noreferrer";

    var openNew = $id("pv-opentab");
    if (openNew) openNew.href = engineUrl(item);

    var urlEl = $id("pv-url");
    if (urlEl) urlEl.textContent = engineUrl(item);

    iframe.setAttribute("src", engineUrl(item));
    iframe.setAttribute("title", "Live preview: " + String(item.name));
    track(previewEventFor(item), { id: String(item.id) });

    /* Install instruction: the real CLI command for this entry, copied as text. */
    var installBox = $id("pv-install");
    var installCmd = $id("pv-install-cmd");
    var installCopy = $id("pv-install-copy");
    var installNote = $id("pv-install-note");
    if (installBox && installCmd) {
      installCmd.textContent = "node tools/mue.js add " + String(item.id) + " --into ../your-app";
      installBox.hidden = false;
      if (installNote) {
        installNote.textContent = item.engineLinked
          ? "Copies this file plus the token and component layers it links, so it renders the same way in your project as it does here. Run it from a clone of the repository."
          : "This page is self-contained, so the command copies the file alone and pulls in no shared layers. Run it from a clone of the repository.";
      }
      if (installCopy && installCopy.getAttribute("data-bound") !== "1") {
        installCopy.setAttribute("data-bound", "1");
        installCopy.addEventListener("click", function () {
          var text = installCmd.textContent;
          var label = installCopy.textContent;
          installCopy.disabled = true;
          installCopy.textContent = "Copying…";
          writeClipboard(text).then(function (ok) {
            installCopy.disabled = false;
            installCopy.textContent = ok ? "Copied" : label;
            if (ok) track("install_instruction_open", { id: String(item.id) });
            setTimeout(function () { installCopy.textContent = label; }, 2200);
          });
        });
      }
    }

    /* Device-width switch: the buttons live in the page markup (the shell
       already styles .frame-tabs [data-width]) and this really changes the
       width given to the iframe. */
    var controls = $id("pv-controls");
    var sizeEl = $id("pv-size");
    var widths = controls.querySelectorAll("[data-width]");
    var currentWidth = 375;

    function paintWidth() {
      var used = fitFrame(iframe, stage, currentWidth);
      if (!sizeEl) return;
      if (!used) { sizeEl.textContent = "measuring…"; return; }
      sizeEl.textContent = used.width + " px" +
        (currentWidth === 0 ? " (full stage)" : used.fitted ? " (scaled to fit)" : "");
    }

    function selectWidth(btn) {
      for (var w = 0; w < widths.length; w++) {
        widths[w].setAttribute("aria-pressed", String(widths[w] === btn));
      }
      var raw = btn.getAttribute("data-width");
      currentWidth = raw === "full" ? 0 : parseInt(raw, 10) || 0;
      paintWidth();
    }

    for (var d = 0; d < widths.length; d++) {
      (function (btn) { on(btn, "click", function () { selectWidth(btn); }); })(widths[d]);
    }

    /* Theme switch: the frame is same-origin, so html.dark is reachable on its
       own document — the same class the preview file toggles for itself. If the
       document is not reachable, the page says so instead of claiming success. */
    var themeBtns = controls.querySelectorAll("[data-frame-theme]");
    var note = $id("pv-note");

    function frameDoc() {
      try {
        return iframe.contentDocument || (iframe.contentWindow ? iframe.contentWindow.document : null);
      } catch (e) {
        return null;
      }
    }

    function markTheme(isDark) {
      for (var t = 0; t < themeBtns.length; t++) {
        var wantsDark = themeBtns[t].getAttribute("data-frame-theme") === "dark";
        themeBtns[t].setAttribute("aria-pressed", String(wantsDark === isDark));
      }
    }

    function setTheme(dark) {
      var doc = frameDoc();
      var applied = false;
      if (doc && doc.documentElement) {
        try {
          if (doc.documentElement.classList) {
            if (dark) doc.documentElement.classList.add("dark");
            else doc.documentElement.classList.remove("dark");
          } else {
            var cls = String(doc.documentElement.getAttribute("class") || "").replace(/(^|\s)dark(\s|$)/g, " ").trim();
            doc.documentElement.setAttribute("class", dark ? (cls + " dark").trim() : cls);
          }
          applied = true;
        } catch (e) {
          applied = false;
        }
      }
      if (applied) markTheme(dark);
      if (note) {
        note.textContent = applied
          ? "html.dark is now " + (dark ? "set on" : "removed from") + " the preview document itself, the same switch that preview file uses on its own, so the tokens inside the frame are the ones really doing the work."
          : "This frame's document is not reachable from the page, so its theme cannot be switched here. The preview still loads in whatever theme this browser has stored.";
      }
    }

    for (var b = 0; b < themeBtns.length; b++) {
      (function (btn) {
        on(btn, "click", function () { setTheme(btn.getAttribute("data-frame-theme") === "dark"); });
      })(themeBtns[b]);
    }

    var presetSelect = $id("pv-theme-preset");
    var preset = "default";
    try { preset = localStorage.getItem("mue-theme-name") || "default"; } catch (e) {}
    if (presetSelect) {
      presetSelect.value = preset;
      presetSelect.disabled = !item.engineLinked;
      if (!item.engineLinked) presetSelect.title = "This self-contained preview does not use the shared theme tokens";
      on(presetSelect, "change", function () {
        preset = presetSelect.value;
        try { localStorage.setItem("mue-theme-name", preset); } catch (e) {}
        var doc = frameDoc();
        if (doc && doc.documentElement) {
          if (preset === "default") doc.documentElement.removeAttribute("data-mue-theme");
          else doc.documentElement.setAttribute("data-mue-theme", preset);
        }
      });
    }

    iframe.addEventListener("load", function () {
      paintWidth();
      var doc = frameDoc();
      var isDark = !!(doc && doc.documentElement &&
        /(^|\s)dark(\s|$)/.test(String(doc.documentElement.getAttribute("class") || "")));
      markTheme(isDark);
      if (doc && doc.documentElement && item.engineLinked) {
        if (preset === "default") doc.documentElement.removeAttribute("data-mue-theme");
        else doc.documentElement.setAttribute("data-mue-theme", preset);
      }
    });

    /* ---- framework bindings -------------------------------------------------
       One resource, several houses. The tabs are built from the registry-backed
       catalog, so a framework appears only when the repository really holds it;
       a planned port is labelled planned and renders no frame. */
    var fwBox = $id("pv-fw");
    var fwTabs = $id("pv-fw-tabs");
    var fwBody = $id("pv-fw-body");
    var fwNote = $id("pv-fw-note");
    var stageWrap = $id("pv-stage-wrap");
    var bindings = bindingList(item);

    function factLine(label, value, mono) {
      if (!value) return null;
      var line = make("p", "pv-fw-fact");
      line.appendChild(make("span", "lib-meta-key", label));
      line.appendChild(make("span", mono ? "lib-meta-val mono" : "lib-meta-val", String(value)));
      return line;
    }

    function copyButton(label, path, noun) {
      var btn = make("button", "lib-btn lib-btn-ghost");
      btn.type = "button";
      var note = make("span", "lib-copy-note");
      note.setAttribute("role", "status");
      btn.appendChild(make("span", null, label));
      on(btn, "click", function () {
        btn.disabled = true;
        note.textContent = "Loading " + path + " …";
        copyFile(path, item, function (res) {
          btn.disabled = false;
          note.className = "lib-copy-note " + (res.ok ? "is-ok" : "is-fail");
          note.textContent = res.text;
        }, noun);
      });
      var wrap = make("span", "pv-fw-copy");
      wrap.appendChild(btn);
      wrap.appendChild(note);
      return wrap;
    }

    function plainCopyButton(label, text) {
      var btn = make("button", "lib-btn lib-btn-ghost");
      btn.type = "button";
      var note = make("span", "lib-copy-note");
      note.setAttribute("role", "status");
      btn.appendChild(make("span", null, label));
      on(btn, "click", function () {
        writeClipboard(text).then(function (ok) {
          note.className = "lib-copy-note " + (ok ? "is-ok" : "is-fail");
          note.textContent = ok ? "Copied." : "Your browser blocked the clipboard — select the line and copy it by hand.";
          if (ok) track("copy_code", { id: String(item.id), target: "install:" + text });
        });
      });
      var wrap = make("span", "pv-fw-copy");
      wrap.appendChild(btn);
      wrap.appendChild(note);
      return wrap;
    }

    function showFrame(url, title) {
      if (stageWrap) stageWrap.hidden = false;
      iframe.setAttribute("src", url);
      iframe.setAttribute("title", title);
      if (urlEl) urlEl.textContent = url;
      if (openNew) openNew.href = url;
    }

    function selectBinding(entry, counted) {
      for (var t = 0; t < fwTabs.children.length; t++) {
        var tab = fwTabs.children[t];
        var isOn = tab.getAttribute("data-fw") === entry.name;
        tab.setAttribute("aria-selected", String(isOn));
        tab.tabIndex = isOn ? 0 : -1;
      }
      fwBody.textContent = "";
      fwNote.textContent = "";

      var binding = entry.binding || {};
      var state = FW_LIVE[entry.status] || "absent";

      if (entry.name !== "vanilla") {
        fwBody.appendChild(factLine("status", entry.status + " — " + (state === "live" ? "the frame below renders this binding" : "no binding in the repository yet")));
      }
      if (binding.package) fwBody.appendChild(factLine("package", binding.package, true));
      if (binding.install) {
        fwBody.appendChild(factLine("install", binding.install, true));
        fwBody.appendChild(plainCopyButton("Copy install", binding.install));
      }
      if (binding.import) {
        fwBody.appendChild(factLine(entry.name === "web-components" ? "load" : "import", binding.import, true));
        fwBody.appendChild(plainCopyButton("Copy import", binding.import));
      }
      if (binding.tag) fwBody.appendChild(factLine("markup", binding.tag, true));
      /* The contract is harvested from each source file's MUE:META by
         tools/audit/framework-parity.mjs — the same fields an agent reads before it
         writes markup, shown here so nobody has to open the file to check them. */
      var spec = binding.spec || {};
      ["variants", "props", "states", "a11y", "keyboard", "events"].forEach(function (field) {
        if (spec[field]) fwBody.appendChild(factLine(field, spec[field]));
      });
      if (binding.architecture) {
        var arch = make("a", "lib-btn lib-btn-ghost");
        arch.href = GITHUB_BASE + binding.architecture;
        arch.target = "_blank";
        arch.rel = "noreferrer";
        arch.appendChild(make("span", null, "Read the porting plan"));
        fwBody.appendChild(arch);
      }
      if (binding.verified) fwBody.appendChild(factLine("verified", binding.verified));
      else if (state === "live") fwBody.appendChild(factLine("verified", "No verification note recorded for this binding."));

      var sourceFiles = binding.sources || (binding.source ? [binding.source] : []);
      if (state === "live" && sourceFiles.length) {
        for (var sf = 0; sf < sourceFiles.length; sf++) {
          fwBody.appendChild(copyButton("Copy " + String(sourceFiles[sf]).split("/").pop(), sourceFiles[sf], "component source"));
        }
        fwBody.appendChild(factLine("files", sourceFiles.length + " in this binding", true));
        var gh = make("a", "lib-btn lib-btn-ghost");
        gh.href = GITHUB_BASE + (entry.name === "vanilla" ? item.path : "frameworks/" + entry.name);
        gh.target = "_blank";
        gh.rel = "noreferrer";
        gh.appendChild(make("span", null, "View on GitHub"));
        fwBody.appendChild(gh);
      }

      if (entry.name === "vanilla") {
        showFrame(engineUrl(item), "Live preview: " + String(item.name));
        src.href = githubUrl(item);
        if (fwNote) fwNote.textContent = "The frame is the vanilla file the catalog names, served from /engine/… — the same file a copy-and-paste user gets.";
      } else if (state === "live" && binding.preview) {
        var previewUrl = ENGINE_BASE + String(binding.preview).replace(/\.html$/i, "");
        showFrame(previewUrl, "Live preview: " + FW_LABEL[entry.name] + " binding of " + String(item.name));
        src.href = GITHUB_BASE + (binding.sources ? binding.sources[0] : binding.source);
        if (fwNote) {
          fwNote.textContent = "This frame runs the " + FW_LABEL[entry.name] + " component, built from the files in frameworks/" +
            entry.name + "/ and styled by the same styles/components.css as the HTML version. Resizing and theme buttons drive it the same way.";
        }
        if (counted) track("component_preview_open", { id: String(item.id), target: "framework:" + entry.name });
      } else {
        if (stageWrap) stageWrap.hidden = true;
        if (fwNote) {
          fwNote.textContent = "No " + FW_LABEL[entry.name] + " component exists in this repository, so there is nothing to render. " +
            (binding.architecture ? "The documented plan for it is linked above; the tab is here to show that gap, not to paper over it." : "");
        }
        src.href = GITHUB_BASE + "frameworks";
        if (counted) track("component_preview_open", { id: String(item.id), target: "framework-gap:" + entry.name });
      }

      var params = { id: String(item.id) };
      if (entry.name !== "vanilla") params.fw = entry.name;
      try {
        history.replaceState(null, "", location.pathname + "?" + Object.keys(params).map(function (k) {
          return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
        }).join("&"));
      } catch (e) { /* a blocked history write only costs the deep link */ }
      paintWidth();
    }

    if (fwBox && fwTabs && fwBody && bindings.length > 1) {
      fwBox.hidden = false;
      var wantedFw = String(query.fw || "").toLowerCase();
      var chosenBinding = bindings[0];
      for (var bi = 0; bi < bindings.length; bi++) {
        (function (entry, index) {
          var tab = make("button", "pv-fw-tab");
          tab.type = "button";
          tab.setAttribute("role", "tab");
          tab.setAttribute("data-fw", entry.name);
          tab.id = "pv-fw-tab-" + entry.name;
          tab.appendChild(make("span", null, FW_LABEL[entry.name]));
          tab.appendChild(make("span", "pv-fw-state", entry.name === "vanilla" ? "stable" : entry.status));
          tab.tabIndex = -1;
          on(tab, "click", function () { selectBinding(entry, true); tab.focus(); });
          on(tab, "keydown", function (event) {
            var delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            if (!delta) return;
            event.preventDefault();
            var next = (index + delta + bindings.length) % bindings.length;
            selectBinding(bindings[next], true);
            fwTabs.children[next].focus();
          });
          fwTabs.appendChild(tab);
        })(bindings[bi], bi);
        if (bindings[bi].name === wantedFw) chosenBinding = bindings[bi];
      }
      selectBinding(chosenBinding, false);
    } else if (fwBox) {
      fwBox.hidden = true;
    }

    /* Related entries: whatever else the catalog files under the same category,
       counted from the data rather than curated by hand. */
    var relatedBox = $id("pv-related");
    var relatedList = $id("pv-related-list");
    var relatedNote = $id("pv-related-note");
    if (relatedBox && relatedList) {
      var others = itemsOf(catalog).filter(function (other) {
        return other.id !== item.id && String(other.category || "") === String(item.category || "");
      });
      var why = "category";
      if (!others.length) {
        /* Most catalogued entries are one-per-category, so siblings are usually
           none. Fall back to the entries that travel with this one — the ones the
           registry ships in the same frameworks — which is the useful pairing. */
        var mine = liveBindings(item);
        if (mine.length) {
          others = itemsOf(catalog).filter(function (other) {
            if (other.id === item.id || String(other.kind || "") !== String(item.kind || "")) return false;
            var theirs = liveBindings(other);
            for (var f = 0; f < theirs.length; f++) {
              if (mine.indexOf(theirs[f]) > -1) return true;
            }
            return false;
          });
          why = "bindings";
        }
      }
      relatedList.textContent = "";
      if (others.length) {
        relatedBox.hidden = false;
        for (var r = 0; r < others.length && r < 8; r++) {
          (function (other) {
            var a = make("a", "lib-btn lib-btn-ghost");
            a.href = "/preview?id=" + encodeURIComponent(other.id);
            a.appendChild(make("span", null, String(other.name)));
            on(a, "click", function () { track(previewEventFor(other), { id: String(other.id), target: "related:" + String(item.id) }); });
            relatedList.appendChild(a);
          })(others[r]);
        }
        if (relatedNote) {
          var shown = Math.min(others.length, 8);
          relatedNote.textContent = why === "category"
            ? (others.length > 8
              ? "Showing 8 of " + others.length + " other entries the catalog files under " + String(item.category) + "."
              : "The catalog files " + others.length + " other " + String(item.kind).toLowerCase() + (others.length === 1 ? "" : "s") + " under " + String(item.category) + ".")
            : (shown + (others.length > 8 ? " of " + others.length : "") + " " + String(item.kind).toLowerCase() + (others.length === 1 ? "" : "s") +
              " shipped in the same " + liveBindings(item).length + " frameworks as this one.");
        }
      } else {
        relatedBox.hidden = true;
      }
    }

    window.addEventListener("resize", paintWidth);
    paintWidth();

    $id("pv-copy-slot").appendChild(copyControl(item, "lib-copy"));
  }

  /* ---- boot ---------------------------------------------------------------- */
  function boot() {
    /* The shared header declares data-event on its GitHub and theme controls.
       Binding them here — before the page-role check below — keeps those clicks
       counted on every page that carries that header. */
    on(document, "click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("[data-event]") : null;
      if (!el) return;
      track(el.getAttribute("data-event"), {
        target: (el.getAttribute("href") || el.textContent || "").trim().slice(0, 64),
      });
    });

    var wantsLibrary = !!$id("lib-grid");
    var wantsTemplates = !!$id("tpl-root");
    var wantsPreview = !!$id("pv-iframe");
    if (!wantsLibrary && !wantsTemplates && !wantsPreview) return;

    loadCatalog().then(function (catalog) {
      if (wantsLibrary) initLibrary(catalog);
      if (wantsTemplates) initTemplates(catalog);
      if (wantsPreview) initPreview(catalog);
    }, function (err) {
      var box = $id("lib-error") || $id("tpl-error") || $id("pv-error");
      var stage = $id("lib-grid") || $id("tpl-root") || $id("pv-stage");
      if (stage) stage.setAttribute("data-state", "error");
      if (box) {
        box.hidden = false;
        var msg = box.querySelector(".lib-error-msg");
        if (!msg) {
          msg = make("p", "lib-error-msg");
          box.appendChild(msg);
        }
        msg.textContent = (err && err.message ? err.message : "The catalog could not be loaded.") +
          " This page reads " + CATALOG_URL + " — run the engine copy (node site/build.mjs) and serve the site over http://.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

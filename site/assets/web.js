/* Site interactions the engine script does not cover: live preview frames,
   device-width emulation, lazy showcase panels, copy actions, waitlist. */
(function () {
  "use strict";

  var doc = document;
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  function track(name, payload) {
    if (window.mueTrack) { try { window.mueTrack(name, payload || {}); } catch (e) {} }
  }

  /* Emulating a viewport inside a fixed stage: a device narrower than the stage
     is drawn at its true width, one wider is scaled down so the whole width fits
     without the page pretending to be a different size. */
  function fit(iframe, stage, width) {
    if (!iframe || !stage) return;
    var avail = stage.clientWidth;
    var height = stage.clientHeight;
    if (!avail || !height) return;
    if (width >= avail) {
      var k = avail / width;
      iframe.style.width = width + "px";
      iframe.style.height = height / k + "px";
      iframe.style.transform = "scale(" + k + ")";
      iframe.style.left = "0";
    } else {
      iframe.style.width = width + "px";
      iframe.style.height = height + "px";
      iframe.style.transform = "none";
      iframe.style.left = Math.max(0, Math.round((avail - width) / 2)) + "px";
    }
  }

  function liveFrame(root) {
    var view = $("[data-frame-view]", root);
    var stage = $("[data-frame-stage]", root);
    var urlEl = $("[data-frame-url]", root);
    var sizeEl = $("[data-frame-size]", root);
    var tabs = $all(".frame-tabs [role=tab]", root);
    var widths = $all(".frame-tabs [data-width]", root);
    var current = 1280;
    var src = view.getAttribute("src");

    function render() { fit(view, stage, current); }
    function setSrc(next, name) {
      if (!next || next === src) return;
      src = next;
      view.setAttribute("src", next);
      if (urlEl) urlEl.textContent = next.replace("/engine/", "engine/");
      if (view.setAttribute) view.title = "Live preview: " + name;
    }

    function activate(tab) {
      setSrc(tab.getAttribute("data-src"), tab.textContent.trim());
      tabs.forEach(function (other) { other.setAttribute("aria-selected", String(other === tab)); });
      track("component_preview_open", { id: tab.getAttribute("data-track") || tab.textContent.trim().toLowerCase() });
    }

    /* Arrow keys and the roving tabIndex are already handled for every
       [role=tablist] by /engine/styles/mue.js; only the iframe source and the
       selection state are ours here. */
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { activate(tab); });
    });

    widths.forEach(function (btn) {
      btn.addEventListener("click", function () {
        widths.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        current = parseInt(btn.getAttribute("data-width"), 10);
        if (sizeEl) sizeEl.textContent = current + " px" + (current > stage.clientWidth ? " (fit)" : "");
        render();
      });
    });

    view.addEventListener("load", render);
    addEventListener("resize", render);
    render();
    if (sizeEl) sizeEl.textContent = current + " px" + (current > stage.clientWidth ? " (fit)" : "");
  }

  /* ---- showcase tabs ------------------------------------------------------ */
  function showcase() {
    var rail = $(".showcase-rail");
    var view = $("#showcaseView");
    if (!rail || !view) return;
    var panels = {};
    $all(".showcase-body [role=tabpanel]").forEach(function (p) { panels[p.id] = p; });
    var loaded = {};

    function paint(panel) {
      if (!panel) return;
      var src = panel.getAttribute("data-src");
      if (!loaded[src]) { view.setAttribute("src", src); loaded[src] = true; }
      $("#showcaseUrl").textContent = src;
      view.title = "Live preview: " + panel.getAttribute("data-name");
      var variants = panel.getAttribute("data-variants");
      $("#showcaseVariants").textContent = variants === "0" ? "single composition" : variants + " variants";
      var id = panel.getAttribute("aria-label").toLowerCase().replace(/\s+/g, "-");
      var tab = rail.querySelector('[aria-controls="' + panel.id + '"]');
      if (tab) id = tab.getAttribute("data-id") || id;
      $("#showcasePreview").setAttribute("href", "/preview.html?id=" + id);
      $("#showcaseSource").setAttribute("href", "https://github.com/STEVOHCODER/master-ui-engine/blob/main/" + panel.getAttribute("data-path"));
      $("#showcaseCopy").setAttribute("data-copy-src", src);
      $("#showcaseCopy").setAttribute("data-id", id);
      track("component_preview_open", { id: id });
    }

    rail.addEventListener("click", function (e) {
      var tab = e.target.closest ? e.target.closest("[role=tab]") : null;
      if (!tab) return;
      paint(panels[tab.getAttribute("aria-controls")]);
    });

    var first = panels[rail.querySelector('[aria-selected="true"]').getAttribute("aria-controls")];
    // mue.js hides the other panels; the first paint has to happen here because
    // the iframe is shared rather than duplicated per panel.
    paint(first);
  }

  /* ---- copy actions ------------------------------------------------------- */
  function flash(btn, label) {
    var old = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", old);
    btn.textContent = label;
    setTimeout(function () { btn.textContent = old; }, 1800);
  }

  function writeClip(text, ok, btn) {
    var done = function () { flash(btn, "Copied"); ok(); };
    var fail = function () { flash(btn, "Copy blocked"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else {
      var ta = doc.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      doc.body.appendChild(ta);
      ta.select();
      try { done(); } catch (e) { fail(); }
      doc.body.removeChild(ta);
    }
  }

  function copyButtons() {
    doc.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".copy-btn") : null;
      if (!btn) return;
      var sel = btn.getAttribute("data-copy-text");
      if (sel) {
        var node = $(sel);
        if (!node) return;
        writeClip(node.textContent, function () { track("copy_code", { id: "cli-commands" }); }, btn);
        return;
      }
      var src = btn.getAttribute("data-copy-src");
      if (!src) return;
      var id = btn.getAttribute("data-id") || src;
      btn.disabled = true;
      fetch(src).then(function (r) {
        if (!r.ok) throw new Error("status");
        return r.text();
      }).then(function (text) {
        btn.disabled = false;
        writeClip(text, function () { track("copy_code", { id: id }); }, btn);
      }).catch(function () {
        btn.disabled = false;
        flash(btn, "Fetch failed");
      });
    });
  }

  /* ---- declared events ---------------------------------------------------- */
  function declaredEvents() {
    $all("[data-event]").forEach(function (el) {
      el.addEventListener("click", function () {
        track(el.getAttribute("data-event"), { target: (el.getAttribute("href") || el.textContent).trim().slice(0, 64) });
      });
    });
  }

  /* ---- waitlist ----------------------------------------------------------- */
  var SHAPE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  function waitlist() {
    var form = doc.getElementById("waitlist-form");
    if (!form) return;
    var input = doc.getElementById("email");
    var status = doc.getElementById("waitlist-status");
    var submit = form.querySelector("button");

    function say(message, state) {
      status.textContent = message;
      if (state) status.setAttribute("data-state", state); else status.removeAttribute("data-state");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      if (!SHAPE.test(email)) { say("Enter a real email address.", "error"); input.focus(); return; }
      submit.disabled = true;
      say("Saving…");
      fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email }),
        credentials: "same-origin"
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) { return { r: r, data: data }; });
      }).then(function (res) {
        submit.disabled = false;
        if (res.r.ok && res.data && res.data.ok) {
          say(res.data.state === "existing" ? "You are already on the list." : "You are on the list.", "ok");
          form.reset();
          track("newsletter_signup", { id: "waitlist" });
          return;
        }
        say("Not saved — the server refused the request.", "error");
      }).catch(function () {
        submit.disabled = false;
        say("Not saved — could not reach the server.", "error");
      });
    });
  }

  function boot() {
    $all("[data-live-frame]").forEach(liveFrame);
    showcase();
    copyButtons();
    declaredEvents();
    waitlist();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

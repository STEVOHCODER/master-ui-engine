/* MASTER-UI-ENGINE site — analytics collector. Plain script, no build step, no
   dependencies, ES5-safe, loaded with <script defer src="/assets/analytics.js">.
   Public API: window.mueTrack(name, { id, path, target }) and window.mueTrackReady.
   The event names it accepts are the NAMES list below; anything else is dropped.
   Privacy: the only value kept in the browser is 16 random characters under the
   localStorage key "mue-vid". No cookie, no query string (path only), no free
   text from the page. Every path is wrapped, so counting can never break the
   page it counts. */
(function () {
  "use strict";
  var ENDPOINT = "/api/track";
  var VID_KEY = "mue-vid";
  var VID_SHAPE = /^[A-Za-z0-9_-]{8,64}$/;
  var NAMES = ["page_view", "library_search", "component_preview_open", "template_preview_open",
    "copy_code", "github_click", "documentation_click", "install_instruction_open",
    "theme_switch", "newsletter_signup"];
  var FLUSH_COUNT = 8, FLUSH_MS = 2500, MAX_QUEUE = 25, MAX_TEXT = 80;
  var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  var queue = [], timer = null, cachedVid = null, viewFired = false;

  function store() {
    try { var bag = window.localStorage; bag.getItem(VID_KEY); return bag; }
    catch (error) { return null; }              // private mode / blocked storage
  }

  function token(value) {
    if (value === null || value === undefined) return null;
    var text = String(value).replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    if (!text) return null;
    return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) : text;
  }

  function pagePath() { try { return window.location.pathname || "/"; } catch (error) { return "/"; } }

  function randomId() {
    var out = "", i, bytes;
    if (window.crypto && window.crypto.getRandomValues) {
      bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      for (i = 0; i < 16; i += 1) out += ABC.charAt(bytes[i] % 64);
      return out;
    }
    for (i = 0; i < 16; i += 1) out += ABC.charAt(Math.floor(Math.random() * 64));
    return out;
  }

  /* Session-stable anonymous id: generated once, reused for every later visit,
     which is what lets the owner tell 50 visits from 50 visitors. With storage
     blocked the id simply lives for this page load. */
  function visitorId() {
    if (cachedVid) return cachedVid;
    var bag = store(), saved = null;
    if (bag) { try { saved = bag.getItem(VID_KEY); } catch (error) { saved = null; } }
    if (saved && VID_SHAPE.test(saved)) { cachedVid = saved; return cachedVid; }
    cachedVid = randomId();
    if (bag) { try { bag.setItem(VID_KEY, cachedVid); } catch (error) { /* memory only */ } }
    return cachedVid;
  }

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!queue.length) return;
    var batch = queue.slice(0, MAX_QUEUE);
    queue = [];
    var body;
    try { body = JSON.stringify({ v: visitorId(), p: pagePath(), events: batch }); }
    catch (error) { return; }
    var delivered = false;
    try {
      if (navigator.sendBeacon && typeof Blob !== "undefined") {
        delivered = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      }
    } catch (error) { delivered = false; }
    if (delivered) return;
    try {
      if (window.fetch) {
        window.fetch(ENDPOINT, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: body,
          credentials: "same-origin", keepalive: true
        }).catch(function () { /* offline: drop this batch, never retry-storm */ });
      }
    } catch (error) { /* no transport available: fail silently */ }
  }

  function track(name, payload) {
    try {
      if (typeof name !== "string" || NAMES.indexOf(name) === -1) return;
      var data = payload && typeof payload === "object" ? payload : {};
      var id = token(data.id);
      queue.push({ name: name, id: id, target: token(data.target) || id,
        path: token(data.path) || pagePath(), t: new Date().getTime() });
      if (queue.length > MAX_QUEUE) queue = queue.slice(queue.length - MAX_QUEUE);
      if (queue.length >= FLUSH_COUNT) flush();
      else if (!timer) timer = setTimeout(flush, FLUSH_MS);
    } catch (error) { /* counting must never break the page it counts */ }
  }

  function firePageView() {
    if (viewFired) return;
    viewFired = true;
    track("page_view", { path: pagePath() });
  }

  try {
    window.mueTrack = track;
    if (window.addEventListener) {
      window.addEventListener("pagehide", flush, false);
      window.addEventListener("blur", flush, false);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") flush();
      }, false);
      /* Restored from the back/forward cache: a fresh view of a fresh load. */
      window.addEventListener("pageshow", function (event) {
        if (event && event.persisted) { viewFired = false; firePageView(); }
      }, false);
    }
    firePageView();
    window.mueTrackReady = true;
  } catch (error) { /* leave mueTrackReady unset so callers can tell */ }
}());

/* Qoder audit harness — served at /__audit__/harness.js by serve.js.
   Not part of MASTER-UI-ENGINE. Runs each preview in a same-origin iframe so
   media queries respond to a real viewport width without resizing the window
   (the in-app browser has no visible surface, so screenshots are unavailable
   and geometry + computed styles are the evidence). */

const WIDTHS = [320, 375, 768, 1280];

function luminance(r, g, b) {
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function parseColor(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}

function over(fg, bg) {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: bg.r, g: bg.g, b: bg.b, a: bg.a };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a
  };
}

function ratio(c1, c2) {
  const l1 = luminance(c1.r, c1.g, c1.b);
  const l2 = luminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function opaqueBackground(win, el) {
  const stack = [];
  let node = el;
  while (node && node !== node.ownerDocument.documentElement.parentElement) {
    const c = parseColor(win.getComputedStyle(node).backgroundColor);
    if (c) {
      stack.push(c);
      if (c.a >= 0.999) break;
    }
    node = node.parentElement;
  }
  stack.push({ r: 255, g: 255, b: 255, a: 1 });
  let out = stack[stack.length - 1];
  for (let i = stack.length - 2; i >= 0; i--) out = over(stack[i], out);
  return out;
}

function required(c) {
  if (c.fontSize >= 24 || (c.fontSize >= 18.66 && c.fontWeight >= 700)) return 3;
  return 4.5;
}

function auditContrast(win, doc) {
  const fails = [];
  let checked = 0;
  const walker = doc.createTreeWalker(doc.body, 4 /* NodeFilter.SHOW_TEXT */);
  let text;
  while ((text = walker.nextNode())) {
    if (!text.textContent.trim()) continue;
    const el = text.parentElement;
    if (!el || el.closest("script,style,template,noscript")) continue;
    const cs = win.getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const fg = over(parseColor(cs.color), opaqueBackground(win, el));
    const need = required({ fontSize: parseFloat(cs.fontSize), fontWeight: parseInt(cs.fontWeight, 10) || 400 });
    const got = ratio(fg, opaqueBackground(win, el));
    checked++;
    if (got < need - 0.01) {
      fails.push({
        text: text.textContent.trim().slice(0, 42),
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""),
        got: +got.toFixed(2),
        need,
        size: cs.fontSize
      });
    }
  }
  return { checked, fails };
}

function overflowReport(win, doc, width) {
  const de = doc.documentElement;
  const limit = de.clientWidth;
  const offenders = [];
  if (de.scrollWidth > limit + 1) {
    for (const el of Array.from(doc.querySelectorAll("body *"))) {
      if (el.closest("script,style,template")) continue;
      const cs = win.getComputedStyle(el);
      if (cs.position === "fixed" && (cs.overflowX === "hidden" || cs.overflowX === "clip")) continue;
      const rect = el.getBoundingClientRect();
      if (!rect.width) continue;
      if (rect.right > limit + 1 || rect.left < -1) {
        let p = el.parentElement, scrollable = false;
        while (p) {
          const pcs = win.getComputedStyle(p);
          if (/auto|scroll/.test(pcs.overflowX)) { scrollable = true; break; }
          p = p.parentElement;
        }
        if (scrollable) continue;
        offenders.push({
          sel: el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""),
          left: Math.round(rect.left),
          right: Math.round(rect.right)
        });
      }
    }
  }
  return { scrollWidth: de.scrollWidth, clientWidth: limit, offenders: offenders.slice(0, 8) };
}

function loadFrame(src, width, height = 900) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("data-audit", src);
    frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${width}px;height:${height}px;border:0;visibility:hidden`;
    const sep = src.includes("?") ? "&" : "?";
    frame.src = `${src}${sep}w=${width}&t=${Date.now()}`;
    frame.onload = () => {
      const doc = frame.contentDocument;
      /* A background tab never advances a CSS transition, so getComputedStyle
         keeps returning the transition's start value. Freeze motion before
         measuring or every theme switch looks like a contrast failure.
         Tagged by id so cleanup can only ever remove this element. */
      const kill = doc.createElement("style");
      kill.id = "mue-audit-kill-motion";
      kill.textContent =
        "html{scroll-behavior:auto!important}" +
        "*,*::before,*::after{transition:none!important;animation:none!important}";
      doc.head.appendChild(kill);
      setTimeout(() => resolve(frame), 250);
    };
    frame.onerror = reject;
    document.body.appendChild(frame);
  });
}

const cleanup = (frame) => frame.remove();

/* probes: a selector + property pair proving the shared sheet really applied */
const PROBES = [
  ["body.page", "paddingLeft"],
  [".btn-primary", "minHeight"],
  [".btn-primary", "transitionDuration"],
  [".code-wrap", "backgroundColor"],
  [".copy-btn", "display"]
];

export async function auditPreview(path, { widths = WIDTHS, probes = [] } = {}) {
  const out = { path, runs: [], notes: [] };
  for (const width of widths) {
    const frame = await loadFrame(path, width);
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    win.localStorage && win.localStorage.removeItem("mui-theme");
    const run = { width, themes: {} };
    for (const theme of ["light", "dark"]) {
      const want = theme === "dark";
      doc.documentElement.classList.toggle("dark", want);
      /* the page's own boot script can re-apply a stored theme; force it back */
      if (doc.documentElement.classList.contains("dark") !== want) {
        doc.documentElement.classList.toggle("dark", want);
      }
      await new Promise((r) => setTimeout(r, 60));
      const c = auditContrast(win, doc);
      const o = overflowReport(win, doc, width);
      const computed = {};
      for (const [sel, prop] of [...probes]) {
        const el = doc.querySelector(sel);
        computed[sel + " " + prop] = el ? win.getComputedStyle(el)[prop] : "MISSING";
      }
      run.themes[theme] = {
        contrastFails: c.fails,
        contrastChecked: c.checked,
        overflow: o.scrollWidth > o.clientWidth + 1 ? o : "clean",
        bodyPaint: win.getComputedStyle(doc.body).backgroundColor,
        computed
      };
    }
    /* structural facts, theme independent */
    run.structure = {
      title: doc.title,
      hasPageClass: doc.body.classList.contains("page"),
      engineLinked: !!doc.querySelector('link[href*="engine.css"]'),
      sheetLinked: !!doc.querySelector('link[href*="components.css"]'),
      mueLoaded: typeof win.MUE === "object",
      copyButtons: doc.querySelectorAll(".copy-btn").length,
      codeBlocks: doc.querySelectorAll(".code-wrap").length,
      themeToggles: doc.querySelectorAll(".theme-toggle,[data-theme-toggle]").length,
      h1: doc.querySelectorAll("h1").length,
      headings: Array.from(doc.querySelectorAll("h1,h2,h3,h4")).map((h) => h.tagName).join(","),
      reveal: doc.querySelectorAll(".reveal").length,
      inlineScripts: Array.from(doc.querySelectorAll("script:not([src])")).length,
      animating: (win.getAnimations ? win.getAnimations().length : "n/a"),
      durationToken: win.getComputedStyle(doc.documentElement).getPropertyValue("--duration-base").trim(),
      bodyBg: win.getComputedStyle(doc.body).backgroundColor,
      touchTargetsSmall: Array.from(doc.querySelectorAll("button,a[href],input[type=submit],.btn,.btn-primary"))
        .map((el) => ({ sel: el.tagName.toLowerCase() + "." + String(el.className).trim().split(/\s+/)[0], h: Math.round(el.getBoundingClientRect().height) }))
        .filter((x) => x.h > 0 && x.h < 36)
    };
    out.runs.push(run);
    cleanup(frame);
  }
  return out;
}

/* Long sweeps outlive a single 15s evaluate_script call, so the loop runs
   inside the page and a polling call reads its progress. */
export function startBatch(paths, opts = {}) {
  const state = (window.__MUE_AUDIT = { total: paths.length, done: 0, results: [], running: true, started: Date.now() });
  (async () => {
    for (const p of paths) {
      try {
        const one = await auditPreview(p, { ...opts, probes: PROBES });
        state.results.push(...summarize([one]));
      } catch (e) {
        state.results.push({ path: p, status: "ERROR", detail: String(e && e.message ? e.message : e) });
      }
      state.done++;
    }
    state.running = false;
  })();
  return "started " + paths.length;
}

export async function auditBatch(paths, opts = {}) {
  const results = [];
  for (const p of paths) {
    try {
      results.push(await auditPreview(p, { ...opts, probes: PROBES }));
    } catch (e) {
      results.push({ path: p, error: String(e && e.message ? e.message : e) });
    }
  }
  return results;
}

export function summarize(results) {
  const rows = [];
  for (const r of results) {
    if (r.error) { rows.push({ path: r.path, status: "ERROR", detail: r.error }); continue; }
    const cf = [];
    const of = [];
    const small = [];
    let checked = 0;
    for (const run of r.runs) {
      for (const t of ["light", "dark"]) {
        const th = run.themes[t];
        checked += th.contrastChecked;
        th.contrastFails.forEach((f) => cf.push(`${run.width}px ${t}: ${f.sel} "${f.text}" ${f.got}<${f.need}`));
        if (th.overflow !== "clean") of.push(`${run.width}px ${t}: ${JSON.stringify(th.overflow.offenders)}`);
      }
      run.structure.touchTargetsSmall.forEach((x) => small.push(`${run.width}px ${x.sel} h=${x.h}`));
    }
    const s = r.runs[0].structure;
    const bad = cf.length + of.length;
    rows.push({
      path: r.path,
      status: bad ? "FAIL" : "PASS",
      nodes: checked,
      copyBtns: s.copyButtons,
      sheet: s.sheetLinked,
      mue: s.mueLoaded,
      pageClass: s.hasPageClass,
      duration: s.durationToken,
      issues: [...cf, ...of].slice(0, 6),
      tapTargets: [...new Set(small)].slice(0, 4)
    });
  }
  return rows;
}

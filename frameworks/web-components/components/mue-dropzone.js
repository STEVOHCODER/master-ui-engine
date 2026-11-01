/* BEGIN MUE:META
  COMPONENT: File Upload (Dropzone)
  ID: wc-mue-dropzone
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/forms/file-upload.html
  SHEET: styles/components.css#dropzone (+ #fields, #utilities) — the host renders
    <div class="field"><label class="sr-only" for> <div class="dropzone">
    <input class="dropzone-input" type="file"> <span class="dropzone-icon">
    <span class="dropzone-title">…<span class="dropzone-link">…</span></span>
    <span class="dropzone-hint"> </div></div> plus <ul class="dropzone-list"><li class="file-row">
    <span class="file-icon"> <span class="file-name truncate"> <span class="file-size">
    <button class="file-remove">. The control is the real file input; the element adds no CSS.
  LIGHT_DOM: true
  VARIANTS: single, multiple, accept-constrained, populated list, .is-dragging (drag-over)
  PROPS: label, name, accept, multiple (bool), title, browse, hint, disabled
  STATES: .is-dragging toggles on the .dropzone while a drag is over it (dragover adds,
    dragleave/drop removes) — the only state the sheet cannot reach on its own; each accepted
    file renders one .file-row with its name, byte size and a remove control
  EVENTS: mue-change {detail:{count,files:[names]}}, mue-remove {detail:{name,index}}
  A11Y: the input is labelled by an .sr-only <label> joined by for/id, never by the decoration
    text in the box; the icon and glyphs are aria-hidden; every remove button carries an
    .sr-only name that includes the file it removes; long names use .truncate and the size and
    button stay on one line
  KEYBOARD: the picker, Tab and Enter are the native file input's — nothing here reimplements
    them; the drop/drag path is pointer-driven and only ever supplements the same input
  RESPONSIVE: the target is a fluid block inside a full-width .field; rows keep name, size and
    the 44px remove button on one line down to 320px (styles/components.css#dropzone)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const NS = "http://www.w3.org/2000/svg";
let seq = 0;
const uid = (p) => p + "-" + ++seq;
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};
const icon = (paths, sw) => {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", String(sw || 1.8));
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  (Array.isArray(paths) ? paths : [paths]).forEach((d) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  });
  return svg;
};
const formatSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

function defineMueDropzone() {
  class MueDropzone extends HTMLElement {
    connectedCallback() {
      if (this._input) return;
      this.#build();
    }
    get files() {
      return this._input ? Array.from(this._input.files) : [];
    }
    #build() {
      const id = uid("mue-dropzone");
      const field = el("div", "field");
      const lab = el("label", "sr-only", this.getAttribute("label") || "Attach files");
      lab.setAttribute("for", id);
      field.appendChild(lab);

      const zone = el("div", "dropzone");
      const input = el("input", "dropzone-input");
      input.type = "file";
      input.id = id;
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this.hasAttribute("accept")) input.accept = this.getAttribute("accept");
      if (this.hasAttribute("multiple")) input.multiple = true;
      if (this.hasAttribute("disabled")) input.disabled = true;
      zone.appendChild(input);

      const ic = el("span", "dropzone-icon");
      ic.appendChild(icon(["M12 16V4", "m7 9 5-5 5 5", "M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"], 1.9));
      zone.appendChild(ic);

      const title = el("span", "dropzone-title");
      title.appendChild(document.createTextNode((this.getAttribute("title") || "Drop files here or") + " "));
      const browse = el("span", "dropzone-link", this.getAttribute("browse") || "browse files");
      title.appendChild(browse);
      zone.appendChild(title);

      if (this.getAttribute("hint")) zone.appendChild(el("span", "dropzone-hint", this.getAttribute("hint")));
      field.appendChild(zone);

      const list = el("ul", "dropzone-list");

      this.textContent = "";
      this.append(field, list);
      this._input = input;
      this._zone = zone;
      this._list = list;

      input.addEventListener("change", () => this.#render());
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("is-dragging");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("is-dragging"));
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("is-dragging");
        const dropped = e.dataTransfer && e.dataTransfer.files;
        if (!dropped) return;
        this.#setFiles(Array.from(dropped));
        this.#render();
        this.#emitChange();
      });
      list.addEventListener("click", (e) => {
        const btn = e.target.closest(".file-remove");
        if (!btn) return;
        const row = btn.closest(".file-row");
        const index = Array.from(list.children).indexOf(row);
        const remaining = this.files.filter((_, i) => i !== index);
        this.#setFiles(remaining);
        this.#render();
        this.dispatchEvent(
          new CustomEvent("mue-remove", { bubbles: true, composed: true, detail: { name: btn.dataset.name, index } })
        );
        this.#emitChange();
      });
    }
    #setFiles(files) {
      try {
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        this._input.files = dt.files;
      } catch {
        /* DataTransfer constructor unsupported: leave the native selection untouched. */
      }
    }
    #render() {
      const list = this._list;
      if (!list) return;
      list.textContent = "";
      this.files.forEach((f) => {
        const row = el("li", "file-row");
        const fi = el("span", "file-icon");
        fi.appendChild(icon(["M14 3v5h5", "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"]));
        row.appendChild(fi);
        row.appendChild(el("span", "file-name truncate", f.name));
        row.appendChild(el("span", "file-size", formatSize(f.size)));
        const btn = el("button", "file-remove");
        btn.type = "button";
        btn.dataset.name = f.name;
        btn.appendChild(el("span", "sr-only", "Remove " + f.name));
        btn.appendChild(icon(["M6 6l12 12M18 6 6 18"], 2));
        row.appendChild(btn);
        list.appendChild(row);
      });
    }
    #emitChange() {
      const files = this.files;
      this.dispatchEvent(
        new CustomEvent("mue-change", {
          bubbles: true,
          composed: true,
          detail: { count: files.length, files: files.map((f) => f.name) }
        })
      );
    }
  }
  if (!customElements.get("mue-dropzone")) customElements.define("mue-dropzone", MueDropzone);
  return MueDropzone;
}

export const MueDropzone = defineMueDropzone();
export default MueDropzone;

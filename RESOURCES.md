# Phase 1 Research — Curated Open-Source UI Resources

Research behind this library: open-source UI libraries, design systems,
component collections, animation libraries, and agent-oriented design
resources. License and redistribution status is recorded for every resource so
agents can determine legal reuse.

**Status in this repository:** nothing below is vendored. MASTER-UI-ENGINE
implements its own vanilla token system (`design-tokens/`) and borrows only the
*token naming convention* from shadcn/ui. The redistribution summary at the end
is what governs any future import.

## 1. shadcn/ui — https://ui.shadcn.com/

| Field | Detail |
|-------|--------|
| License | MIT License |
| Framework | React + Tailwind CSS (source copied into your project) |
| Component collection | Accordion, Alert, Alert Dialog, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Dialog, Dropdown Menu, Input, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Select, Separator, Sheet, Sidebar, Skeleton, Switch, Table, Tabs, Textarea, Toast, Tooltip, plus AI Elements |
| Installation | `npx shadcn@latest init` then `npx shadcn@latest add <component>` |
| Reusable patterns | Radix UI primitives, Tailwind CSS, class-variance-authority (CVA), lucide icons, cn() utility, components.json design tokens |
| Legally incorporable? | Yes — MIT, source intended to be copied and modified |
| Attribution | Include MIT copyright notice in copies of source code |

## 2. pacifio/ui — https://github.com/pacifio/ui

| Field | Detail |
|-------|--------|
| License | MIT License (Copyright 2026 pacifio) |
| Framework | React + Tailwind CSS |
| Component collection | shadcn/ui-parity component set |
| Installation | `pnpm dlx shadcn@latest add @pacifio/<name>` |
| Legally incorporable? | Yes — MIT |
| Attribution | Include MIT copyright notice |

## 3. pacifio/atlas — https://github.com/pacifio/atlas

| Field | Detail |
|-------|--------|
| License | Apache License 2.0 (Copyright 2026 Adib Mohsin) |
| Framework | React + Tailwind CSS |
| Component collection | Enterprise design system components |
| Legally incorporable? | Yes — Apache 2.0; preserve license notice, state changes, NOTICE |
| Attribution | Preserve Apache License header and NOTICE file |

## 4. daisyUI — https://daisyui.com/

| Field | Detail |
|-------|--------|
| License | MIT License |
| Framework | Tailwind CSS plugin (React, Vue, Svelte, Angular, Astro, Laravel, etc.) |
| Component collection | Buttons, inputs, cards, navbar, sidebar, modal, dialog, tooltip, table, pagination, badge, alert, progress, skeleton, drawer, toast, toggle, and ~50+ more |
| Installation | `npm i -D daisyui@latest` then `@plugin "daisyui";` in Tailwind config |
| Reusable patterns | Utility-class component naming, 20+ built-in themes, semantic colors |
| Legally incorporable? | Yes — MIT |
| Attribution | Include MIT copyright notice |

## 5. Flowbite — https://flowbite.com/

| Field | Detail |
|-------|--------|
| License | MIT License (code); docs CC BY 3.0; Pro under separate EULA |
| Framework | Tailwind CSS + vanilla JS; React, Vue, Angular, Svelte, Laravel, Django, etc. |
| Component collection | Accordion, Alerts, Avatar, Badge, Breadcrumb, Buttons, Card, Carousel, Dropdown, Footer, Modal, Navbar, Pagination, Sidebar, Tables, Tabs, Toast, Tooltips, Charts, Datepicker, and more |
| Installation | `npm install flowbite` + configure Tailwind content paths and plugin |
| Legally incorporable? | Yes — MIT for code; do not use Pro/EULA components without license |
| Attribution | Include MIT copyright notice; attribute Flowbite/Themesberg for docs |

## 6. Halaska UI — https://ui.halaska.com/

| Field | Detail |
|-------|--------|
| License | MIT License (inferred) |
| Framework | React + Tailwind CSS (shadcn/ui parity) |
| Component collection | 77 components including AI-oriented ones: Agent Glyph, AI Suggestion, Thinking Indicator, Streaming Text, plus standard UI |
| Legally incorporable? | Yes — MIT |
| Attribution | Include MIT copyright notice |

## 7. DitherUI — https://ditherui.dev/

| Field | Detail |
|-------|--------|
| License | Commercial — paid ($50 All-Access); NOT open-source |
| Framework | React, Next.js, Vite, TanStack Start (shadcn CLI install) |
| Legally incorporable? | NO — commercial, paid. Reference only. Do not copy or redistribute. |
| Attribution | Not applicable |

## 8. Motion (formerly Framer Motion) — https://motion.dev/

| Field | Detail |
|-------|--------|
| License | MIT License |
| Framework | React, Vue, JavaScript |
| Purpose | Layout, scroll, gesture, spring, exit animations; AnimatePresence; LazyMotion |
| Installation | `npm install motion` |
| Legally incorporable? | Yes — MIT |
| Attribution | Include MIT copyright notice |
| Note in this library | Motion needs a framework; previews use CSS transitions guarded by `prefers-reduced-motion` instead |

## 9. Additional discovered resources

| Resource | License | Framework | Notes |
|----------|---------|-----------|-------|
| Headless UI (tailwindlabs) | MIT | React, Vue | Unstyled accessible components |
| Radix UI | MIT | React | Primitive UI components (shadcn/ui builds on these) |
| Lucide | ISC | All (icon set) | Icon library |
| Heroicons | MIT | React / SVG | Icon set |
| Tailwind CSS | MIT | CSS framework | Utility-first CSS |
| Arco Design | MIT | React, Vue | Enterprise design system (ByteDance) |
| Ant Design | MIT | React, Vue, Angular | Enterprise component library |
| PrimeReact / PrimeVue / PrimeNG | MIT | React / Vue / Angular | Themed component suites |
| MUI (Material UI) | MIT | React | Google Material Design components |
| Chakra UI | MIT | React | Accessible React component system |

## Redistribution summary

- **Safe to copy and redistribute (MIT):** shadcn/ui, pacifio/ui, daisyUI,
  Flowbite (code), Halaska UI, Motion, Radix UI, Headless UI, Lucide, Heroicons,
  Tailwind CSS, Arco Design, Ant Design, Prime, MUI, Chakra UI.
- **Safe with conditions (Apache 2.0):** pacifio/atlas — preserve license
  notice, state changes, include NOTICE.
- **NOT safe to incorporate (commercial):** DitherUI — reference only, do not
  copy source, requires paid license.

Icon sets carry their own notices: Lucide is ISC, Heroicons is MIT. Any icon
inlined into a preview as SVG must keep its attribution in the file's metadata
header.

All third-party licenses and attribution requirements are documented per-file
in the metadata blocks of `components/`, `examples/`, and `templates/`.

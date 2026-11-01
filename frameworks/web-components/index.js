/* BEGIN MUE:META
  COMPONENT: Web Components bundle (entry)
  ID: wc-mue-index
  GROUP: Frameworks > Web Components
  CATEGORY: meta
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  ROLE: single documented entry point. Importing this file imports and registers every MUE element.
    Loading it twice is harmless: each module guards with customElements.get(...).
  COVERAGE: 40 element modules register 43 custom elements (21 original tags plus the 19 ported
    catalog entries: 22 extra tags, since mue-sidebar.js ships 3 tags and mue-guidance.js ships 2).
  USAGE_NO_BUILD: <script type="module" src="frameworks/web-components/index.js"></script>
  USAGE_BUNDLER: import "mue-web-components";  // or import "./frameworks/web-components/index.js"
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { MueButton } from "./components/mue-button.js";
import { MueInput } from "./components/mue-input.js";
import { MueTextarea } from "./components/mue-textarea.js";
import { MueSelect } from "./components/mue-select.js";
import { MueCheckbox } from "./components/mue-checkbox.js";
import { MueRadio } from "./components/mue-radio.js";
import { MueRadioGroup } from "./components/mue-radio-group.js";
import { MueSwitch } from "./components/mue-switch.js";
import { MueCard } from "./components/mue-card.js";
import { MueBadge } from "./components/mue-badge.js";
import { MueDialog } from "./components/mue-dialog.js";
import { MueDropdown } from "./components/mue-dropdown.js";
import { MueTabs } from "./components/mue-tabs.js";
import { MueTab } from "./components/mue-tab.js";
import { MueTabpanel } from "./components/mue-tabpanel.js";
import { MueAccordion } from "./components/mue-accordion.js";
import { MueAccordionItem } from "./components/mue-accordion-item.js";
import { MueTable } from "./components/mue-table.js";
import { MueNotification } from "./components/mue-notification.js";
import { MueAvatar } from "./components/mue-avatar.js";
import { MueAvatarGroup } from "./components/mue-avatar-group.js";
import { MueDatePicker } from "./components/mue-date-picker.js";
import { MueDropzone } from "./components/mue-dropzone.js";
import { MueCharts } from "./components/mue-charts.js";
import { MueRating } from "./components/mue-rating.js";
import { MuePopover } from "./components/mue-popover.js";
import { MueModals } from "./components/mue-modals.js";
import { MueFooter } from "./components/mue-footer.js";
import { MueProgress } from "./components/mue-progress.js";
import { MueSkeleton } from "./components/mue-skeleton.js";
import { MueEmpty } from "./components/mue-empty.js";
import { MueError } from "./components/mue-error.js";
import { MueStepper } from "./components/mue-stepper.js";
import { MueBreadcrumbs } from "./components/mue-breadcrumbs.js";
import { MuePagination } from "./components/mue-pagination.js";
import { MueHeaderNav } from "./components/mue-header-nav.js";
import { MueNavMenu } from "./components/mue-nav-menu.js";
import { MueSidebar, MueSidebarHeading, MueSidebarLink } from "./components/mue-sidebar.js";
import { MueDatatable } from "./components/mue-datatable.js";
import { MueGuidance, MueFab } from "./components/mue-guidance.js";

export {
  MueButton,
  MueInput,
  MueTextarea,
  MueSelect,
  MueCheckbox,
  MueRadio,
  MueRadioGroup,
  MueSwitch,
  MueCard,
  MueBadge,
  MueDialog,
  MueDropdown,
  MueTabs,
  MueTab,
  MueTabpanel,
  MueAccordion,
  MueAccordionItem,
  MueTable,
  MueNotification,
  MueAvatar,
  MueAvatarGroup,
  MueDatePicker,
  MueDropzone,
  MueCharts,
  MueRating,
  MuePopover,
  MueModals,
  MueFooter,
  MueProgress,
  MueSkeleton,
  MueEmpty,
  MueError,
  MueStepper,
  MueBreadcrumbs,
  MuePagination,
  MueHeaderNav,
  MueNavMenu,
  MueSidebar,
  MueSidebarHeading,
  MueSidebarLink,
  MueDatatable,
  MueGuidance,
  MueFab
};

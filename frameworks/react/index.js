/* BEGIN MUE:META
  COMPONENT: React bindings (entry)
  ID: react-mue-react
  GROUP: Frameworks > React
  CATEGORY: frameworks
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: the thirty-four files in ./components (each carries its own MUE:META); the host page links design-tokens/engine.css + styles/components.css
  SHEET: none of its own — every class this package renders is defined in styles/components.css, and this entry imports no CSS
  VARIANTS: see each component file; variants are props that map onto existing modifier classes
  A11Y: roles, states and keyboard handling are ported from the matching vanilla preview under components/, and each component's block lists what it carries and what it deliberately does not
  KEYBOARD: dialog and modal (Escape + trap + focus return), dropdown and the navbar's menu cell (arrows/Home/End/Escape), tabs (roving tabindex + arrows + Home/End), table (Enter/Space sort), pagination (Left/Right + Home/End), stepper (arrows + Home/End when onChange is set), popover (focus-within opens, Escape closes), guidance tour (Skip/Back/Next buttons + Escape returns focus to the replay control), rating and switch and checkbox (native); nothing else intercepts a key
  VERIFIED: all thirty-three modules resolve, the preview bundle renders in headless Chrome and the interactions above were driven there on 2026-11-01; see README.md for the list of what was not verified
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

export { MueButton } from "./components/button.jsx";
export { MueInput } from "./components/input.jsx";
export { MueTextarea } from "./components/textarea.jsx";
export { MueSelect } from "./components/select.jsx";
export { MueCheckbox, MueCheckboxGroup } from "./components/checkbox.jsx";
export { MueRadio, MueRadioGroup } from "./components/radio.jsx";
export { MueSwitch } from "./components/switch.jsx";
export {
  MueCard,
  MueCardMedia,
  MueCardHeader,
  MueCardBody,
  MueCardTitle,
  MueCardDesc,
  MueCardTag,
  MueCardActions,
  MueCardPrice,
} from "./components/card.jsx";
export { MueBadge } from "./components/badge.jsx";
export { MueDialog } from "./components/dialog.jsx";
export { MueDropdown, MueDropdownItem, MueDropdownDivider } from "./components/dropdown.jsx";
export { MueTabs, MueTab } from "./components/tabs.jsx";
export { MueAccordion, MueAccordionItem } from "./components/accordion.jsx";
export { MueTable } from "./components/table.jsx";
export { MueDataTable } from "./components/data-table.jsx";
export {
  MueAlert,
  MueToast,
  MueToastStack,
  MueToastRegion,
} from "./components/notification.jsx";
export { MueAvatar, MueAvatarGroup } from "./components/avatar.jsx";
export { MueBreadcrumbs } from "./components/breadcrumbs.jsx";
export { MueBarChart, MueLineChart, MueChartLegend } from "./components/charts.jsx";
export { MueDatePicker } from "./components/date-picker.jsx";
export { MueEmptyState } from "./components/empty-state.jsx";
export { MueErrorState } from "./components/error-state.jsx";
export {
  MueDropzone,
  MueFileRow,
  MueFileList,
  formatSize,
} from "./components/file-upload.jsx";
export {
  MueFooter,
  MueFooterBrand,
  MueFooterDesc,
  MueFooterColumn,
  MueFooterLinks,
  MueFooterBottom,
  MueFooterSocial,
} from "./components/footer.jsx";
export {
  MueGuidance,
  MueGuidanceStage,
  MueGuidanceStep,
  MueGuidanceCard,
  MueGuidanceReplay,
  MueGuidanceStatus,
  MueFloatButton,
  MueFloatDock,
} from "./components/guidance.jsx";
export { MueModal } from "./components/modal.jsx";
export {
  MueHeaderNav,
  MueNavMenu,
  MueNavBrand,
  MueNavLink,
  MueNavSpacer,
  MueNavSearch,
} from "./components/navbar.jsx";
export { MuePagination } from "./components/pagination.jsx";
export {
  MuePopover,
  MueTooltip,
  MuePopoverTitle,
  MuePopoverBody,
  MuePopoverList,
} from "./components/popover.jsx";
export { MueProgress, MueProgressGroup } from "./components/progress.jsx";
export { MueRating, MueRatingInput } from "./components/rating.jsx";
export {
  MueSidebar,
  MueSidebarSection,
  MueSidebarHeading,
  MueSidebarLink,
  MueSidebarLabel,
  MueSidebarBrand,
} from "./components/sidebar.jsx";
export {
  MueSkeleton,
  MueSkeletonBody,
  MueSkeletonRow,
  MueSkeletonCard,
} from "./components/skeleton.jsx";
export {
  MueStepper,
  MueStepperItem,
  MueTimeline,
  MueTimelineItem,
} from "./components/stepper.jsx";

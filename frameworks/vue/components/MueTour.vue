<!-- BEGIN MUE:META
  COMPONENT: Tour (coachmark)
  ID: vue-ui-tour
  GROUP: Frameworks / Vue 3
  CATEGORY: overlays
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#guidance (+ #cards, #badges, #buttons, #utilities) — this SFC ships no CSS of its own
  SHEET: styles/components.css#guidance — tour-stage, tour, tour.is-open, tour-target, tour-card, tour-top, tour-end, tour-arrow, tour-step, tour-title, tour-body, tour-actions, tour-dots, dot, is-current
  VARIANTS: any number of steps; each step carries a target label and card placement modifiers ("top", "end") handed to the sheet
  A11Y: the open card is role="dialog" labelled by its own title; the target ring is drawn by the sheet's box-shadow (no overlay element); a replay button reopens a closed tour; step order follows the DOM
  KEYBOARD: Back / Skip / Next are real buttons; Escape closes the tour and returns focus to the replay control (ported from the guidance.html page script)
  PORTED FROM: components/overlays/guidance.html (product-tour section)
  VERIFIED: compiles in build.mjs; Next/Back clicks and Escape + focus return exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, nextTick, useId } from "vue";

const props = defineProps({
  /** [{ title, body, targetLabel?, placement? }] — placement is space-separated "top"/"end". */
  steps: { type: Array, required: true },
  /** Step index visible on mount; -1 starts closed. */
  start: { type: Number, default: 0 },
  replayLabel: { type: String, default: "Replay tour" },
});

const uid = useId();
const titleId = (i) => `mue-tour-title${uid}-${i}`;
const open = ref(props.start);
const replay = ref(null);

const last = computed(() => props.steps.length - 1);
const badge = computed(() =>
  open.value < 0 ? "Tour closed" : `Step ${open.value + 1} of ${props.steps.length}`
);

function cardClasses(step) {
  const mods = step.placement ? step.placement.split(/\s+/).filter(Boolean) : [];
  return mods.map((m) => `tour-${m}`);
}

function next() {
  if (open.value < last.value) open.value += 1;
  else close();
}

function back() {
  if (open.value > 0) open.value -= 1;
}

function close() {
  open.value = -1;
  nextTick(() => replay.value?.focus());
}

function replayTour() {
  open.value = 0;
}

function onStageKeydown(e) {
  if (e.key === "Escape" && open.value > -1) close();
}
</script>

<template>
  <div>
    <p class="row">
      <button ref="replay" class="btn-outline btn-sm" type="button" @click="replayTour">{{ replayLabel }}</button>
      <span class="badge badge-info">{{ badge }}</span>
    </p>

    <div class="tour-stage card" tabindex="-1" @keydown="onStageKeydown">
      <div class="card-body">
        <div
          v-for="(step, i) in props.steps"
          :key="i"
          class="tour"
          :class="{ 'is-open': open === i }"
          style="margin-bottom: var(--space-6)"
        >
          <span class="tour-target">
            <button class="btn-outline" type="button">{{ step.targetLabel || `Step ${i + 1} target` }}</button>
          </span>
          <div class="tour-card" :class="cardClasses(step)" role="dialog" :aria-labelledby="titleId(i)">
            <span class="tour-arrow" aria-hidden="true"></span>
            <p class="tour-step">Step {{ i + 1 }} of {{ props.steps.length }}</p>
            <p class="tour-title" :id="titleId(i)">{{ step.title }}</p>
            <p class="tour-body">{{ step.body }}</p>
            <div class="tour-actions">
              <span class="tour-dots" aria-hidden="true">
                <span
                  v-for="(s, d) in props.steps"
                  :key="d"
                  class="dot"
                  :class="{ 'is-current': d === open }"
                ></span>
              </span>
              <span class="row">
                <button class="btn-ghost btn-sm" type="button" @click="close">Skip</button>
                <button class="btn-outline btn-sm" type="button" :disabled="i === 0" @click="back">Back</button>
                <button class="btn-primary btn-sm" type="button" @click="next">{{ i === last ? 'Finish' : 'Next' }}</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- BEGIN MUE:META
  COMPONENT: Stepper
  ID: vue-fb-stepper
  GROUP: Frameworks / Vue 3
  CATEGORY: feedback
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel number)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#stepper (+ #display for the timeline variant, #badges, #buttons, #utilities) — this SFC ships no CSS of its own
  SHEET: styles/components.css#stepper — stepper, stepper-item, is-done, is-current, is-upcoming, stepper-dot, stepper-label, stepper-name, stepper-text; #display — timeline, timeline-item, timeline-title, timeline-meta
  VARIANTS: horizontal/vertical stepper (the sheet picks by width) and the related changelog timeline (variant="timeline"); the active index is the model
  A11Y: a real <ol>/<ul> so reading order is step order; the current item carries aria-current="step"; dot numbers and check glyphs are aria-hidden because the label text is the accessible name; done/current/upcoming differ by shape, not colour alone
  KEYBOARD: the vanilla preview swaps the three state classes by hand; this binding makes that state a model and adds Back/Next buttons plus ArrowLeft/ArrowRight to move the current step — an added affordance, honestly labelled
  PORTED FROM: components/feedback/stepper.html
  VERIFIED: compiles in build.mjs; Back/Next clicks and arrow keys exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed } from "vue";

const current = defineModel({ type: Number, default: 0 });

const props = defineProps({
  /** [{ name, text? }] — for the timeline, name -> title and text -> meta. */
  steps: { type: Array, required: true },
  /** "stepper" (default) or "timeline". */
  variant: { type: String, default: "stepper" },
  /** Render Back/Next controls that move the model. */
  controls: { type: Boolean, default: false },
  nextLabel: { type: String, default: "Next" },
  backLabel: { type: String, default: "Back" },
});

const last = computed(() => props.steps.length - 1);

function state(i) {
  if (i < current.value) return "is-done";
  if (i === current.value) return "is-current";
  return "is-upcoming";
}

function onKeydown(e) {
  if (!props.controls) return;
  if (e.key === "ArrowRight" && current.value < last.value) {
    e.preventDefault();
    current.value += 1;
  } else if (e.key === "ArrowLeft" && current.value > 0) {
    e.preventDefault();
    current.value -= 1;
  }
}
</script>

<template>
  <div @keydown="onKeydown">
    <ol v-if="variant === 'stepper'" class="stepper">
      <li
        v-for="(step, i) in steps"
        :key="i"
        class="stepper-item"
        :class="state(i)"
        :aria-current="i === current ? 'step' : undefined"
      >
        <span class="stepper-dot" aria-hidden="true">
          <svg v-if="i < current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="m5 13 4 4 10-10" /></svg>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="stepper-label">
          <span class="stepper-name">{{ step.name }}</span>
          <span v-if="step.text" class="stepper-text">{{ step.text }}</span>
        </span>
      </li>
    </ol>

    <ul v-else class="timeline">
      <li
        v-for="(step, i) in steps"
        :key="i"
        class="timeline-item"
        :class="state(i)"
        :aria-current="i === current ? 'step' : undefined"
      >
        <span class="timeline-title">{{ step.name }}</span>
        <span v-if="step.text" class="timeline-meta">{{ step.text }}</span>
        <template v-if="step.body">{{ step.body }}</template>
      </li>
    </ul>

    <div v-if="controls" class="spread" style="margin-top: var(--space-4)">
      <span class="badge"><span class="dot" aria-hidden="true"></span>Step {{ current + 1 }} of {{ steps.length }}</span>
      <div class="row">
        <button
          class="btn-ghost btn-sm"
          type="button"
          :disabled="current <= 0"
          @click="current = Math.max(0, current - 1)"
        >{{ backLabel }}</button>
        <button
          class="btn-primary btn-sm"
          type="button"
          :disabled="current >= last"
          @click="current = Math.min(last, current + 1)"
        >{{ nextLabel }}</button>
      </div>
    </div>
  </div>
</template>

<template>
  <LayoutOverlay>
    <ul v-if="formattedSlots.length" class="space-y-xs px-xs">
      <p class="mb-md">
        The installation is currently dormant It exists only during these
        opening hours:
      </p>

      <li v-for="slot in formattedSlots" :key="slot.id">
        <span class="w-5 h-5 rounded-full bg-primary inline-block"></span>
        {{ slot.label }}
      </li>
    </ul>
  </LayoutOverlay>
</template>
<script setup>
import { computed } from 'vue';

const props = defineProps({
  timeSlots: {
    type: Array,
    default: () => [],
  },
});

const formattedSlots = computed(() =>
  props.timeSlots
    .map((slot) => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }
      const label = `${start.toLocaleString()} – ${end.toLocaleString()}`;
      return { id: slot.id || label, label };
    })
    .filter(Boolean),
);
</script>

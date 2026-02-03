<template>
  <main class="h-frame-h overflow-hidden">
    <TimelineStage :time-slots="timeSlots" />
  </main>
</template>

<script setup>
import { timeSlots } from '../timeline/store/visits';
</script>

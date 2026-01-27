<template>
  <main class="w-frame-w h-frame-h">
    <TimelineStage :time-slots="timeSlots" />
  </main>
</template>

<script setup>
import { timeSlots } from '../timeline/store/visits';
</script>

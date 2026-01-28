<template>
  <div
    :style="{ width: `${randomWidth}%`, left: `${randomOffset}%` }"
    class="h-[1px] bg-primary"
  ></div>
</template>

<script setup>
const randomWidth = Math.floor(Math.random() * 80) + 20;
const randomOffset = Math.floor(Math.random() * (100 - randomWidth)) + 0;
</script>

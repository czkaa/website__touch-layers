<template>
  <div
    :style="{ height: `${randomHeight}%`, top: `${randomOffset}%` }"
    class="w-[1px] bg-primary relative"
  ></div>
</template>

<script setup>
const randomHeight = Math.floor(Math.random() * 80) + 20;
const randomOffset = Math.floor(Math.random() * (100 - randomHeight));
</script>

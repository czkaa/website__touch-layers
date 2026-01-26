<template>
  <div class="absolute z-[3]" :style="style">
    <div
      class="absolute left-[calc(var(--depth)/2)] w-1 h-[calc(100%-var(--depth)/4)] bg-pole rounded-b-[10rem]"
    ></div>
    <div
      class="absolute right-[calc(var(--depth)/2)] w-1 h-[calc(100%-var(--depth)/4)] bg-pole rounded-b-[10rem]"
    ></div>

    <div
      class="absolute left-[calc(var(--depth))] w-1 h-[calc(100%-var(--depth)/2)] bg-pole rounded-b-[10rem]"
    ></div>
    <div
      class="absolute right-[calc(var(--depth)/-2)] w-1 h-[calc(100%-var(--depth)/6)] bg-pole rounded-b-[10rem] -mt-[calc(var(--depth)/2)]"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  style: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.no-visit {
  position: absolute;
}
</style>

<template>
  <article class="absolute front element" :style="mergedStyle">
    <div class="bottom element -z-10" v-if="!isContinuation"></div>
    <div
      class="opacity-70 w-full h-full front overflow-hidden border-x-[0.5px] border-white bg-[rgba(50,50,50,1)]"
      :class="{
        'border-b-[0.5px] ': !isContinuation,
        'border-t-[0.5px] ': isLastSegment,
      }"
    >
      <div :style="frontStyle" class="w-[70vw] h-[80vh]"></div>
    </div>
    <div
      class="top element relative overflow-hidden"
      :style="topStyle"
      v-if="isLastSegment"
    ></div>
    <div class="side element"></div>
  </article>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  isContinuation: {
    type: Boolean,
    default: false,
  },
  isLastSegment: {
    type: Boolean,
    default: false,
  },
  style: {
    type: Object,
    required: true,
  },
});

const palette = [
  ['#ff7e5b', '#ffd666'],
  ['#7affc6', '#6aa8ff'],
  ['#ff93e8', '#8cff82'],
  ['#ffcd82', '#ff6ebe'],
  ['#8cf0ff', '#7da0ff'],
  ['#ff7878', '#ffff78'],
  ['#b4ff78', '#78ffe6'],
  ['#ffb25a', '#8c6eff'],
];

const gradientsById = new Map();

const hashId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildGradients = (colors, seed) => {
  const rand = mulberry32(seed);
  const randomBetween = (min, max) => min + (max - min) * rand();
  const stop1 = Math.round(randomBetween(0, 10));
  const stop2 = Math.round(randomBetween(15, 25));
  const stop3 = Math.round(randomBetween(35, 45));
  const darkEdge = 'rgba(50, 50, 50, 1)';
  return {
    linear: `linear-gradient(90deg,
      ${darkEdge} 0%,
      ${darkEdge} ${stop1}%,
      ${colors[0]} ${stop2}%,
      ${colors[1]} ${stop3}%,
      ${colors[1]} ${100 - stop3}%,
      ${colors[0]} ${100 - stop2}%,
      ${darkEdge} ${100 - stop1}%,
      ${darkEdge} 100%)`,
    radial: `radial-gradient(ellipse at center bottom,
      ${colors[0]} ${stop1}%,
      ${colors[0]} ${stop2}%,
      ${darkEdge} ${stop3 + 10}%)`,
  };
};

const gradientsForId = (id) => {
  if (gradientsById.has(id)) {
    return gradientsById.get(id);
  }
  const hash = hashId(id);
  const colors = palette[hash % palette.length];
  const gradients = buildGradients(colors, hash);
  gradientsById.set(id, gradients);
  return gradients;
};

onBeforeMount(() => {
  gradientsForId(props.id);
});

const frontStyle = computed(() => {
  const { linear } = gradientsForId(props.id);
  return {
    backgroundImage: `${linear}`,
    backgroundAttachment: 'fixed',
    transform: `translateX(-${props.style.left})`,
  };
});

const topStyle = computed(() => {
  const { radial } = gradientsForId(props.id);
  return {
    backgroundPositionY: '-10%',
    backgroundSize: '75vw auto',
    backgroundRepeat: 'no-repeat',
    backgroundImage: `${radial}`,
  };
});

const mergedStyle = computed(() => ({
  ...props.style,
}));
</script>

<style>
:root {
  --top-angle: -60deg;
  --side-angle: -30deg;
  --side-depth-multiplier: 1.7;
}

/* TOP */
.top {
  position: absolute;
  top: 0;
  left: -1px;
  background: #4c4c4c;
  width: calc(100% + 1px);
  height: var(--depth);
  transform: translateY(-100%) skewX(var(--top-angle));
  transform-origin: left bottom;
  opacity: 0.5;
  border-top: 0.5px solid rgba(255, 255, 255, 1);
  border-right: 0.5px solid rgba(255, 255, 255, 1);
  border-left: 0.5px solid rgba(255, 255, 255, 1);
}

.bottom {
  position: absolute;
  top: 100%;
  left: -1px;
  background: #4c4c4c;
  width: calc(100% + 1px);
  height: var(--depth);
  transform: translateY(-100%) skewX(var(--top-angle));
  transform-origin: left bottom;
  opacity: 0.5;
  border-bottom: 0.5px solid rgba(255, 255, 255, 1);
}

/* SIDE */
.side {
  position: absolute;
  top: 0;
  right: 0;
  width: calc(var(--depth) * var(--side-depth-multiplier));
  height: 100%;
  transform: skewY(var(--side-angle)) translateX(100%);
  transform-origin: right top;
  opacity: 0.5;
  background: #242424;
  border-bottom: 0.5px solid rgba(255, 255, 255, 1);
  border-right: 0.5px solid rgba(255, 255, 255, 1);
}
</style>

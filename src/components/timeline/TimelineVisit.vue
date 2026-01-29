<template>
  <article
    class="absolute front element"
    :style="mergedStyle"
    data-visit="true"
    :data-segment-id="segmentId || null"
  >
    <div
      class="bottom element opacity-25 rounded-[2px]"
      v-if="!isContinuation"
    ></div>
    <div class="opacity-95 w-full h-full front overflow-hidden">
      <div :style="frontStyle" class="relative w-[66vh] h-full"></div>
    </div>
    <div
      class="top element overflow-hidden opacity-50 rounded-[2px]"
      v-show="isLastSegment"
    >
      <div
        :style="frontStyle"
        class="relative w-[66vh] h-full opacity-50"
      ></div>
    </div>
    <div
      class="side element opacity-50 border-primary"
      :class="[isHighlighted ? 'bg-[lime]' : 'bg-gray-500']"
    ></div>
  </article>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  segmentId: {
    type: String,
    default: null,
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
  isHighlight: {
    type: Boolean,
    default: null,
  },
});

const route = useRoute();
const isHighlighted = computed(
  () => props.isHighlight && route.name === 'visitor',
);

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
  const percentageLeft = parseFloat(props.style.left);
  const percentageWidth = parseFloat(props.style.width);
  return isHighlighted.value
    ? { background: 'lime' }
    : {
        backgroundImage: `${linear}`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        left: `-${percentageLeft * (100 / percentageWidth)}%`,
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
  --highlight-color: rgb(0, 255, 55);
}

.element {
  border-radius: 1px;
}

.is-highlighed {
  /* filter: drop-shadow(0 0 10px rgb(88, 133, 255))
    drop-shadow(0 0 10px rgb(88, 133, 255)); */
}

/* TOP */
.top {
  position: absolute;
  top: 0;
  background: #4c4c4c;
  width: calc(100% + 2px);
  height: var(--depth);
  transform: translateY(-100%) skewX(var(--top-angle));
  transform-origin: left bottom;
}

.bottom {
  position: absolute;
  top: 100%;
  left: -2px;
  background: #2d2d2d;
  width: calc(100% + 2px);
  height: var(--depth);
  transform: translateY(-100%) skewX(var(--top-angle));
  transform-origin: left bottom;
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
}
</style>

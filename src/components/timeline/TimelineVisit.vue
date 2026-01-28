<template>
  <article
    class="absolute front element"
    :style="mergedStyle"
    data-visit="true"
    :data-segment-id="segmentId || null"
    :class="isZooming ? 'opacity-20' : 'opacity-50'"
  >
    <div class="bottom element opacity-25" v-if="!isContinuation"></div>
    <div
      class="opacity-80 w-full h-full front overflow-hidden"
      :class="[
        isHighlighted
          ? 'border-[var(--highlight-color)] is-highlighed'
          : 'border-primary bg-[rgba(50,50,50,1)]',
        {
          'border-t-[0.5px]': !isZooming && isLastSegment && !isHighlighted,
          'border-t-[2px]': !isZooming && isLastSegment && isHighlighted,
          'border-b-[0.5px]': !isZooming && !isContinuation && !isHighlighted,
          'border-b-[2px]': !isZooming && !isContinuation && isHighlighted,
          'border-x-[0.5px]': !isZooming && !isHighlighted,
          'border-x-[2px]': !isZooming && isHighlighted,
        },
      ]"
    >
      <div
        :style="frontStyle"
        class="w-[75vw] h-[80vh] transition-opacity duration-500 ease-out"
        :class="isZooming ? 'opacity-0' : 'opacity-100'"
      ></div>
    </div>
    <div
      class="top element relative overflow-hidden transition-opacity duration-500 ease-out"
      :style="topStyle"
      :class="[
        isHighlighted
          ? 'border-[var(--highlight-color)]  border-y-[2px] border-x-[4px] is-highlighed'
          : 'border-primary border-[0.5px]',
      ]"
      v-show="isLastSegment"
    ></div>
    <div
      class="side element opacity-50"
      :class="[
        isHighlighted
          ? 'border-[var(--highlight-color)] is-highlighed'
          : 'border-primary',
        {
          'border-t-[0.5px]': !isZooming && isLastSegment && !isHighlighted,
          'border-b-[2px]': !isZooming && !isContinuation && !isHighlighted,
          'border-t-[0.5px]': !isZooming && isLastSegment && isHighlighted,
          'border-b-[2px]': !isZooming && !isContinuation && isHighlighted,
          'border-x-[0.5px]': !isZooming && !isHighlighted,
          'border-x-[2px]': !isZooming && isHighlighted,
        },
      ]"
      v-if="!isZooming"
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

import { useZoomState } from '../timeline/store/zoomState';

const { isZooming } = useZoomState();

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
    backgroundSize: '80vw auto',
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
  left: -2px;
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
  background: #242424;
}
</style>

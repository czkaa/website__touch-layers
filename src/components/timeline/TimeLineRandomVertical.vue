<template>
  <div
    class="absolute w-full h-full top-0 left-0 px-outer-2 flex justify-between"
  >
    <TimeLineRandomVerticalLine
      v-for="n in 6"
      :key="n"
      :class="{ 'opacity-0': n === 1 || n === 6 }"
    />
  </div>
</template>

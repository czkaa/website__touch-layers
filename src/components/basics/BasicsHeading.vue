<template>
  <component
    :is="tag"
    lang="de"
    basics-heading
    :class="[
      '',
      {
        'text-md': size === 'md',
        'text-sm-wide mb-xs': size === 'sm',
      },
    ]"
  >
    {{ text }}
  </component>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
  },
  tag: {
    type: String,
    default: 'h3',
  },
  size: {
    type: String,
    default: 'small',
  },
});
</script>

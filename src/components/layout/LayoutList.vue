<template>
  <section class="w-full">
    <template v-for="(visitor, index) in sortedVisitors" :key="visitor.id">
      <LayoutListItem
        :visitor="visitor"
        :now="now"
        :index="visitors.length - index - 1"
        :is-current="visitor.id === currentId"
      />
      <div class="w-full border-b border-primary mb-xs"></div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useVisitorSocket } from '../timeline/store/visitorSocket';
import LayoutListItem from './LayoutListItem.vue';

const props = defineProps({
  currentId: {
    type: String,
    default: '',
  },
});

const { visitors, now, connect } = useVisitorSocket();

const sortedVisitors = computed(() =>
  [...visitors.value].sort((a, b) => {
    const aTime = a.enteredAt ? new Date(a.enteredAt).getTime() : 0;
    const bTime = b.enteredAt ? new Date(b.enteredAt).getTime() : 0;
    return bTime - aTime;
  }),
);

onMounted(() => {
  connect();
});
</script>

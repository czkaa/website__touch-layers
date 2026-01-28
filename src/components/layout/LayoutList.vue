<template>
  <section class="w-full">
    <LayoutListItem
      v-for="(visitor, index) in sortedVisitors"
      :key="visitor.id"
      :visitor="visitor"
      :now="now"
      :index="index"
    />
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useVisitorSocket } from '../timeline/store/visitorSocket';
import LayoutListItem from './LayoutListItem.vue';

const { visitors, now, connect } = useVisitorSocket();

const sortedVisitors = computed(() =>
  [...visitors.value].sort((a, b) => {
    const aTime = a.enteredAt ? new Date(a.enteredAt).getTime() : 0;
    const bTime = b.enteredAt ? new Date(b.enteredAt).getTime() : 0;
    return aTime - bTime;
  }),
);

onMounted(() => {
  connect();
});
</script>

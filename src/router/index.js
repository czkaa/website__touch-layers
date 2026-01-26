import { createRouter, createWebHistory } from 'vue-router';
import Index from '../views/Index.vue';
import Visitor from '../views/Visitor.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'index',
      component: Index,
    },
    {
      path: '/visitor',
      name: 'visitor',
      component: Visitor,
    },
  ],
});

export default router;

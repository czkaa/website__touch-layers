import { createRouter, createWebHistory } from 'vue-router';
import Screen from '../views/Screen.vue';
import Visitor from '../views/Visitor.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'screen',
      component: Screen,
    },
    {
      path: '/visitor',
      name: 'visitor',
      component: Visitor,
    },
  ],
});

export default router;

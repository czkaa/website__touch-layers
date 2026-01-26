import './assets/main.css';
import { createApp } from 'vue/dist/vue.esm-bundler';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

import lazysizes from 'lazysizes';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia).use(router);

app.mount('#app');

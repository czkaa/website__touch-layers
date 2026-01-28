import { ref } from 'vue';

const isZooming = ref(false);
let timer = null;

const setZooming = (value) => {
  isZooming.value = value;
};

const setZoomingFor = (ms = 1000) => {
  isZooming.value = true;
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    isZooming.value = false;
    timer = null;
  }, ms);
};

export const useZoomState = () => ({
  isZooming,
  setZooming,
  setZoomingFor,
});

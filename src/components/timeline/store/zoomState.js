import { ref } from 'vue';

const isZooming = ref(false);
const isZoomed = ref(false);
let timer = null;

const setZooming = (value) => {
  isZooming.value = value;
};

const setZoomed = (value) => {
  isZoomed.value = value;
};

const setZoomingFor = () => {
  isZooming.value = true;
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    isZooming.value = false;
    timer = null;
  }, 1200);
};

export const useZoomState = () => ({
  isZooming,
  isZoomed,
  setZooming,
  setZoomed,
  setZoomingFor,
});

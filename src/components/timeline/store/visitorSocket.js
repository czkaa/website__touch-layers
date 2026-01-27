import { ref } from 'vue';
import throttle from 'lodash.throttle';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

const visitors = ref([]);
const status = ref('idle');
const now = ref(Date.now());

let ws = null;
let timer = null;
let isConnected = false;
const pendingMessages = [];
const THROTTLE_MS = 200;
const applyVisitors = throttle((next) => {
  visitors.value = next;
}, THROTTLE_MS);

const ensureSessionId = () => {
  const stored = sessionStorage.getItem('visitor-session-id');
  if (stored) {
    return stored;
  }
  const id = `tab_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem('visitor-session-id', id);
  return id;
};

const getSessionId = () => sessionStorage.getItem('visitor-session-id');

const sendRaw = (payload) => {
  const message = JSON.stringify(payload);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  } else {
    pendingMessages.push(message);
  }
};

const flushPending = () => {
  while (pendingMessages.length && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(pendingMessages.shift());
  }
};

const connect = (url = WS_URL) => {
  if (isConnected) {
    return;
  }
  isConnected = true;
  status.value = 'connecting';
  ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    status.value = 'open';
    flushPending();
  });

  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'visitors' && Array.isArray(data.visitors)) {
        applyVisitors(data.visitors);
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.addEventListener('close', () => {
    status.value = 'closed';
  });

  ws.addEventListener('error', () => {
    status.value = 'error';
  });

  if (!timer) {
    timer = setInterval(() => {
      now.value = Date.now();
    }, 1000);
  }
};

const sendEnter = () => {
  const id = ensureSessionId();
  const enteredAt = new Date().toISOString();
  sendRaw({ type: 'enter', id, enteredAt });
  return { id, enteredAt };
};

const sendLeave = () => {
  const id = ensureSessionId();
  const leftAt = new Date().toISOString();
  sendRaw({ type: 'leave', id, leftAt });
  return { id, leftAt };
};

const disconnect = () => {
  if (ws) {
    ws.close();
  }
  ws = null;
  isConnected = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

export const useVisitorSocket = () => ({
  visitors,
  status,
  now,
  connect,
  sendEnter,
  sendLeave,
  disconnect,
  getSessionId,
});

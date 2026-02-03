import { ref } from 'vue';
import throttle from 'lodash.throttle';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

const visitors = ref([]);
const status = ref('idle');
const now = ref(Date.now());

let ws = null;
let timer = null;
let isConnected = false;
let heartbeatTimer = null;
let reconnectTimer = null;
let shouldReconnect = true;
const pendingMessages = [];
const THROTTLE_MS = 0;
const applyVisitors = throttle((next) => {
  visitors.value = next;
}, THROTTLE_MS);

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return `fp${hash.toString(16).padStart(8, '0')}`;
};

const getFingerprintSource = () => {
  if (typeof navigator === 'undefined') {
    return '';
  }
  const ua = navigator.userAgent || '';
  const device = /iPad|Tablet/i.test(ua)
    ? 'tablet'
    : /Mobi|Android|iPhone/i.test(ua)
      ? 'mobile'
      : 'desktop';
  const browser =
    /Edg/i.test(ua) || /EdgiOS/i.test(ua)
      ? 'Edge'
      : /OPR/i.test(ua)
        ? 'Opera'
        : /FxiOS/i.test(ua) || /Firefox/i.test(ua)
          ? 'Firefox'
          : /CriOS/i.test(ua) ||
              (/Chrome/i.test(ua) && !/Edg|OPR|Brave/i.test(ua))
            ? 'Chrome'
            : /Safari/i.test(ua) &&
                !/Chrome|CriOS|FxiOS|Edg|EdgiOS|OPR/i.test(ua)
              ? 'Safari'
              : 'Other';
  const screenValue =
    typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : '';
  const timezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      : '';
  return [
    ua,
    device,
    browser,
    navigator.language || '',
    timezone,
    screenValue,
  ].join('|');
};

let sessionId = null;

const ensureSessionId = () => {
  if (sessionId) {
    return sessionId;
  }
  sessionId = `tab_${Math.random().toString(36).slice(2, 10)}`;
  return sessionId;
};

const getSessionId = () => sessionId;
const clearSessionId = () => {
  sessionId = null;
};

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

const clearHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

const clearReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const getClientMeta = () => {
  if (typeof navigator === 'undefined') {
    return {};
  }
  const ua = navigator.userAgent || '';
  const device = /iPad|Tablet/i.test(ua)
    ? 'tablet'
    : /Mobi|Android|iPhone/i.test(ua)
      ? 'mobile'
      : 'desktop';
  const browser =
    /Edg/i.test(ua) || /EdgiOS/i.test(ua)
      ? 'Edge'
      : /OPR/i.test(ua)
        ? 'Opera'
        : /FxiOS/i.test(ua) || /Firefox/i.test(ua)
          ? 'Firefox'
          : /CriOS/i.test(ua) ||
              (/Chrome/i.test(ua) && !/Edg|OPR|Brave/i.test(ua))
            ? 'Chrome'
            : /Safari/i.test(ua) &&
                !/Chrome|CriOS|FxiOS|Edg|EdgiOS|OPR/i.test(ua)
              ? 'Safari'
              : 'Other';
  const screenValue =
    typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : null;
  const fingerprint = hashString(getFingerprintSource());
  return {
    userAgent: navigator.userAgent || null,
    device,
    browser,
    language: navigator.language || null,
    timezone:
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || null
        : null,
    screen: screenValue,
    fingerprint,
  };
};

const connect = (urlOrOptions = WS_URL, maybeOptions = {}) => {
  const isUrl = typeof urlOrOptions === 'string';
  const url = isUrl ? urlOrOptions : WS_URL;
  const options = isUrl ? maybeOptions : urlOrOptions || {};
  const { reconnect = true } = options;
  if (isConnected) {
    return;
  }
  shouldReconnect = reconnect;
  clearReconnect();
  isConnected = true;
  status.value = 'connecting';
  ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    status.value = 'open';
    flushPending();
    clearHeartbeat();
    heartbeatTimer = setInterval(() => {
      sendRaw({ type: 'ping', ts: Date.now() });
    }, 30000);
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
    clearHeartbeat();
    isConnected = false;
    if (shouldReconnect) {
      clearReconnect();
      reconnectTimer = setTimeout(() => {
        connect(url);
      }, 2000);
    }
  });

  ws.addEventListener('error', () => {
    status.value = 'error';
    clearHeartbeat();
    isConnected = false;
    if (shouldReconnect) {
      clearReconnect();
      reconnectTimer = setTimeout(() => {
        connect(url);
      }, 2000);
    }
  });

  if (!timer) {
    let last = 0;
    const tick = (ts) => {
      if (ts - last >= 1000 / 30) {
        last = ts;
        now.value = Date.now();
      }
      timer = requestAnimationFrame(tick);
    };
    timer = requestAnimationFrame(tick);
  }
};

const sendEnter = () => {
  const id = ensureSessionId();
  const enteredAt = new Date().toISOString();
  sendRaw({ type: 'enter', id, enteredAt, meta: getClientMeta() });
  return { id, enteredAt };
};

const sendLeave = () => {
  const id = ensureSessionId();
  const leftAt = new Date().toISOString();
  sendRaw({ type: 'leave', id, leftAt });
  return { id, leftAt };
};

const disconnect = () => {
  shouldReconnect = false;
  clearReconnect();
  clearHeartbeat();
  if (ws) {
    ws.close();
  }
  ws = null;
  isConnected = false;
  if (timer) {
    cancelAnimationFrame(timer);
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
  clearSessionId,
});

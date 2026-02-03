<template>
  <LayoutOverlay>
    <p class="border-b border-primary p-xs">
      Does a website exist if nobody visits it? Without a connection between
      server, screen, and user, it is just code. A website only comes to life
      through use and the time spent on it. Yet this time remains invisible.
      Although speed and immediacy are optimised, loading times are shortened
      and responses are made instant, time itself disappears in the process.<br /><br />

      But what if time became the material, if the duration of presence and
      absence, the rhythm of arrivals and departures and the overlap of
      simultaneous visits were made visible? Digital spaces are collective, yet
      they feel solitary. Although multiple people can be present at the same
      time, each person experiences the space alone and is unaware of the
      others. Every visit automatically transmits data such as browser type,
      operating system and time zone. This digital fingerprint marks each
      connection in ways that most people never notice.<br /><br />

      This work collects these traces and transforms them into form. It builds a
      collective object from what is usually hidden: time, presence, absence,
      simultaneity and the fingerprints that mark each connection.
    </p>
    <LayoutList :current-id="currentId" />
  </LayoutOverlay>
</template>

<script setup>
defineProps({
  currentId: {
    type: String,
    default: '',
  },
});
</script>

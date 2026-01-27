const toRange = (range) => {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return null;
  }
  return { ...range, startMs, endMs };
};

const sortByStart = (a, b) => a.startMs - b.startMs;

const buildSlotMeta = (slots) => {
  let totalMs = 0;
  const meta = slots.map((slot) => {
    const entry = { ...slot, offsetMs: totalMs };
    totalMs += slot.endMs - slot.startMs;
    return entry;
  });
  return { meta, totalMs: Math.max(totalMs, 1) };
};

const slotForTime = (slots, ms) =>
  slots.find((slot) => ms >= slot.startMs && ms < slot.endMs);

const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

const buildSegmentsForSlot = (slot, visits, timeToRatio, nowMs) => {
  const segments = [];
  const noVisits = [];
  const overlapRanges = visits
    .filter((visit) => overlaps(visit.startMs, visit.endMs, slot.startMs, slot.endMs))
    .map((visit) => ({
      visit,
      start: Math.max(visit.startMs, slot.startMs),
      end: Math.min(visit.endMs, slot.endMs),
    }))
    .filter((range) => range.end > range.start);

  const boundaries = new Set([
    slot.startMs,
    slot.endMs,
    ...overlapRanges.flatMap((range) => [range.start, range.end]),
  ]);
  if (Number.isFinite(nowMs) && nowMs > slot.startMs && nowMs < slot.endMs) {
    boundaries.add(nowMs);
  }
  const ordered = Array.from(boundaries).sort((a, b) => a - b);

  for (let i = 0; i < ordered.length - 1; i += 1) {
    const segStart = ordered[i];
    const segEnd = ordered[i + 1];
    if (segEnd <= segStart) {
      continue;
    }

    const active = overlapRanges
      .filter((range) => overlaps(range.start, range.end, segStart, segEnd))
      .map((range) => range.visit)
      .sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));

    const startRatio = timeToRatio(segStart);
    const endRatio = timeToRatio(segEnd);
    if (startRatio == null || endRatio == null) {
      continue;
    }

    if (active.length === 0) {
      const duration = Math.max(endRatio - startRatio, 0);
      noVisits.push({
        id: `gap-${segStart}`,
        segStart,
        style: {
          bottom: `${startRatio * 100}%`,
          height: `${duration * 100}%`,
          left: '0%',
          width: '100%',
        },
      });
      continue;
    }

    const laneWidth = 100 / active.length;
    active.forEach((visit, index) => {
      const duration = Math.max(endRatio - startRatio, 0);
      segments.push({
        id: `${visit.id}-${segStart}`,
        visitId: visit.id,
        segEnd,
        segStart,
        hourStartMs: new Date((segStart + segEnd) / 2).setMinutes(0, 0, 0),
        centerRatio: (startRatio + endRatio) / 2,
        style: {
          bottom: `${startRatio * 100}%`,
          height: `${duration * 100}%`,
          left: `${index * laneWidth}%`,
          width: `${laneWidth}%`,
        },
      });
    });
  }

  return { segments, noVisits };
};

export const buildTimelineLayout = ({ visits, timeSlots, hourMs, nowMs }) => {
  const sortedVisits = (visits || [])
    .map((visit) => toRange(visit))
    .filter(Boolean)
    .sort(sortByStart);

  const slots = (timeSlots || [])
    .map((slot) => toRange(slot))
    .filter(Boolean)
    .sort(sortByStart);

  const slotRanges =
    slots.length > 0
      ? slots
      : sortedVisits.length > 0
        ? [
            {
              id: 'slot-fallback',
              startMs: sortedVisits[0].startMs,
              endMs: sortedVisits[sortedVisits.length - 1].endMs,
            },
          ]
        : [];

  const { meta: slotMeta, totalMs: safeTotalMs } = buildSlotMeta(slotRanges);

  const timeToRatio = (ms) => {
    const slot = slotForTime(slotMeta, ms);
    if (!slot) {
      return null;
    }
    const offset = slot.offsetMs + (ms - slot.startMs);
    return offset / safeTotalMs;
  };

  const segments = [];
  const noVisits = [];

  slotMeta.forEach((slot) => {
    const { segments: slotSegments, noVisits: slotGaps } = buildSegmentsForSlot(
      slot,
      sortedVisits,
      timeToRatio,
      nowMs,
    );
    segments.push(...slotSegments);
    noVisits.push(...slotGaps);
  });

  const lastSegmentByVisit = new Map();
  segments
    .slice()
    .sort((a, b) => a.segStart - b.segStart)
    .forEach((segment) => {
      const prev = lastSegmentByVisit.get(segment.visitId);
      segment.isContinuation = prev?.segEnd === segment.segStart;
      lastSegmentByVisit.set(segment.visitId, { segEnd: segment.segEnd });
    });

  const maxEndByVisit = new Map();
  segments.forEach((segment) => {
    const prevEnd = maxEndByVisit.get(segment.visitId);
    if (prevEnd == null || segment.segEnd > prevEnd) {
      maxEndByVisit.set(segment.visitId, segment.segEnd);
    }
  });
  segments.forEach((segment) => {
    segment.isLastSegment = segment.segEnd === maxEndByVisit.get(segment.visitId);
  });

  const hours = [];
  for (const slot of slotMeta) {
    const startHour = new Date(slot.startMs);
    startHour.setMinutes(0, 0, 0);
    const endHour = new Date(slot.endMs);
    endHour.setMinutes(0, 0, 0);
    const endIsExactHour = slot.endMs === endHour.getTime();
    const lastHour = endIsExactHour ? endHour.getTime() - hourMs : endHour.getTime();

    for (let t = startHour.getTime(); t <= lastHour; t += hourMs) {
      const ratio = timeToRatio(t);
      if (ratio == null) {
        continue;
      }
      const markDate = new Date(t);
      const dateKey = markDate.toISOString().slice(0, 10);
      hours.push({
        id: `hour-${t}`,
        offset: ratio,
        label: markDate.toTimeString().slice(0, 5),
        dateKey,
        startMs: t,
      });
    }
  }

  const items = [
    ...segments.map((segment) => ({ ...segment, type: 'visit' })),
    ...noVisits.map((gap) => ({ ...gap, type: 'gap' })),
  ].sort((a, b) => (a.segStart ?? 0) - (b.segStart ?? 0));

  return { items, hours };
};

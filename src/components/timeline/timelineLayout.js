// Normalize ISO strings into { startMs, endMs } and drop invalid ranges.
const toRange = (range) => {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return null;
  }
  return { ...range, startMs, endMs };
};

// Sort ranges by start time.
const sortByStart = (a, b) => a.startMs - b.startMs;

const itemCache = new Map();

const sameStyle = (a, b) =>
  a?.bottom === b?.bottom &&
  a?.height === b?.height &&
  a?.left === b?.left &&
  a?.width === b?.width;

const sameItem = (a, b) =>
  a?.type === b?.type &&
  a?.visitId === b?.visitId &&
  a?.segStart === b?.segStart &&
  a?.segEnd === b?.segEnd &&
  a?.isContinuation === b?.isContinuation &&
  a?.isLastSegment === b?.isLastSegment &&
  a?.visitFingerprint === b?.visitFingerprint &&
  sameStyle(a?.style, b?.style);

const reuseItem = (item) => {
  const cached = itemCache.get(item.id);
  if (cached && sameItem(cached, item)) {
    return cached;
  }
  itemCache.set(item.id, item);
  return item;
};

// True if two ranges overlap (open interval).
const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

// Use explicit slots if provided, otherwise a single slot spanning all visits.
const buildSlots = (timeSlots, visits) => {
  if (timeSlots.length) return timeSlots;
  if (!visits.length) return [];
  return [
    {
      id: 'slot-fallback',
      startMs: visits[0].startMs,
      endMs: visits[visits.length - 1].endMs,
    },
  ];
};

// Compute slot heights as percentages across the whole timeline (all slots stacked end-to-end).
const buildSlotTimeline = (slots) => {
  const totalMs = Math.max(
    slots.reduce((sum, slot) => sum + (slot.endMs - slot.startMs), 0),
    1,
  );
  let offsetMs = 0;
  return slots.map((slot) => {
    const durationMs = slot.endMs - slot.startMs;
    const startPct = (offsetMs / totalMs) * 100;
    const heightPct = (durationMs / totalMs) * 100;
    offsetMs += durationMs;
    return { ...slot, durationMs, startPct, heightPct };
  });
};

// Map a real timestamp into a 0..100 percentage across the slot timeline.
const timeToPct = (slot, ms) => {
  if (ms < slot.startMs || ms >= slot.endMs) {
    return null;
  }
  const offsetMs = ms - slot.startMs;
  return slot.startPct + (offsetMs / slot.durationMs) * slot.heightPct;
};

// Build all segment boundaries inside a slot (visit starts/ends + now).
const buildBoundaries = (slot, overlapRanges, nowMs) => {
  const points = new Set([slot.startMs, slot.endMs]);
  overlapRanges.forEach((range) => {
    points.add(range.start);
    points.add(range.end);
  });
  if (Number.isFinite(nowMs) && nowMs > slot.startMs && nowMs < slot.endMs) {
    points.add(nowMs);
  }
  return Array.from(points).sort((a, b) => a - b);
};

// Split a slot into visit segments and gap segments.
const buildSegmentsForSlot = (slot, visits, nowMs) => {
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

  const boundaries = buildBoundaries(slot, overlapRanges, nowMs);

  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    if (segEnd <= segStart) {
      continue;
    }

    // Visits active during this slice of time.
    const activeVisits = overlapRanges
      .filter((range) => overlaps(range.start, range.end, segStart, segEnd))
      .map((range) => range.visit)
      .sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));

    const startPct = timeToPct(slot, segStart);
    const endPct = timeToPct(slot, segEnd);
    if (startPct == null || endPct == null) {
      continue;
    }

    const durationPct = Math.max(endPct - startPct, 0);

    // No visits => background gap segment.
    if (!activeVisits.length) {
      noVisits.push({
        id: `gap-${segStart}`,
        segStart,
        style: {
          bottom: `${startPct}%`,
          height: `${durationPct}%`,
          left: '0%',
          width: '100%',
        },
      });
      continue;
    }

    // Shared slice => split horizontally into lanes.
    const laneWidth = 100 / activeVisits.length;
    activeVisits.forEach((visit, index) => {
      segments.push({
        id: `${visit.id}-${segStart}`,
        visitId: visit.id,
        visitFingerprint: visit.fingerprint || null,
        segEnd,
        segStart,
        hourStartMs: new Date((segStart + segEnd) / 2).setMinutes(0, 0, 0),
        centerRatio: (startPct + endPct) / 200,
        style: {
          bottom: `${startPct}%`,
          height: `${durationPct}%`,
          left: `${index * laneWidth}%`,
          width: `${laneWidth}%`,
        },
      });
    });
  }

  return { segments, noVisits };
};

// Mark whether a segment continues directly from a previous segment.
const markVisitContinuations = (segments) => {
  const lastSegmentByVisit = new Map();
  segments
    .slice()
    .sort((a, b) => a.segStart - b.segStart)
    .forEach((segment) => {
      const prev = lastSegmentByVisit.get(segment.visitId);
      segment.isContinuation = prev?.segEnd === segment.segStart;
      lastSegmentByVisit.set(segment.visitId, { segEnd: segment.segEnd });
    });
};

// Mark the last segment per visit so caps render correctly.
const markVisitEndings = (segments) => {
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
};

// Main layout builder used by the timeline view.
export const buildTimelineLayout = ({ visits, timeSlots, nowMs }) => {
  const normalizedVisits = (visits || [])
    .map((visit) => toRange(visit))
    .filter(Boolean)
    .sort(sortByStart);

  const normalizedSlots = (timeSlots || [])
    .map((slot) => toRange(slot))
    .filter(Boolean)
    .sort(sortByStart);

  const slots = buildSlots(normalizedSlots, normalizedVisits);
  // Convert slots to percentages so all styling is relative to the same 0..100%.
  const slotTimeline = buildSlotTimeline(slots);

  const segments = [];
  const noVisits = [];

  slotTimeline.forEach((slot) => {
    const { segments: slotSegments, noVisits: slotGaps } =
      buildSegmentsForSlot(slot, normalizedVisits, nowMs);
    segments.push(...slotSegments);
    noVisits.push(...slotGaps);
  });

  markVisitContinuations(segments);
  markVisitEndings(segments);

  const items = [
    ...segments.map((segment) => ({ ...segment, type: 'visit' })),
    ...noVisits.map((gap) => ({ ...gap, type: 'gap' })),
  ]
    .map((item) => reuseItem(item))
    .sort((a, b) => (a.segStart ?? 0) - (b.segStart ?? 0));

  return { items };
};

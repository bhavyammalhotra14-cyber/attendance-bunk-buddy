export const ATTENDANCE_TARGET = 0.75;

export type AttendanceCounts = {
  present: number;
  absent: number;
};

export type AttendanceRisk = "on-track" | "caution" | "below-target";

export function adjustAttendanceCount(
  counts: AttendanceCounts,
  status: keyof AttendanceCounts,
  change: -1 | 1,
): AttendanceCounts {
  return { ...counts, [status]: Math.max(0, counts[status] + change) };
}

export function getAttendanceRate({ present, absent }: AttendanceCounts) {
  const total = present + absent;
  return total === 0 ? 0 : present / total;
}

export function getSafeBunks(counts: AttendanceCounts, target = ATTENDANCE_TARGET) {
  const { present, absent } = counts;
  const total = present + absent;
  if (total === 0 || getAttendanceRate(counts) < target) return 0;
  return Math.max(0, Math.floor((present - target * total) / target + 1e-9));
}

export function getRequiredClasses(counts: AttendanceCounts, target = ATTENDANCE_TARGET) {
  const { present, absent } = counts;
  const total = present + absent;
  if (total === 0 || getAttendanceRate(counts) >= target) return 0;
  if (target >= 1) return Infinity;
  return Math.ceil((target * total - present) / (1 - target));
}

export function getAttendanceRisk(counts: AttendanceCounts): AttendanceRisk {
  const rate = getAttendanceRate(counts);
  if (rate < ATTENDANCE_TARGET) return "below-target";
  if (getSafeBunks(counts) <= 2) return "caution";
  return "on-track";
}
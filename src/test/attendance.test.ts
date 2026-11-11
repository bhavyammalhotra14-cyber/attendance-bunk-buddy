import { describe, expect, it } from "vitest";

import { adjustAttendanceCount, getRequiredClasses, getSafeBunks } from "@/lib/attendance";

describe("attendance calculations at the 75% target", () => {
  it("allows two safe bunks at 18 present out of 22 classes", () => {
    expect(getSafeBunks({ present: 18, absent: 4 })).toBe(2);
  });

  it("requires four attended classes to recover from 23 present out of 32", () => {
    expect(getRequiredClasses({ present: 23, absent: 9 })).toBe(4);
  });

  it("lets students increase and decrease a class count without going below zero", () => {
    expect(adjustAttendanceCount({ present: 2, absent: 1 }, "present", 1)).toEqual({ present: 3, absent: 1 });
    expect(adjustAttendanceCount({ present: 2, absent: 1 }, "absent", -1)).toEqual({ present: 2, absent: 0 });
    expect(adjustAttendanceCount({ present: 0, absent: 0 }, "absent", -1)).toEqual({ present: 0, absent: 0 });
  });
});
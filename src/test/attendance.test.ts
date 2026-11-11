import { describe, expect, it } from "vitest";

import { getRequiredClasses, getSafeBunks } from "@/lib/attendance";

describe("attendance calculations at the 75% target", () => {
  it("allows two safe bunks at 18 present out of 22 classes", () => {
    expect(getSafeBunks({ present: 18, absent: 4 })).toBe(2);
  });

  it("requires four attended classes to recover from 23 present out of 32", () => {
    expect(getRequiredClasses({ present: 23, absent: 9 })).toBe(4);
  });
});
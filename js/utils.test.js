import fs from "fs";

import {
  getTimeObj,
  getTimeStr,
  clamp,
  parseViscolors,
  parseIni,
  normalize,
  denormalize,
  segment,
  moveSelected,
  spliceIn
} from "./utils";

const fixture = filename =>
  fs.readFileSync(`./js/__tests__/fixtures/${filename}`, "utf8");

describe("getTimeObj", () => {
  it("expresses seconds as an object", () => {
    const actual = getTimeObj(1234);
    const expected = {
      minutesFirstDigit: 2,
      minutesSecondDigit: 0,
      secondsFirstDigit: 3,
      secondsSecondDigit: 4
    };
    expect(actual).toEqual(expected);
  });
});

describe("getTimeStr", () => {
  it("expresses seconds as string", () => {
    const actual = getTimeStr(1234);
    const expected = "20:34";
    expect(actual).toEqual(expected);
  });
  it("pads with only one zero", () => {
    const actual = getTimeStr(5);
    const expected = "0:05";
    expect(actual).toEqual(expected);
  });
  it("truncates extra minutes", () => {
    const actual = getTimeStr(540000);
    const expected = "9000:00";
    expect(actual).toEqual(expected);
  });
});

describe("clamp", () => {
  it("respects the max value", () => {
    const actual = clamp(101, 0, 100);
    const expected = 100;
    expect(actual).toEqual(expected);
  });
  it("respects the min value", () => {
    const actual = clamp(0, 1, 100);
    const expected = 1;
    expect(actual).toEqual(expected);
  });
  it("respects the given value if in range", () => {
    const actual = clamp(50, 0, 100);
    const expected = 50;
    expect(actual).toEqual(expected);
  });
});

describe("parseViscolors", () => {
  it("can parse the default viscolors file", () => {
    const viscolors = fixture("VISCOLOR.TXT");
    const actual = parseViscolors(viscolors);
    const expected = [
      "rgb(0,0,0)",
      "rgb(24,33,41)",
      "rgb(239,49,16)",
      "rgb(206,41,16)",
      "rgb(214,90,0)",
      "rgb(214,102,0)",
      "rgb(214,115,0)",
      "rgb(198,123,8)",
      "rgb(222,165,24)",
      "rgb(214,181,33)",
      "rgb(189,222,41)",
      "rgb(148,222,33)",
      "rgb(41,206,16)",
      "rgb(50,190,16)",
      "rgb(57,181,16)",
      "rgb(49,156,8)",
      "rgb(41,148,0)",
      "rgb(24,132,8)",
      "rgb(255,255,255)",
      "rgb(214,214,222)",
      "rgb(181,189,189)",
      "rgb(160,170,175)",
      "rgb(148,156,165)",
      "rgb(150,150,150)"
    ];
    expect(actual).toEqual(expected);
  });
});

describe("parseIni", () => {
  it("can parse the default pledit.txt file", () => {
    const pledit = fixture("PLEDIT.TXT");
    const actual = parseIni(pledit);
    const expected = {
      text: {
        normal: "#00FF00",
        current: "#FFFFFF",
        normalbg: "#000000",
        selectedbg: "#0000FF",
        font: "Arial"
      }
    };
    expect(actual).toEqual(expected);
  });

  it("can parse TopazAmp's pledit.txt file", () => {
    const pledit = fixture("PLEDIT_TOPAZ.TXT");
    const actual = parseIni(pledit);
    const expected = {
      text: {
        normal: "#319593",
        current: "#89D8D1",
        normalbg: "#000000",
        selectedbg: "#2B4242",
        font: "Arial",
        mbbg: "#000000",
        mbfg: "#89D8D1"
      }
    };
    expect(actual).toEqual(expected);
  });

  it("allows space around =", () => {
    const actual = parseIni(`
[foo]
bar = baz
`);
    const expected = {
      foo: {
        bar: "baz"
      }
    };
    expect(actual).toEqual(expected);
  });

  it("can parse a pledit.txt file with quotes", () => {
    const pledit = fixture("PLEDIT_WITH_QUOTES.TXT");
    const actual = parseIni(pledit);
    const expected = {
      text: {
        normal: "#00FF00",
        current: "#FFFFFF",
        normalbg: "#000000",
        selectedbg: "#0000FF",
        font: "Ricky's cool font!"
      }
    };
    expect(actual).toEqual(expected);
  });

  it("allows quotes around values", () => {
    const actual = parseIni(`
[foo]
bar = "baz"
  `);
    const expected = {
      foo: {
        bar: "baz"
      }
    };
    expect(actual).toEqual(expected);
  });
});

test("normalize", () => {
  expect(normalize(1)).toBe(1);
  expect(normalize(64)).toBe(100);
});
test("denormalize", () => {
  expect(denormalize(1)).toBe(1);
  expect(denormalize(100)).toBe(64);
});

describe("segment", () => {
  it("can handle min", () => {
    expect(segment(0, 100, 0, [0, 1, 2])).toBe(0);
    expect(segment(1, 100, 1, [0, 1, 2])).toBe(0);
    expect(segment(-1, 100, -1, [0, 1, 2])).toBe(0);
  });
  it("can handle max", () => {
    //expect(segment(0, 100, 100, [0, 1, 2])).toBe(2);
    //expect(segment(1, 100, 100, [0, 1, 2])).toBe(2);
    expect(segment(-1, 100, 100, [0, 1, 2])).toBe(2);
  });
  it("can handle mid", () => {
    expect(segment(0, 2, 1, [0, 1, 2])).toBe(1);
    expect(segment(0, 2, 1.5, [0, 1, 2])).toBe(2);
    expect(segment(1, 3, 2.5, [0, 1, 2])).toBe(2);
    expect(segment(-1, 2, 0.5, [0, 1, 2])).toBe(1);
  });
  it("can handle various real wold cases", () => {
    expect(segment(-100, 100, -100, ["left", "center", "right"])).toBe("left");
    expect(segment(0, 100, 88, ["left", "center", "right"])).toBe("right");
    expect(segment(0, 100, 50, ["left", "center", "right"])).toBe("center");
  });
});

describe("moveSelected", () => {
  it("can drag a single item 1", () => {
    expect(
      moveSelected(
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        i => new Set([1]).has(i),
        1
      )
    ).toEqual(["a", "c", "b", "d", "e", "f", "g", "h"]);
  });
  it("can drag a single item", () => {
    expect(
      moveSelected(
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        i => new Set([1]).has(i),
        3
      )
    ).toEqual(["a", "c", "d", "e", "b", "f", "g", "h"]);
  });
  it("can drag consecutive items", () => {
    expect(
      moveSelected(
        ["a", "b", "c", "d", "e", "f", "g", "h"],
        i => new Set([1, 2]).has(i),
        3
      )
    ).toEqual(["a", "d", "e", "f", "b", "c", "g", "h"]);
  });
  it("works for a simple example", () => {
    const arr = [true, false, false];
    expect(moveSelected(arr, i => arr[i], 1)).toEqual([false, true, false]);
  });
  it("works for a simple negative example", () => {
    const arr = [false, false, true];
    expect(moveSelected(arr, i => arr[i], -1)).toEqual([false, true, false]);
  });
});

describe("spliceIn", () => {
  it("is immutable", () => {
    const original = [1, 2, 3];
    const spliced = spliceIn(original, 1, [200]);
    expect(spliced).not.toBe(original);
    expect(original).toEqual([1, 2, 3]);
  });
  it("adds values at the given index", () => {
    const spliced = spliceIn([1, 2, 3], 1, [200]);
    expect(spliced).toEqual([1, 200, 2, 3]);
  });
});

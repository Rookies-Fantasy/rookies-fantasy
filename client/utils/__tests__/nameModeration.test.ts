import { describe, expect, it } from "@jest/globals";
import {
  allowedNameTest,
  collapseSpacedLetters,
  containsObjectionableContent,
  isNameAllowed,
} from "@/utils/nameModeration";

describe("nameModeration", () => {
  describe("blocks objectionable names", () => {
    it.each([
      // Plain profanity, sexual terms and slurs
      "fuck",
      "Shit Show",
      "bitch ballers",
      "cunt",
      "whore house",
      "porn stars",
      "Big Dick Energy",
      "nigger",
      "faggots",
      "retards",
      "kike",
      "chink",
      "Nazi Ballers",
      "Hitler Hoopers",
      "KKK",
      "spic",
      "coon",
      // Case
      "FUCK",
      "ShIt",
      // Leetspeak / symbol substitution
      "sh1t",
      "b1tch",
      "FvCk",
      "n1gger",
      "a$$hole squad",
      // Repeated letters
      "fuuuuck",
      "shiiiit",
      // Separators between letters
      "f u c k",
      "f.u.c.k",
      "f-u-c-k",
      "s_h_i_t ballers",
      // Three-letter team abbreviations
      "FUK",
      "FCK",
      "FAG",
      "CUM",
      "ASS",
      "NIG",
      "KYS",
    ])("%s", (name) => {
      expect(containsObjectionableContent(name)).toBe(true);
      expect(isNameAllowed(name)).toBe(false);
    });
  });

  describe("allows normal names (Scunthorpe problem)", () => {
    it.each([
      "Scunthorpe",
      "Scunthorpe United",
      "assist",
      "Assist Kings",
      "Assassins",
      "Sussex",
      "Essex Hoopers",
      "class",
      "Class Act",
      "Glass Cannons",
      "Bass Pros",
      "Dick Van Arsdale",
      "Dickinson",
      "Dickey Simpkins",
      "Doug Peniston",
      "Cocktail Kings",
      "Hancock Hoops",
      "Matsushita",
      "Shiitake Mushrooms",
      "Analytics Nerds",
      "Uranus Rockets",
      "therapist",
      "Grape Escape",
      "Raccoons",
      "Spicy Buckets",
      "Japan",
      "Homestead",
      "Cumberland",
      "Title Town",
      "Shaq Attack",
      "Dikembe Block Party",
      "Splash Brothers",
      "Hoop Dreams",
      "Buckets",
      "Lakers",
      "Raptors",
      "Spurs",
      "Pick and Roll",
      "Rookies Fantasy League",
      "Friday Night Hoops",
      "jaychuang8",
      "AJ Lee",
      "A J Lee",
      "LAL",
      "BOS",
      "GSW",
      "PHX",
      "NYK",
    ])("%s", (name) => {
      expect(containsObjectionableContent(name)).toBe(false);
      expect(isNameAllowed(name)).toBe(true);
    });
  });

  describe("collapseSpacedLetters", () => {
    it("joins single letters split by separators", () => {
      expect(collapseSpacedLetters("f u c k")).toBe("fuck");
      expect(collapseSpacedLetters("f.u.c.k team")).toBe("fuck team");
    });

    it("leaves multi-letter words separate", () => {
      expect(collapseSpacedLetters("Glass Hoops")).toBe("Glass Hoops");
      expect(collapseSpacedLetters("A J Lee")).toBe("AJ Lee");
    });
  });

  describe("allowedNameTest", () => {
    it("passes empty values so `.required()` reports them", () => {
      expect(allowedNameTest.test(undefined)).toBe(true);
    });

    it("rejects objectionable values", () => {
      expect(allowedNameTest.test("sh1t")).toBe(false);
      expect(allowedNameTest.test("Splash Brothers")).toBe(true);
    });
  });
});

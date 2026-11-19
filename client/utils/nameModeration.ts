import {
  DataSet,
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  parseRawPattern,
  pattern,
} from "obscenity";
import { NameModerationMetadata } from "@/types/moderation";
import { isNil } from "@/utils/jsUtils";

// Shown under any name field (username, team name/abbreviation, league name)
// whose value the filter rejects. Deliberately vague so it doesn't teach users
// which spelling slips through.
export const NAME_NOT_ALLOWED_MESSAGE = "Please choose a different name";

// Real first/last names that obscenity's stock "dick"/"penis" patterns flag.
// NBA rosters (Dick Van Arsdale, Dickey Simpkins, Doug Peniston-style names)
// make these realistic team and username choices.
const DICK_NAME_EXCEPTIONS = [
  "benedick",
  "dickens",
  "dickety",
  "dickory",
  "dickinson",
  "dickerson",
  "dickey",
  "dickie",
  "dick van",
];
const PENIS_NAME_EXCEPTIONS = ["pen is", "peniston"];

// Slurs and hate terms that are not in obscenity's English preset. `|` marks a
// word boundary, so short terms like "spic" or "coon" don't match "spicy" or
// "raccoon".
const EXTRA_PATTERNS: { word: string; patterns: string[] }[] = [
  { word: "nazi", patterns: ["|nazi"] },
  { word: "hitler", patterns: ["hitler"] },
  { word: "heil", patterns: ["|heil|"] },
  { word: "spic", patterns: ["|spic|", "|spics|"] },
  { word: "coon", patterns: ["|coon|", "|coons|"] },
  { word: "gook", patterns: ["|gook"] },
  { word: "beaner", patterns: ["|beaner"] },
  { word: "wetback", patterns: ["wetback"] },
  { word: "raghead", patterns: ["raghead"] },
  { word: "towelhead", patterns: ["towelhead"] },
  { word: "nigga", patterns: ["|nig|", "nigga"] },
  { word: "fuck", patterns: ["|fuk|", "|fck|"] },
  { word: "kys", patterns: ["|kys|"] },
];

const dataset = new DataSet<NameModerationMetadata>()
  .addAll(englishDataset)
  .removePhrasesIf(
    (phrase) =>
      phrase.metadata?.originalWord === "dick" ||
      phrase.metadata?.originalWord === "penis",
  )
  .addPhrase((phrase) => {
    phrase
      .setMetadata({ originalWord: "dick" })
      .addPattern(pattern`|dck|`)
      .addPattern(pattern`dick`);
    DICK_NAME_EXCEPTIONS.forEach((term) => phrase.addWhitelistedTerm(term));
    return phrase;
  })
  .addPhrase((phrase) => {
    phrase
      .setMetadata({ originalWord: "penis" })
      .addPattern(pattern`pe[e]nis`)
      .addPattern(pattern`|pnis`);
    PENIS_NAME_EXCEPTIONS.forEach((term) => phrase.addWhitelistedTerm(term));
    return phrase;
  });

EXTRA_PATTERNS.forEach(({ word, patterns }) => {
  dataset.addPhrase((phrase) => {
    phrase.setMetadata({ originalWord: word });
    patterns.forEach((source) => phrase.addPattern(parseRawPattern(source)));
    return phrase;
  });
});

const built = dataset.build();

const matcher = new RegExpMatcher({
  blacklistedTerms: built.blacklistedTerms,
  // Words that the duplicate-collapsing transformer would otherwise reduce to
  // a profane stem ("shiitake" -> "shitake").
  whitelistedTerms: [...(built.whitelistedTerms ?? []), "shiitake"],
  ...englishRecommendedTransformers,
});

// Terms the duplicate-collapsing transformer erases ("kkk" -> "k"), so they
// are checked against the raw text instead.
const RAW_PATTERNS = [/\bk[\s._\-*]*k[\s._\-*]*k\b/i];

const SEPARATOR = /[\s._\-*~+|/\\,]+/;

// Joins runs of single characters split by separators ("f u c k", "f.u.c.k")
// back into one word, leaving multi-letter words untouched. Removing every
// separator instead would create false positives across word boundaries
// ("Glass Hoops" -> "glasshoops").
export const collapseSpacedLetters = (text: string): string => {
  const tokens = text.split(SEPARATOR).filter((token) => token.length > 0);
  const words: string[] = [];
  let run = "";

  tokens.forEach((token) => {
    if (token.length === 1) {
      run += token;
      return;
    }
    if (run.length > 0) {
      words.push(run);
      run = "";
    }
    words.push(token);
  });

  if (run.length > 0) {
    words.push(run);
  }

  return words.join(" ");
};

// True when `name` contains profanity, slurs or sexual terms, including simple
// evasions (case, leetspeak, repeated letters, spaced-out letters).
export const containsObjectionableContent = (name: string): boolean =>
  RAW_PATTERNS.some((rawPattern) => rawPattern.test(name)) ||
  matcher.hasMatch(name) ||
  matcher.hasMatch(collapseSpacedLetters(name));

export const isNameAllowed = (name: string): boolean =>
  !containsObjectionableContent(name);

// Yup test config for user-visible name fields. Empty values pass so the
// field's own `.required()` message is shown instead. `undefined` is part of
// yup's value type for optional strings, hence its use here.
export const allowedNameTest = {
  name: "allowed-name",
  message: NAME_NOT_ALLOWED_MESSAGE,
  test: (value: string | undefined) => isNil(value) || isNameAllowed(value),
};

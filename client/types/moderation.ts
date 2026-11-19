// Metadata attached to each phrase in the name-moderation word list
// (utils/nameModeration.ts). `originalWord` is the canonical term a pattern
// stands for, e.g. "fuck" for both `fuck` and `|fuk|`.
export type NameModerationMetadata = {
  originalWord: string;
};

// What a user is reporting when they flag another user's team from the Arena.
// Sent to support by email (utils/reportUtils.ts).
export type TeamNameReport = {
  teamName: string;
  teamId: string;
  matchupId: string;
  reporterUserId: string;
};

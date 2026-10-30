import { DocumentReference, Timestamp } from "firebase-admin/firestore";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

export type JsonObject = { [key: string]: JsonValue };

// The values a Firestore document can hold, as far as this CLI reads them.
type FirestoreValue =
  | string
  | number
  | boolean
  | null
  | Timestamp
  | DocumentReference
  | FirestoreValue[]
  | { [key: string]: FirestoreValue };

export const isJsonObject = (value: JsonValue): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getField = (value: JsonValue, key: string): JsonValue =>
  isJsonObject(value) && key in value ? value[key] : null;

export const getString = (value: JsonValue, key: string): string => {
  const field = getField(value, key);
  return typeof field === "string" ? field : "";
};

export const getNumber = (value: JsonValue, key: string): number | null => {
  const field = getField(value, key);
  return typeof field === "number" ? field : null;
};

export const getStringArray = (value: JsonValue, key: string): string[] => {
  const field = getField(value, key);
  return Array.isArray(field)
    ? field.filter((entry): entry is string => typeof entry === "string")
    : [];
};

export const parseJsonText = (text: string): JsonValue => {
  if (text.length === 0) {
    return null;
  }

  try {
    const parsed: JsonValue = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
};

// Timestamps become ISO strings and references become their paths, so stored
// evidence reads the same as the Emulator UI.
export const toJson = (value: FirestoreValue): JsonValue => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof DocumentReference) {
    return value.path;
  }

  if (Array.isArray(value)) {
    return value.map(toJson);
  }

  if (value !== null && typeof value === "object") {
    const result: JsonObject = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = toJson(entry);
    }
    return result;
  }

  return value;
};

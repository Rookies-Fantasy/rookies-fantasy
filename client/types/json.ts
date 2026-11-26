// A parsed JSON value. Use it to type `response.json()` results so they are
// narrowed field by field instead of being trusted as a domain type.
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

export type JsonObject = { [key: string]: JsonValue };

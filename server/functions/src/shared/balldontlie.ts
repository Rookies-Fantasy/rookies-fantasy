import { BalldontlieAPI } from "@balldontlie/sdk";

const apiKey = process.env.BALLDONTLIE_API_KEY || "";
export const api = new BalldontlieAPI({ apiKey });

export const fetchAllPagesFromUrl = async (url: string, apiKey?: string) => {
  let cursor: number | null = null;
  let results: any[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const finalUrl = cursor ? `${url}&cursor=${cursor}` : url;

    console.log("Fetching:", finalUrl);

    const response = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch:",
        response.status,
        response.statusText,
        "URL:",
        finalUrl,
      );
      break;
    }

    const json: any = await response.json();

    if (!json.data || !Array.isArray(json.data)) {
      console.error("Unexpected response format:", json);
      break;
    }

    results = results.concat(json.data);

    if (!json.meta?.next_cursor) break;

    cursor = json.meta.next_cursor;
  }

  return results;
};

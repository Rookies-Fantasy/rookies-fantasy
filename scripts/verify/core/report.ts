export type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const cell = (value: string): string => value.replace(/\s+/g, " ").trim();

export const formatTable = (headers: string[], rows: string[][]): string => {
  const all = [headers, ...rows].map((row) => row.map(cell));
  const widths = headers.map((_, column) =>
    Math.max(...all.map((row) => row[column].length)),
  );
  const line = (row: string[]): string =>
    row
      .map((value, column) => value.padEnd(widths[column]))
      .join("  ")
      .trimEnd();

  return [
    line(all[0]),
    widths.map((width) => "-".repeat(width)).join("  "),
    ...all.slice(1).map(line),
  ].join("\n");
};

export const formatMarkdownTable = (
  headers: string[],
  rows: string[][],
): string => {
  const escape = (value: string): string => cell(value).replace(/\|/g, "\\|");
  const line = (row: string[]): string => `| ${row.map(escape).join(" | ")} |`;

  return [
    line(headers),
    line(headers.map(() => "---")),
    ...rows.map(line),
  ].join("\n");
};

export const printChecks = (title: string, checks: CheckResult[]): void => {
  console.log(`\n${title}\n`);
  console.log(
    formatTable(
      ["Check", "Result", "Detail"],
      checks.map((check) => [
        check.name,
        check.passed ? "PASS" : "FAIL",
        check.detail,
      ]),
    ),
  );
};

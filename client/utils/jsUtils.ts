import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const isNil = <T>(value: T): value is Extract<T, null | undefined> =>
  value === null || value === undefined;

export const isNotNil = <T>(value: T): value is NonNullable<T> => !isNil(value);

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

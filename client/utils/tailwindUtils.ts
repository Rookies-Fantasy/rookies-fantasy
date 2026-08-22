// Tailwind's spacing scale is 4px per step, so `w-12` renders 48px wide.
const TAILWIND_SPACING_UNIT = 4;

/**
 * Resolves a Tailwind width class (`w-12`) to the pixel width it renders at.
 *
 * Only the numeric spacing scale is supported. Fractional (`w-1/2`), keyword
 * (`w-full`, `w-auto`) and `w-px` classes have no pixel equivalent that can be
 * derived without measuring, so they throw rather than returning NaN — a NaN
 * here would flow silently into scroll offsets and break them at runtime.
 */
export const widthClassToPixels = (widthClass: string): number => {
  const step = Number(widthClass.replace("w-", ""));

  if (!Number.isFinite(step)) {
    throw new Error(
      `Unsupported Tailwind width class "${widthClass}": only the numeric spacing scale (e.g. w-12) can be resolved to pixels.`,
    );
  }

  return step * TAILWIND_SPACING_UNIT;
};

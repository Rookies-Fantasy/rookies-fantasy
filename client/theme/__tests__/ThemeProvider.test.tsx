import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { colorScheme } from "nativewind";
import { useEffect } from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ThemeMode } from "../theme";
import { ThemeProvider, useAppTheme } from "../ThemeProvider";

type MockColorScheme = "light" | "dark";

// Read lazily by the useColorScheme mock; the `mock` prefix lets jest.mock reference it.
let mockSystemScheme: MockColorScheme = "dark";

jest.mock("nativewind", () => ({
  colorScheme: { set: jest.fn() },
  // A fresh setColorScheme every call mirrors the unstable identity that
  // caused the original bug; the provider must not depend on it.
  useColorScheme: jest.fn(() => ({
    colorScheme: mockSystemScheme,
    setColorScheme: jest.fn(),
  })),
}));

const setMock = colorScheme.set as jest.Mock;

type ThemeContextValue = ReturnType<typeof useAppTheme>;

let latest: ThemeContextValue;

const captureValue = (value: ThemeContextValue) => {
  latest = value;
};

const Consumer = () => {
  const value = useAppTheme();
  // Capture after commit so the render itself stays pure.
  useEffect(() => captureValue(value));
  return null;
};

const renderProvider = (): ReactTestRenderer => {
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
  });
  return renderer!;
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    setMock.mockClear();
    mockSystemScheme = "dark";
  });

  it("sets NativeWind to dark once on mount", () => {
    renderProvider();

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith(ThemeMode.Dark);
    expect(latest.mode).toBe(ThemeMode.Dark);
  });

  it("does not reset the scheme on re-render", () => {
    const renderer = renderProvider();

    act(() => {
      renderer.update(
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>,
      );
    });

    expect(setMock).toHaveBeenCalledTimes(1);
  });

  it("calls colorScheme.set once per setMode and keeps the chosen mode", () => {
    renderProvider();
    const { setMode } = latest;

    act(() => latest.setMode(ThemeMode.Light));
    expect(setMock).toHaveBeenCalledTimes(2);
    expect(setMock).toHaveBeenLastCalledWith(ThemeMode.Light);
    expect(latest.mode).toBe(ThemeMode.Light);

    act(() => latest.setMode(ThemeMode.System));
    expect(setMock).toHaveBeenCalledTimes(3);
    expect(setMock).toHaveBeenLastCalledWith(ThemeMode.System);

    // setMode keeps a stable identity across renders.
    expect(latest.setMode).toBe(setMode);
  });

  it("resolves System mode from the system preference", () => {
    mockSystemScheme = "light";
    renderProvider();

    act(() => latest.setMode(ThemeMode.System));

    expect(latest.mode).toBe(ThemeMode.Light);
  });
});

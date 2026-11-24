import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "@react-native-firebase/auth";
import { clearPersistence } from "@react-native-firebase/firestore";
import { getBackendMode } from "../config";
import { connectToEmulators } from "@/utils/emulator";

type MockAuth = { currentUser: { uid: string } | null };

// Read lazily by the getAuth mock; the `mock` prefix lets jest.mock reference it.
let mockAuth: MockAuth = { currentUser: null };

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@react-native-firebase/auth", () => ({
  getAuth: jest.fn(() => mockAuth),
  signOut: jest.fn(),
}));

jest.mock("@react-native-firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  clearPersistence: jest.fn(),
}));

jest.mock("../config", () => ({
  getBackendMode: jest.fn(),
}));

jest.mock("@/utils/emulator", () => ({
  connectToEmulators: jest.fn(),
}));

const FIREBASE_ENVIRONMENT_KEY = "firebase-environment";

const mockedSignOut = jest.mocked(signOut);
const mockedClearPersistence = jest.mocked(clearPersistence);
const mockedGetBackendMode = jest.mocked(getBackendMode);
const mockedConnectToEmulators = jest.mocked(connectToEmulators);

// initializeFirebase caches its promise at module scope, so load a fresh copy per test.
const loadInitializeFirebase = (): (() => Promise<void>) => {
  let initializeFirebase: () => Promise<void> = () => Promise.resolve();
  jest.isolateModules(() => {
    initializeFirebase = require("../initialize").initializeFirebase;
  });
  return initializeFirebase;
};

describe("initializeFirebase", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockAuth = { currentUser: null };
    mockedGetBackendMode.mockReturnValue("cloud");
    // Mirror React Native Firebase, which rejects when nobody is signed in.
    mockedSignOut.mockImplementation(() =>
      mockAuth.currentUser
        ? Promise.resolve()
        : Promise.reject(new Error("[auth/no-current-user]")),
    );
    mockedClearPersistence.mockResolvedValue();
  });

  it("resolves and stores the environment on a fresh install with no user", async () => {
    await expect(loadInitializeFirebase()()).resolves.toBeUndefined();

    expect(mockedSignOut).not.toHaveBeenCalled();
    expect(mockedClearPersistence).not.toHaveBeenCalled();
    expect(mockedConnectToEmulators).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(FIREBASE_ENVIRONMENT_KEY)).toBe(
      "firebase",
    );
  });

  it("signs out a signed-in user when the backend changes", async () => {
    await AsyncStorage.setItem(FIREBASE_ENVIRONMENT_KEY, "emulator");
    mockAuth = { currentUser: { uid: "user-1" } };

    await expect(loadInitializeFirebase()()).resolves.toBeUndefined();

    expect(mockedSignOut).toHaveBeenCalledTimes(1);
    expect(mockedClearPersistence).toHaveBeenCalledTimes(1);
    expect(mockedConnectToEmulators).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(FIREBASE_ENVIRONMENT_KEY)).toBe(
      "firebase",
    );
  });
});

import { getAuth } from "@react-native-firebase/auth";
import { Platform } from "react-native";
import { isNotNil } from "@/utils/jsUtils";

const FUNCTIONS_BASE_URL =
  process.env.EXPO_PUBLIC_USE_EMULATOR === "true"
    ? (() => {
        const defaultHost =
          Platform.OS === "android" ? "10.0.2.2" : "localhost";
        const host = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? defaultHost;
        return `http://${host}:5001/rookies-fantasy-development/us-central1`;
      })()
    : "https://us-central1-rookies-fantasy-development.cloudfunctions.net";

const EARLIEST_GAME_START_TIME_URL = `${FUNCTIONS_BASE_URL}/getEarliestGameStartTime`;
const LIVE_DATA_URL = `${FUNCTIONS_BASE_URL}/getLiveData`;

export const fetchEarliestGameStartTime = async (date: string) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("No authenticated user");
      return;
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch(
      `${EARLIEST_GAME_START_TIME_URL}?date=${date}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    );

    if (response.status === 404) {
      // TODO: surface "no games scheduled" state to the user
      return;
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }

    const data = await response.json();
    return data.earliestGameStart as string | undefined;
  } catch (error) {
    console.error("fetchEarliestGameStartTime error:", error);
    return undefined;
  }
};

export const fetchLivePlayerData = async (playerIds?: string[]) => {
  try {
    const filteredIds = playerIds?.filter((id) => isNotNil(id));

    if (filteredIds?.length === 0) return;

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("No authenticated user");
      return;
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch(LIVE_DATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ playerIds: filteredIds }),
    });

    return response.json();
  } catch (error) {
    console.error("fetchLivePlayerData error:", error);
    return {};
  }
};

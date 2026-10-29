import { getAuth } from "@react-native-firebase/auth";
import { emulatorHost, USE_EMULATOR } from "@/utils/emulator";
import { isNotNil } from "@/utils/jsUtils";

const getFunctionsBaseUrl = () => {
  if (USE_EMULATOR) {
    return `http://${emulatorHost}:5001/rookies-fantasy-development/us-central1`;
  }

  return "https://us-central1-rookies-fantasy-development.cloudfunctions.net";
};

const FUNCTIONS_BASE_URL = getFunctionsBaseUrl();
const EARLIEST_GAME_START_TIME_URL = `${FUNCTIONS_BASE_URL}/getEarliestGameStartTime`;
const LIVE_DATA_URL = `${FUNCTIONS_BASE_URL}/getLiveData`;

export const fetchEarliestGameStartTime = async (date: string) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user");
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
      return null;
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }

    const data = await response.json();
    return data.earliestGameStart as string | undefined;
  } catch (error) {
    console.error("fetchEarliestGameStartTime error:", error);
    throw error;
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

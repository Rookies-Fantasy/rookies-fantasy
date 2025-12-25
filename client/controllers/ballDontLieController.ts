import { getAuth } from "@react-native-firebase/auth";
import { isNotNil } from "@/utils/jsUtils";

const EARLIEST_GAME_START_TIME_URL =
  "https://us-central1-rookies-fantasy-development.cloudfunctions.net/getEarliestGameStartTime";
const LIVE_DATA_URL =
  "https://us-central1-rookies-fantasy-development.cloudfunctions.net/getLiveData";

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

    const data = await response.json();
    return data.earliestGameStart as string | undefined;
  } catch (error) {
    console.error("fetchEarliestGameStartTime error:", error);
    return undefined;
  }
};

export const fetchLivePlayerData = async (playerIds?: number[]) => {
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

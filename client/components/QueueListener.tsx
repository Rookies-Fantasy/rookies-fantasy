import { ReactNode, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { QueueController } from "@/controllers/queueController";
import { useAppSelector, useAppDispatch } from "@/state/hooks";
import { setQueueStatus } from "@/state/slices/queueSlice";
import { selectTeamId, selectIsTeamRegistered } from "@/state/slices/teamSlice";
import { Queue } from "@/types/queue";

type QueueListenerProps = {
  children: ReactNode;
};

export const QueueListener = ({ children }: QueueListenerProps) => {
  const dispatch = useAppDispatch();
  const teamId = useAppSelector(selectTeamId);
  const isTeamRegistered = useAppSelector(selectIsTeamRegistered);
  const previousStatus = useRef<string | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);

  useEffect(() => {
    if (!teamId || !isTeamRegistered) {
      setQueue(null);
      setIsInQueue(false);
      return;
    }

    const unsubscribe = QueueController.subscribeToQueueDocument(
      teamId,
      (queueDoc) => {
        if (queueDoc) {
          setQueue(queueDoc);
          setIsInQueue(true);
        } else {
          setQueue(null);
          setIsInQueue(false);
        }
      },
    );

    return unsubscribe;
  }, [teamId, isTeamRegistered]);

  useEffect(() => {
    dispatch(setQueueStatus({ queueStatus: queue, isInQueue }));

    if (previousStatus.current === "waiting" && queue?.status === "matched") {
      Alert.alert(
        "Match Found!",
        "You have been matched with another team. Get ready to play!",
        [
          {
            text: "OK",
            style: "default",
          },
        ],
      );
    }

    previousStatus.current = queue?.status || null;
  }, [queue, isInQueue, dispatch]);

  return children;
};

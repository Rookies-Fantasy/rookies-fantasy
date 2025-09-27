import firestore from "@react-native-firebase/firestore";
import { Queue } from "@/types/queue";

const QUEUE_COLLECTION = "queue";

export class QueueController {
  static addTeamToQueue = async (teamId: string) => {
    const queueDoc = {
      teamId,
      queuedAt: new Date(),
      status: "waiting",
    };

    try {
      await firestore().collection(QUEUE_COLLECTION).doc(teamId).set(queueDoc);
    } catch (error) {
      throw error;
    }
  };

  static removeTeamFromQueue = async (teamId: string) => {
    try {
      const queueDoc = await firestore()
        .collection(QUEUE_COLLECTION)
        .doc(teamId)
        .get();

      if (queueDoc.exists()) {
        await firestore().collection(QUEUE_COLLECTION).doc(teamId).delete();
      }
    } catch (error) {
      throw error;
    }
  };

  static subscribeToQueueDocument = (
    teamId: string,
    callback: (doc: Queue | null) => void,
  ) =>
    firestore()
      .collection(QUEUE_COLLECTION)
      .doc(teamId)
      .onSnapshot(
        (doc) => {
          if (doc.exists() && doc.data()?.teamId === teamId) {
            const data = doc.data();

            if (data) {
              const queueData = {
                ...data,
                queuedAt: data.queuedAt.toString(),
              };
              callback(queueData as Queue);
            }
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error("Queue subscription error:", error);
          callback(null);
        },
      );
}

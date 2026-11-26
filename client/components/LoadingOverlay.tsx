import { Modal, Text, View } from "react-native";
import Spinner from "@/components/Spinner";

type LoadingOverlayProps = {
  isVisible: boolean;
  label: string;
};

const LoadingOverlay = ({ isVisible, label }: LoadingOverlayProps) => (
  <Modal
    animationType="fade"
    statusBarTranslucent
    transparent
    visible={isVisible}
  >
    <View className="flex-1 items-center justify-center gap-4 bg-black/70">
      <Spinner />
      <Text className="pbk-b1 text-base-white">{label}</Text>
    </View>
  </Modal>
);

export default LoadingOverlay;

import { Text, View } from "react-native";
import Button from "./Button";

type StartupErrorProps = {
  isLoading?: boolean;
  message?: string;
  onRetry: () => void;
  title?: string;
};

const StartupError = ({
  isLoading,
  message = "Please try again. If this keeps happening, close and reopen the app.",
  onRetry,
  title = "Unable to start the app",
}: StartupErrorProps) => (
  <View className="flex-1 items-center justify-center bg-gray-950 px-6">
    <View className="w-full max-w-sm gap-4">
      <Text
        accessibilityRole="header"
        className="pbk-h5 text-center text-base-white"
      >
        {title}
      </Text>
      <Text className="pbk-b2 text-center text-gray-400">{message}</Text>
      <Button isLoading={isLoading} label="Retry" onPress={onRetry} />
    </View>
  </View>
);

export default StartupError;

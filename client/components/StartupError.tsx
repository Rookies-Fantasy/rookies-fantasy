import { Text, View } from "react-native";
import Button from "./Button";

type SignOutAction = {
  isLoading: boolean;
  onPress: () => void;
};

type StartupErrorProps = {
  isLoading?: boolean;
  message?: string;
  onRetry: () => void;
  // A way out when a saved session can't be restored; null when there is none.
  signOutAction: SignOutAction | null;
  title?: string;
};

const StartupError = ({
  isLoading = false,
  message = "Please try again. If this keeps happening, close and reopen the app.",
  onRetry,
  signOutAction,
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
      <Button
        disabled={signOutAction !== null && signOutAction.isLoading}
        isLoading={isLoading}
        label="Retry"
        onPress={onRetry}
      />
      {signOutAction !== null && (
        <Button
          disabled={isLoading}
          isLoading={signOutAction.isLoading}
          label="Sign out"
          onPress={signOutAction.onPress}
          variant="secondary"
        />
      )}
    </View>
  </View>
);

export default StartupError;

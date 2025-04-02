import { Link, Stack } from "expo-router";
import { View } from "react-native";
import Typography from "@/components/Typography";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Typography variant="h6" color="gray-950">
          This screen doesn't exist.
        </Typography>

        <Link href="/" className="mt-4 py-4">
          <Typography variant="b2" color="blue-400">
            Go to home screen!
          </Typography>
        </Link>
      </View>
    </>
  );
}

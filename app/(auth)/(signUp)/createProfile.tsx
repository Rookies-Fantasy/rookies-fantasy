import { useSignUpForm } from "@/components/SignUpProvider";
import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function CreateProfileScreen() {
  const { getValues } = useSignUpForm();

  const formData = getValues();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="pbk-h1 text-gray-950">This is temporary</Text>
        <Text className="pbk-h1 text-gray-950">{formData.email}</Text>
        <Text className="pbk-h1 text-gray-950">{formData.password}</Text>

        <Link href="/" className="mt-4 py-4">
          <Text className="pbk-b2 text-purple-500">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

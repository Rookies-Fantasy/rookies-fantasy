import { Link } from "expo-router";
import { View, Text } from "react-native";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setUsername } from "@/state/slices/userSlice";

const CreateProfile = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  return (
    <View className="flex-1 items-center justify-center p-5">
      <Text className="pbk-h6 text-gray-950">This is temporary</Text>
      <Text className="pbk-b1 text-gray-950">{user.userId}</Text>
      <Text className="pbk-b1 text-gray-950">{user.email}</Text>
      <Text className="pbk-b1 text-gray-950">{user.username}</Text>

      <Link
        className="mt-4 py-4"
        href="/(protected)"
        onPress={() => dispatch(setUsername("testing"))}
      >
        <Text className="pbk-b2 text-purple-500">Go to home screen!</Text>
      </Link>
    </View>
  );
};

export default CreateProfile;

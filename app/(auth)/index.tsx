import { useState } from "react";
import { View, KeyboardAvoidingView, TextInput } from "react-native";
import { X } from 'phosphor-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <KeyboardAvoidingView
        behavior="padding"
        className="w-screen h-screen bg-gray-950 flex-col justify-center items-center"
      >
        <View className="w-full bg-red-500">
          <X />
        </View>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          className="w-full h-12 border border-gray-300 rounded-md p-2"
        />
      </KeyboardAvoidingView>
    </View>
  );
}


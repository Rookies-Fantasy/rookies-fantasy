import { router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import Spinner from "@/components/Spinner";
import { useSignOut } from "@/hooks/useSignOut";
import {
  deleteAccount,
  getAccountDeletionErrorMessage,
  isPasswordUser,
} from "@/utils/accountUtils";

const Settings = () => {
  const { signOut, clearSessionAndExit } = useSignOut();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const runDeletion = async (accountPassword: string) => {
    try {
      setIsDeleting(true);
      await deleteAccount(accountPassword);
      setShowPasswordPrompt(false);
      setPassword("");
      clearSessionAndExit();
    } catch (error) {
      const message = getAccountDeletionErrorMessage(error);
      if (message) {
        console.error("Account deletion error:", error);
        Alert.alert("Couldn't delete account", message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account, profile, teams, and league memberships. This cannot be undone.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: () => {
            if (isPasswordUser()) {
              setPassword("");
              setShowPasswordPrompt(true);
            } else {
              runDeletion("");
            }
          },
          style: "destructive",
          text: "Delete",
        },
      ],
    );
  };

  const closePasswordPrompt = () => {
    if (isDeleting) return;
    setShowPasswordPrompt(false);
    setPassword("");
  };

  return (
    <Screen>
      <View className="mt-8 flex-1 px-6">
        <View className="mb-8 flex-row items-center gap-4">
          <Pressable
            className="size-8 items-center justify-center rounded-md border border-gray-900"
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={20} weight="bold" />
          </Pressable>
          <Text className="pbk-h5 text-base-white">Settings</Text>
        </View>

        <View className="gap-4">
          <Button
            disabled={isDeleting}
            isLoading={isLoggingOut}
            label="Log out"
            onPress={handleLogout}
            variant="secondary"
          />
        </View>

        <View className="mb-8 mt-auto gap-3">
          <Text className="pbk-b3 text-gray-400">
            Deleting your account permanently removes your profile, teams, and
            league memberships.
          </Text>
          <Pressable
            className="min-h-12 w-full items-center justify-center rounded-md bg-red-600"
            disabled={isDeleting || isLoggingOut}
            onPress={handleDeletePress}
          >
            {isDeleting && !showPasswordPrompt ? (
              <Spinner />
            ) : (
              <Text className="pbk-h7 text-center uppercase text-base-white">
                Delete account
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={closePasswordPrompt}
        transparent
        visible={showPasswordPrompt}
      >
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 items-center justify-center bg-black/70 px-6"
        >
          <View className="w-full gap-4 rounded-xl bg-gray-920 p-6">
            <Text className="pbk-h6 text-base-white">Confirm password</Text>
            <Text className="pbk-b2 text-gray-400">
              Enter your password to permanently delete your account.
            </Text>
            <View className="min-h-14 w-full flex-row items-center rounded-xl border border-gray-800 px-2 py-2">
              <TextInput
                autoCapitalize="none"
                autoFocus
                className="flex-1 text-base-white placeholder:pbk-b1"
                editable={!isDeleting}
                onChangeText={setPassword}
                onSubmitEditing={() => password && runDeletion(password)}
                placeholder="Enter password"
                placeholderTextColor="gray"
                secureTextEntry
                textContentType="password"
                value={password}
              />
            </View>
            <Pressable
              className="min-h-12 w-full items-center justify-center rounded-md bg-red-600"
              disabled={isDeleting || !password}
              onPress={() => runDeletion(password)}
            >
              {isDeleting ? (
                <Spinner />
              ) : (
                <Text className="pbk-h7 text-center uppercase text-base-white">
                  Delete account
                </Text>
              )}
            </Pressable>
            <Button
              disabled={isDeleting}
              label="Cancel"
              onPress={closePasswordPrompt}
              variant="secondary"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
};

export default Settings;

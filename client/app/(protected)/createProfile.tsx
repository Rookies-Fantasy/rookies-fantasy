import { yupResolver } from "@hookform/resolvers/yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { WarningCircle } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Image,
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Keyboard,
  Modal,
  Pressable,
} from "react-native";
import * as yup from "yup";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { UserController, UserEditModel } from "@/controllers/userController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { setUser } from "@/state/slices/userSlice";
import { Asset, avatarOptions, defaultAvatar } from "@/types/asset";

export type UserEditFormModel = Pick<
  Required<UserEditModel>,
  "avatarUrl" | "dateOfBirth" | "username"
>;

const schema = yup.object({
  avatarUrl: yup
    .string()
    .required("Avatar is required")
    .test(
      "not-default-avatar",
      "Avatar is required",
      (value) => value !== defaultAvatar.url,
    ),
  dateOfBirth: yup.date().required("Date of Birth is required"),
  username: yup.string().required("Username is required"),
});

const CreateProfile = () => {
  const userId = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatarOption, setSelectedAvatarOption] =
    useState<Asset>(defaultAvatar);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserEditFormModel>({
    resolver: yupResolver(schema),
    defaultValues: {
      avatarUrl: "",
      dateOfBirth: undefined,
      username: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    const setDefaultUserData = async () => {
      if (userId) {
        const userData = await UserController.getUser(userId);
        if (userData) {
          const matchedAvatar = avatarOptions.find(
            (option) => option.url === userData.avatarUrl,
          );
          setSelectedAvatarOption(matchedAvatar || defaultAvatar);
          reset({
            avatarUrl: userData.avatarUrl,
            dateOfBirth: userData.dateOfBirth
              ? new Date(userData.dateOfBirth)
              : undefined,
            username: userData.username,
          });
        }
      }
    };
    setDefaultUserData();
  }, [userId, reset]);

  const handleCreateProfile = async (model: UserEditFormModel) => {
    setIsLoading(true);
    try {
      if (userId) {
        await UserController.editUser(userId, model);
        const userData = await UserController.getUser(userId);
        dispatch(setUser(userData));
        router.push("/(protected)/createTeam");
      } else {
        router.push("/(auth)");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1">
        <KeyboardAvoidingView
          behavior="padding"
          className="mt-8 flex-1 flex-col px-6"
        >
          <View className="flex-1 flex-col">
            <Text className="pbk-h5 mb-8 text-base-white">
              Tell us who you are
            </Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text className="pbk-b2 mb-1.5 text-base-white">
                    Username
                  </Text>
                  <View
                    className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.username ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                  >
                    <TextInput
                      autoCapitalize="none"
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      onChangeText={(text) => {
                        onChange(text);
                      }}
                      placeholder="Enter your username"
                      placeholderTextColor="gray"
                      value={value}
                    />
                    {errors.username && (
                      <WarningCircle color="#dc2626" size={20} weight="bold" />
                    )}
                  </View>
                </>
              )}
            />
            <View className="mb-4">
              {errors.username ? (
                <Text className="pbk-b3 text-red-600">
                  {errors.username.message}
                </Text>
              ) : (
                <Text className="pbk-b3 text-gray-600">
                  This is your display name. You can change it later.
                </Text>
              )}
            </View>
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text className="pbk-b2 mb-1.5 text-base-white">
                    Date of birth
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedDate(value ?? new Date());
                      setShowDatePicker(true);
                    }}
                  >
                    <View
                      className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${
                        errors.dateOfBirth
                          ? "border-red-600"
                          : "border-gray-920"
                      } px-2 py-2`}
                    >
                      <TextInput
                        className="flex-1 text-base-white placeholder:pbk-b1"
                        editable={false}
                        placeholder="Enter date of birth"
                        placeholderTextColor="gray"
                        pointerEvents="none"
                        value={
                          value
                            ? new Date(value).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : ""
                        }
                      />
                      {errors.dateOfBirth && (
                        <WarningCircle
                          color="#dc2626"
                          size={20}
                          weight="bold"
                        />
                      )}
                    </View>
                  </Pressable>
                  <Modal
                    animationType="slide"
                    onRequestClose={() => setShowDatePicker(false)}
                    transparent
                    visible={showDatePicker}
                  >
                    <Pressable
                      className="flex-1"
                      onPress={() => setShowDatePicker(false)}
                    >
                      <View className="flex-1 items-center justify-end">
                        <View className="w-full rounded-t-2xl bg-gray-920 p-8">
                          <DateTimePicker
                            display="spinner"
                            maximumDate={new Date()}
                            mode="date"
                            onChange={(_, selectedDate) => {
                              if (selectedDate) {
                                setSelectedDate(selectedDate);
                                onChange(selectedDate);
                              }
                            }}
                            themeVariant="dark"
                            value={value ? new Date(value) : new Date()}
                          />
                          <Button
                            label="Done"
                            onPress={() => {
                              if (selectedDate) {
                                onChange(selectedDate);
                              }
                              setShowDatePicker(false);
                            }}
                          />
                        </View>
                      </View>
                    </Pressable>
                  </Modal>
                </>
              )}
            />
            <View className="mb-4">
              {errors.dateOfBirth && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.dateOfBirth.message}
                </Text>
              )}
            </View>
            <Text className="pbk-b2 mb-1.5 text-base-white">Avatar</Text>
            <View className="mb-2 mt-4 flex-row items-center justify-between">
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowBottomDrawer(true);
                }}
              >
                <Image
                  className="h-24 w-24 rounded-full border-2 border-purple-600"
                  source={selectedAvatarOption.source}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowBottomDrawer(true);
                }}
              >
                <Text className="pbk-b2 p-4 text-purple-600">
                  Change avatar
                </Text>
              </Pressable>
            </View>
            {errors.avatarUrl && (
              <Text className="pbk-b3 mb-4 text-red-600">
                {errors.avatarUrl.message}
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
        <View className="justify-end bg-gray-950 px-6">
          <Button
            isLoading={isLoading}
            label="Continue"
            onPress={handleSubmit(handleCreateProfile)}
          />
        </View>
      </View>
      <BottomSheet
        footer={
          <Pressable
            className="min-h-12 w-full justify-center rounded-md bg-purple-600"
            onPress={() => setShowBottomDrawer(false)}
          >
            <Text className="pbk-h7 text-center text-base-white">SAVE</Text>
          </Pressable>
        }
        header={
          <Text className="pbk-b1 text-center text-base-white">
            Change avatar
          </Text>
        }
        isOpen={showBottomDrawer}
        onClose={() => setShowBottomDrawer(false)}
        snapPoints={["66%"]}
      >
        <Controller
          control={control}
          name="avatarUrl"
          render={({ field: { onChange } }) => (
            <View className="mb-6 flex-1 flex-row flex-wrap justify-between px-6 py-4">
              {avatarOptions.map((avatarOption, index) => {
                const isSelected =
                  selectedAvatarOption.url === avatarOption.url;

                return (
                  <Pressable
                    className="relative mb-2.5 aspect-square w-[26%] items-center justify-center"
                    key={index}
                    onPress={() => {
                      onChange(avatarOption.url);
                      setSelectedAvatarOption(avatarOption);
                    }}
                  >
                    {isSelected && (
                      <View className="absolute -bottom-1 -left-1 -right-1 -top-1 rounded-full border-4 border-purple-600" />
                    )}
                    <Image
                      className="h-full w-full rounded-full"
                      resizeMode="cover"
                      source={avatarOption.source}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </BottomSheet>
    </Screen>
  );
};

export default CreateProfile;

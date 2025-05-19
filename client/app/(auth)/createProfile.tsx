import { yupResolver } from "@hookform/resolvers/yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getAuth } from "@react-native-firebase/auth";
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
  TouchableWithoutFeedback,
  Keyboard,
  ImageSourcePropType,
  Modal,
  Pressable,
} from "react-native";
import * as yup from "yup";
import BottomSheet from "@/components/BottomSheet";
import Spinner from "@/components/Spinner";
import { UserController, UserEditModel } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setUser } from "@/state/slices/userSlice";

type AvatarOption = {
  url: string;
  source: ImageSourcePropType;
};

const avatarOptions: AvatarOption[] = [
  {
    url: "../../assets/images/placeholder-avatar.png",
    source: require("../../assets/images/placeholder-avatar.png"),
  },
  {
    url: "../../assets/images/profile/profile-1.png",
    source: require("../../assets/images/profile/profile-1.png"),
  },
  {
    url: "../../assets/images/profile/profile-2.png",
    source: require("../../assets/images/profile/profile-2.png"),
  },
  {
    url: "../../assets/images/profile/profile-3.png",
    source: require("../../assets/images/profile/profile-3.png"),
  },
  {
    url: "../../assets/images/profile/profile-4.png",
    source: require("../../assets/images/profile/profile-4.png"),
  },
  {
    url: "../../assets/images/profile/profile-5.png",
    source: require("../../assets/images/profile/profile-5.png"),
  },
  {
    url: "../../assets/images/profile/profile-6.png",
    source: require("../../assets/images/profile/profile-6.png"),
  },
  {
    url: "../../assets/images/profile/profile-7.png",
    source: require("../../assets/images/profile/profile-7.png"),
  },
  {
    url: "../../assets/images/profile/profile-8.png",
    source: require("../../assets/images/profile/profile-8.png"),
  },
  {
    url: "../../assets/images/profile/profile-9.png",
    source: require("../../assets/images/profile/profile-9.png"),
  },
];

const schema = yup.object({
  avatarUrl: yup
    .string()
    .required("Avatar is required")
    .test(
      "not-default-avatar",
      "Avatar is required",
      (value) => value !== avatarOptions[0].url,
    ),
  dateOfBirth: yup.date().required("Date of Birth is required"),
  username: yup.string().required("Username is required"),
  name: yup.string().required("Name is required"),
});

const CreateProfile = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatarOption, setSelectedAvatarOption] =
    useState<AvatarOption>(avatarOptions[0]);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserEditModel>({
    resolver: yupResolver(schema),
    defaultValues: {
      avatarUrl: "",
      dateOfBirth: undefined,
      username: "",
      name: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    const setDefaultUserData = async () => {
      if (currentUser) {
        const userData = await UserController.getUser(currentUser.uid);
        if (userData) {
          const matchedAvatar = avatarOptions.find(
            (option) => option.url === userData!.avatarUrl,
          );
          if (matchedAvatar) {
            setSelectedAvatarOption(matchedAvatar);
          }

          reset({
            avatarUrl: userData.avatarUrl,
            dateOfBirth: userData.dateOfBirth?.toDate().toISOString(),
            name: userData.name,
            username: userData.username,
          });
        }
      }
    };

    setDefaultUserData();
  }, [currentUser, reset]);

  const handleCreateProfile = async (model: UserEditModel) => {
    setIsLoading(true);
    try {
      if (currentUser) {
        await UserController.editUser(currentUser.uid, model);
        const userData = await UserController.getUser(currentUser.uid);
        dispatch(
          setUser({
            avatarUrl: userData?.avatarUrl,
            dateOfBirth: userData?.dateOfBirth?.toDate().toISOString(),
            email: userData?.email,
            id: userData?.userId,
            username: userData?.username,
          }),
        );
        router.push("/(auth)/createTeam");
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
    <View className="flex-1 bg-gray-950">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <KeyboardAvoidingView behavior="padding" className="flex-1">
            <View className="flex-1 flex-col px-6 py-4">
              <View className="my-8 size-8 self-end" />

              <Text className="pbk-h5 mb-8 text-base-white">
                Tell us who you are
              </Text>

              <Text className="pbk-b2 mb-1.5 text-base-white">Username</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
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
                )}
              />
              {errors.username && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.username.message}
                </Text>
              )}
              <View className="mb-5">
                <Text className="pbk-b3 text-gray-600">
                  This is your display name. You can change it later.
                </Text>
              </View>

              <Text className="pbk-b2 mb-1.5 text-base-white">Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View
                    className={`mb-4 min-h-14 flex-row items-center justify-between rounded-xl border ${errors.name ? "border-red-600" : "border-gray-920"} px-3 py-2`}
                  >
                    <TextInput
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      onChangeText={(text) => {
                        onChange(text);
                      }}
                      placeholder="Enter full name"
                      placeholderTextColor="gray"
                      value={value}
                    />
                    {errors.name && (
                      <WarningCircle color="#dc2626" size={20} weight="bold" />
                    )}
                  </View>
                )}
              />
              {errors.name && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.name.message}
                </Text>
              )}

              <Text className="pbk-b2 mb-1.5 text-base-white">
                Date of birth
              </Text>
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Pressable
                      onPress={() => {
                        setSelectedDate(value ?? new Date());
                        setShowDatePicker(true);
                      }}
                    >
                      <View
                        className={`mb-4 min-h-14 w-full flex-row items-center rounded-xl border ${
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
                      <TouchableWithoutFeedback
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
                              value={value ?? new Date()}
                            />
                            <Pressable
                              className="min-h-12 justify-center rounded-md bg-purple-600"
                              onPress={() => {
                                if (selectedDate) {
                                  onChange(selectedDate);
                                }
                                setShowDatePicker(false);
                              }}
                            >
                              <Text className="pbk-h6 text-center text-base-white">
                                DONE
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  </>
                )}
              />
              {errors.dateOfBirth && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.dateOfBirth.message}
                </Text>
              )}

              <Text className="pbk-b2 mb-1.5 text-base-white">Avatar</Text>
              <View className="mb-2 mt-4 flex-row items-center justify-between">
                <Pressable onPress={() => setShowBottomDrawer(true)}>
                  <Image
                    className="h-24 w-24 rounded-full border-2 border-purple-600"
                    source={selectedAvatarOption.source}
                  />
                </Pressable>
                <Pressable onPress={() => setShowBottomDrawer(true)}>
                  <Text className="text-purple-600">Change avatar</Text>
                </Pressable>
              </View>
              {errors.avatarUrl && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.avatarUrl.message}
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>

          <View className="mb-8 justify-end bg-gray-950 px-6">
            <Pressable
              className="min-h-12 w-full items-center justify-center rounded-md bg-purple-600"
              disabled={isLoading}
              onPress={handleSubmit(handleCreateProfile)}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <Text className="pbk-h7 text-center text-base-white">
                  CONTINUE
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>

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
          render={({ field: { onChange, value } }) => (
            <View className="flex-1 px-6 py-4">
              <View className="mb-6 flex-row flex-wrap justify-between">
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
            </View>
          )}
        />
      </BottomSheet>
    </View>
  );
};

export default CreateProfile;

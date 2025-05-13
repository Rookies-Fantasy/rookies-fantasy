import { useState } from "react";
import {
  Image,
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ImageSourcePropType,
  Modal,
} from "react-native";
import { WarningCircle } from "phosphor-react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import BottomSheet from "@/components/BottomSheet";
import { router } from "expo-router";

const avatars = [
  require("../../assets/images/placeholder-avatar.png"),
  require("../../assets/images/profile/profile-1.png"),
  require("../../assets/images/profile/profile-2.png"),
  require("../../assets/images/profile/profile-3.png"),
  require("../../assets/images/profile/profile-4.png"),
  require("../../assets/images/profile/profile-5.png"),
  require("../../assets/images/profile/profile-6.png"),
  require("../../assets/images/profile/profile-7.png"),
  require("../../assets/images/profile/profile-8.png"),
  require("../../assets/images/profile/profile-9.png"),
];

const schema = yup.object({
  dateOfBirth: yup.date().required("Date of Birth is required"),
  username: yup.string().required("Username is required"),
  name: yup.string().required("Name is required"),
});

export type CreateProfileFormProps = {
  dateOfBirth: Date;
  username: string;
  name: string;
};

const CreateProfileScreen = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] =
    useState<ImageSourcePropType>(
      require("../../assets/images/placeholder-avatar.png"),
    );
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateProfileFormProps>({
    resolver: yupResolver(schema),
    defaultValues: {
      dateOfBirth: undefined,
      username: "",
      name: "",
    },
    mode: "onSubmit",
  });

  const handleCreateProfile = async (data: CreateProfileFormProps) => {
    setIsLoading(true);
    try {
      router.push("/(auth)/createTeam");
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
                      placeholder="Enter your username"
                      value={value}
                      autoCapitalize="none"
                      onChangeText={(text) => {
                        onChange(text);
                        setErrorMessage("");
                      }}
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      placeholderTextColor="gray"
                    />
                    {errors.username && (
                      <WarningCircle size={20} color="#dc2626" weight="bold" />
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
                    className={`mb-4 min-h-14 flex-row items-center justify-between rounded-xl border ${errors.name || errorMessage ? "border-red-600" : "border-gray-920"} px-3 py-2`}
                  >
                    <TextInput
                      placeholder="Enter full name"
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      placeholderTextColor="gray"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        setErrorMessage("");
                      }}
                    />
                  </View>
                )}
              />

              <Text className="pbk-b2 mb-1.5 text-base-white">
                Date of birth
              </Text>
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <View
                        className={`mb-4 min-h-14 w-full flex-row items-center rounded-xl border ${
                          errors.dateOfBirth
                            ? "border-red-600"
                            : "border-gray-920"
                        } px-2 py-2`}
                      >
                        <TextInput
                          editable={false}
                          value={
                            value
                              ? new Date(value).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : ""
                          }
                          placeholder="Enter date of birth"
                          className="flex-1 text-base-white placeholder:pbk-b1"
                          placeholderTextColor="gray"
                          pointerEvents="none"
                        />
                      </View>
                    </TouchableOpacity>

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
                          <TouchableOpacity
                            onPress={() => {}}
                            className="w-full rounded-t-2xl bg-gray-920 p-8"
                          >
                            <DateTimePicker
                              maximumDate={new Date()}
                              display="spinner"
                              themeVariant="dark"
                              value={value ? new Date(value) : new Date()}
                              mode="date"
                              onChange={(_, selectedDate) => {
                                if (selectedDate) {
                                  onChange(selectedDate);
                                }
                              }}
                            />
                            <TouchableOpacity
                              className="min-h-12 justify-center rounded-md bg-purple-600"
                              onPress={() => setShowDatePicker(false)}
                            >
                              <Text className="pbk-h6 text-center text-base-white">
                                DONE
                              </Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  </>
                )}
              />

              <Text className="pbk-b2 mb-1.5 text-base-white">Avatar</Text>
              <View className="mb-2 mt-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => setShowBottomDrawer(true)}>
                  <Image
                    className="h-24 w-24 rounded-full border-2 border-purple-600"
                    source={selectedAvatarUrl}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowBottomDrawer(true)}>
                  <Text className="text-purple-600">Change avatar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>

          <View className="mb-8 justify-end bg-gray-950 px-6">
            <TouchableOpacity
              className={`min-h-12 justify-center rounded-md ${
                !isValid ? "bg-purple-900" : "bg-purple-600"
              }`}
              disabled={!isValid || isLoading}
              onPress={handleSubmit(handleCreateProfile)}
            >
              <Text
                className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
              >
                CONTINUE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <BottomSheet
        header={
          <Text className="pbk-h6 text-center text-base-white">
            Change avatar
          </Text>
        }
        footer={
          <TouchableOpacity
            className="min-h-12 w-full justify-center rounded-md bg-purple-600"
            onPress={() => setShowBottomDrawer(false)}
          >
            <Text className="pbk-h6 text-center text-base-white">SAVE</Text>
          </TouchableOpacity>
        }
        isOpen={showBottomDrawer}
        onClose={() => setShowBottomDrawer(false)}
        snapPoints={["66%"]}
      >
        <View className="flex-1 px-6 py-4">
          <View className="mb-6 flex-row flex-wrap justify-between">
            {avatars.map((img, index) => {
              const isSelected = selectedAvatarUrl === img;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedAvatarUrl(img)}
                  className="relative mb-2.5 aspect-square w-[26%] items-center justify-center"
                >
                  {isSelected && (
                    <View className="absolute -bottom-1 -left-1 -right-1 -top-1 rounded-full border-4 border-purple-600" />
                  )}

                  <Image
                    source={img}
                    className="h-full w-full rounded-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

export default CreateProfileScreen;

import { useState } from "react";
import {
  Image,
  View,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  ImageSourcePropType,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { WarningCircle } from "phosphor-react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import BottomSheet from "@/components/BottomSheet";
import { router } from "expo-router";

const teamLogos = [
  require("../../assets/images/placeholder-avatar.png"),
  require("../../assets/images/team/team-1.png"),
  require("../../assets/images/team/team-2.png"),
  require("../../assets/images/team/team-3.png"),
  require("../../assets/images/team/team-4.png"),
  require("../../assets/images/team/team-5.png"),
  require("../../assets/images/team/team-6.png"),
  require("../../assets/images/team/team-7.png"),
  require("../../assets/images/team/team-8.png"),
];

const schema = yup.object({
  teamName: yup.string().required("Team Name is required"),
  teamAbbreviation: yup.string().required("Team Abbreviation is required"),
});

export type CreateTeamFormProps = {
  teamAbbreviation: string;
  teamName: string;
};

const CreateTeamScreen = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeamLogoUrl, setSelectedTeamLogoUrl] =
    useState<ImageSourcePropType>(
      require("../../assets/images/placeholder-avatar.png"),
    );
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateTeamFormProps>({
    resolver: yupResolver(schema),
    defaultValues: {
      teamAbbreviation: "",
      teamName: "",
    },
    mode: "onSubmit",
  });

  const handleCreateTeam = async (data: CreateTeamFormProps) => {
    setIsLoading(true);
    try {
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

              <View className="flex-row items-start">
                <TouchableOpacity
                  className="mr-3"
                  onPress={() => router.back()}
                >
                  <Image
                    className="mr-3 pb-2"
                    source={require("../../assets/images/back-icon.png")}
                  />
                </TouchableOpacity>
                <Text className="pbk-h5 mb-8 text-base-white">
                  Create your team
                </Text>
              </View>

              <Text className="pbk-b2 mb-1.5 text-base-white">Team Name</Text>
              <Controller
                control={control}
                name="teamName"
                render={({ field: { onChange, value } }) => (
                  <View
                    className={`mb-2 min-h-14 w-full flex-row items-center rounded-xl border ${errors.teamName ? "border-red-600" : "border-gray-920"} px-2 py-2`}
                  >
                    <TextInput
                      placeholder="Enter team name"
                      value={value}
                      autoCapitalize="none"
                      onChangeText={(text) => {
                        onChange(text);
                        setErrorMessage("");
                      }}
                      className="flex-1 text-base-white placeholder:pbk-b1"
                      placeholderTextColor="gray"
                    />
                    {errors.teamName && (
                      <WarningCircle size={20} color="#dc2626" weight="bold" />
                    )}
                  </View>
                )}
              />
              {errors.teamName && (
                <Text className="pbk-b3 mb-4 text-red-600">
                  {errors.teamName.message}
                </Text>
              )}
              <View className="mb-5">
                <Text className="pbk-b3 text-gray-600">
                  This is your team name. You can change it later.
                </Text>
              </View>

              <Text className="pbk-b2 mb-1.5 text-base-white">
                Team Abbreviation
              </Text>
              <Controller
                control={control}
                name="teamAbbreviation"
                render={({ field: { onChange, value } }) => (
                  <View
                    className={`mb-4 min-h-14 flex-row items-center justify-between rounded-xl border ${errors.teamAbbreviation || errorMessage ? "border-red-600" : "border-gray-920"} px-3 py-2`}
                  >
                    <TextInput
                      placeholder="Enter team abbreviation"
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

              <Text className="pbk-b2 mb-1.5 text-base-white">Team logo</Text>
              <View className="mb-2 mt-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => setShowBottomDrawer(true)}>
                  <Image
                    className="h-24 w-24 rounded-full border-2 border-purple-600"
                    source={selectedTeamLogoUrl}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowBottomDrawer(true)}>
                  <Text className="text-purple-600">Change Team Logo</Text>
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
              onPress={handleSubmit(handleCreateTeam)}
            >
              <Text
                className={`pbk-h6 text-center ${!isValid ? "text-gray-400" : "text-base-white"}`}
              >
                FINISH ACCOUNT CREATION
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <BottomSheet
        header={
          <Text className="pbk-h6 text-center text-base-white">
            Change team logo
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
            {teamLogos.map((img, index) => {
              const isSelected = selectedTeamLogoUrl === img;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedTeamLogoUrl(img)}
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

export default CreateTeamScreen;

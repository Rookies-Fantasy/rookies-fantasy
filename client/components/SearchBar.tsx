import { MagnifyingGlass } from "phosphor-react-native";
import React from "react";
import { TextInput, View } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search by player name",
}: SearchBarProps) => (
  <View className="min-h-12 flex-row items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-2">
    <MagnifyingGlass color="#717680" size={24} />
    <TextInput
      className="flex-1 text-base-white placeholder:pbk-b1"
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="gray"
      textAlignVertical="center"
      value={value}
    />
  </View>
);

export default SearchBar;

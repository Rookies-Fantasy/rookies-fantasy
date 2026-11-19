import { MagnifyingGlass, X } from "phosphor-react-native";
import { useState, useEffect } from "react";
import { View, TextInput, Pressable } from "react-native";

type SearchBarProps = {
  delay?: number;
  onChangeText: (text: string) => void;
  placeholder?: string;
  value?: string;
};

const SearchBar = ({
  delay = 500,
  onChangeText,
  placeholder = "Search by player name",
  value = "",
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChangeText(inputValue);
    }, delay);

    return () => clearTimeout(handler);
  }, [inputValue, delay, onChangeText]);

  return (
    <View className="min-h-12 flex-row items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-2">
      <MagnifyingGlass color="#717680" size={24} />
      <TextInput
        className="flex-1 text-base-white placeholder:pbk-b1"
        onChangeText={setInputValue}
        placeholder={placeholder}
        placeholderTextColor="gray"
        textAlignVertical="center"
        value={inputValue}
      />
      {inputValue.length > 0 && (
        <Pressable
          hitSlop={8}
          onPress={() => {
            setInputValue("");
            onChangeText("");
          }}
        >
          <X color="#717680" size={18} />
        </Pressable>
      )}
    </View>
  );
};

export default SearchBar;

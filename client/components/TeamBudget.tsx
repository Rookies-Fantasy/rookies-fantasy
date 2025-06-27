import { useState } from "react";
import { View, Text } from "react-native";

type TeamBudgetProps = {
  className?: string;
};

const TeamBudget = ({ className }: TeamBudgetProps) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View
      className={`w-full rounded-lg border border-gray-800 bg-gray-900 ${className}`}
    >
      <Text className="pbk-b1 p-4 text-base-white">
        Salary Cap: $100,000,000
      </Text>
      <View className="h-0.5 w-full bg-gray-800" />
      <Text className="pbk-b1 p-4 text-base-white">Balance: $100,000,000</Text>
    </View>
  );
};

export default TeamBudget;

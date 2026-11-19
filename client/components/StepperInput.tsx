import { Minus, Plus } from "phosphor-react-native";
import { Text, View } from "react-native";
import IconButton from "./IconButton";

type StepperInputProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
};

const StepperInput = ({
  value,
  onChange,
  min,
  max,
  step,
  formatValue = (v) => String(v),
}: StepperInputProps) => {
  const isAtMin = value <= min;
  const isAtMax = value >= max;

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <View className="mb-2 min-h-14 w-full flex-row items-center justify-between rounded-xl border border-gray-920 px-4 py-2">
      <IconButton
        className={`h-10 w-10 ${isAtMin ? "bg-gray-800" : "bg-red-600"}`}
        disabled={isAtMin}
        icon={<Minus color={isAtMin ? "#525252" : "white"} size={20} />}
        onPress={handleDecrement}
      />

      <Text className="pbk-h6 text-base-white">{formatValue(value)}</Text>

      <IconButton
        className={`h-10 w-10 ${isAtMax ? "bg-gray-800" : "bg-green-600"}`}
        disabled={isAtMax}
        icon={<Plus color={isAtMax ? "#525252" : "white"} size={20} />}
        onPress={handleIncrement}
      />
    </View>
  );
};

export default StepperInput;

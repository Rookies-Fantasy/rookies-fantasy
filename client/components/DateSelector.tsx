import { CaretLeft, CaretRight } from "phosphor-react-native";
import { Text, View } from "react-native";
import IconButton from "./IconButton";

type DateSelectorProps = {
  dates: string[];
  currentDate: string;
  onDateChange: (date: string) => void;
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DateSelector = ({
  dates,
  currentDate,
  onDateChange,
}: DateSelectorProps) => {
  const currentIndex = dates.indexOf(currentDate);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onDateChange(dates[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < dates.length - 1) {
      onDateChange(dates[currentIndex + 1]);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    const today = new Date().toISOString().split("T")[0];

    const isToday = dateString === today;

    const [year, month, day] = dateString.split("-");

    return isToday
      ? `TODAY (${monthNames[parseInt(month) - 1]} ${day}, ${year})`
      : `${monthNames[parseInt(month) - 1]} ${day}, ${year}`;
  };

  const isPreviousDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex === dates.length - 1;

  return (
    <View className="w-full flex-row items-center justify-between border-b border-gray-900 px-6 py-4">
      <IconButton
        disabled={isPreviousDisabled}
        icon={<CaretLeft color={isPreviousDisabled ? "#4B5563" : "#6042FF"} />}
        onPress={handlePrevious}
        size={24}
      />

      <Text className="pbk-bl text-primary-500">{formatDate(currentDate)}</Text>

      <IconButton
        disabled={isNextDisabled}
        icon={<CaretRight color={isNextDisabled ? "#4B5563" : "#6042FF"} />}
        onPress={handleNext}
        size={24}
      />
    </View>
  );
};

export default DateSelector;

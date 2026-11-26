import DateTimePicker from "@react-native-community/datetimepicker";
import { WarningCircle } from "phosphor-react-native";
import { useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Button from "@/components/Button";
import { DeadlineWindow, LeagueDeadlineBounds } from "@/types/league";
import {
  formatDeadlineDate,
  formatLocalDate,
  parseLocalDate,
} from "@/utils/dateUtils";
import { cn, isNil, isNotNil } from "@/utils/jsUtils";

type LeagueDeadlineFieldProps = {
  value: string;
  onChange: (deadline: string) => void;
  bounds: LeagueDeadlineBounds | null;
  range: DeadlineWindow | null;
  isLoading: boolean;
  isError: boolean;
  isClamped: boolean;
  closedMessage: string;
};

const getPickerStartDate = (
  value: string,
  bounds: LeagueDeadlineBounds,
  range: DeadlineWindow,
): string => (value === "" || value < bounds.earliest ? range.default : value);

const LeagueDeadlineField = ({
  value,
  onChange,
  bounds,
  range,
  isLoading,
  isError,
  isClamped,
  closedMessage,
}: LeagueDeadlineFieldProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const isClosed = isNotNil(bounds) && isNil(range);

  const openPicker = () => {
    if (isNil(bounds) || isNil(range)) return;

    Keyboard.dismiss();
    setPickerDate(parseLocalDate(getPickerStartDate(value, bounds, range)));
    setIsPickerOpen(true);
  };

  return (
    <>
      <Text className="pbk-b2 mb-1.5 text-base-white">
        Registration Deadline
      </Text>
      <Pressable disabled={isNil(range)} onPress={openPicker}>
        <View
          className={cn(
            "mb-2 min-h-14 w-full flex-row items-center rounded-xl border px-2 py-2",
            isClosed ? "border-red-600" : "border-gray-920",
          )}
        >
          <TextInput
            className="flex-1 text-base-white placeholder:pbk-b1"
            editable={false}
            placeholder={isLoading ? "Loading dates..." : "Choose a date"}
            placeholderTextColor="gray"
            pointerEvents="none"
            value={value === "" ? "" : formatDeadlineDate(value)}
          />
          {isClosed && (
            <WarningCircle color="#dc2626" size={20} weight="bold" />
          )}
        </View>
      </Pressable>
      {isNotNil(bounds) && isNotNil(range) && (
        <Modal
          animationType="slide"
          onRequestClose={() => setIsPickerOpen(false)}
          transparent
          visible={isPickerOpen}
        >
          <Pressable className="flex-1" onPress={() => setIsPickerOpen(false)}>
            <View className="flex-1 items-center justify-end">
              <View className="w-full rounded-t-2xl bg-gray-920 p-8">
                <DateTimePicker
                  display="spinner"
                  maximumDate={parseLocalDate(range.latest)}
                  minimumDate={parseLocalDate(bounds.earliest)}
                  mode="date"
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setPickerDate(selectedDate);
                    }
                  }}
                  themeVariant="dark"
                  value={pickerDate}
                />
                <Button
                  label="Done"
                  onPress={() => {
                    onChange(formatLocalDate(pickerDate));
                    setIsPickerOpen(false);
                  }}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
      <View className="mb-6">
        {isClosed ? (
          <Text className="pbk-b3 text-red-600">{closedMessage}</Text>
        ) : isError ? (
          <Text className="pbk-b3 text-red-600">
            Could not load deadline dates
          </Text>
        ) : isClamped ? (
          <Text className="pbk-b3 text-yellow-500">
            Moved to the latest date allowed for this league size
          </Text>
        ) : (
          <Text className="pbk-b3 text-gray-600">
            Registration closes at the end of the chosen day (PT)
          </Text>
        )}
      </View>
    </>
  );
};

export default LeagueDeadlineField;

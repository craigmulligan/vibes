import React from "react";
import { View, Switch, StyleSheet } from "react-native";

const Toggle = ({
  value,
  setValue,
}: {
  value: boolean;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const handleToggle = () => {
    setValue((prevValue) => !prevValue);
  };

  return (
    <View style={styles.container}>
      <Switch value={value} onValueChange={handleToggle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Toggle;

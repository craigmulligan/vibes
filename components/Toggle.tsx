import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

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
      <Text style={styles.text}>{value ? "enabled" : "disabled"}</Text>
      <Button title="Toggle Simulation" onPress={handleToggle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default Toggle;

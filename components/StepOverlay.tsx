import { StyleSheet, Text, View } from "react-native";
import { Step } from "@mapbox/mapbox-sdk/services/directions";

const StepOverlay = ({ step }: { step: Step }) => {
  return (
    <View style={styles.container}>
      <Text>{step.maneuver.instruction}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "salmon",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default StepOverlay;

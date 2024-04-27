import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

const FullScreenMessage = ({ children }: { children: ReactNode }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default FullScreenMessage;

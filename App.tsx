import Map from "./components/Map";
import useConfig from "./hooks/useConfig";
import FullScreenMessage from "./components/FullScreenMessage";
import { Text, ActivityIndicator } from "react-native";

function App() {
  const { loading, data, error } = useConfig()

  if (loading) {
    return <FullScreenMessage><ActivityIndicator /></FullScreenMessage>
  }

  if (error) {
    return <FullScreenMessage><Text>{error}</Text></FullScreenMessage>
  }

  if (data) {
    return <Map config={data} />
  }
}

export default App

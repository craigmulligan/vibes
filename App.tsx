import Map from "./components/Map";
import * as Sentry from "@sentry/react-native";
import Vibrator from "./lib/vibrator";
import Director from "./lib/director";
import Router from "./lib/router";
import LocationTask from "./tasks/location";
import { Vibration } from "react-native";
import { isDev } from "./lib/utils";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

const router = new Router(process.env.EXPO_PUBLIC_MAPBOX_KEY as string);
const director = new Director(router);
const locationTask = new LocationTask(director, isDev());
locationTask.boot();
new Vibrator(director, isDev() ? () => {} : Vibration.vibrate);

function App() {
  return (
    <Map
      locationTask={locationTask}
      director={director}
      shouldSimulate={isDev()}
    />
  );
}

export default Sentry.wrap(App);

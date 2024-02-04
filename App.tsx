import Map from "./components/Map";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

function App() {
  return <Map />
}

export default Sentry.wrap(App);

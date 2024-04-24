import { useEffect, useState } from "react";
import * as ExpoLocation from "expo-location";

export default function useRequestPermissions() {
  const [granted, setGranted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { status: foregroundStatus } =
          await ExpoLocation.requestForegroundPermissionsAsync();
        if (foregroundStatus === "granted") {
          const { status: backgroundStatus } =
            await ExpoLocation.requestBackgroundPermissionsAsync();
          if (backgroundStatus === "granted") {
            setGranted(true);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err?.message);
        }
      }
    })();
  }, []);

  return { granted, error };
}

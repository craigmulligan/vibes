import { useMemo } from "react"
import Vibrator from "../lib/vibrator"
import Director from "../lib/director"
import Router from "../lib/router"
import { Vibration } from "react-native"

const useDirector = () => {
  const result = useMemo(() => {
    const router = new Router(process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string);
    const director = new Director(router);
    const vibrator = new Vibrator(director, Vibration.vibrate);

    return { director, vibrator, router }
  }, [])

  return result
}

export default useDirector

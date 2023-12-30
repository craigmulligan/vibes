import { useMemo } from "react"
import Vibrator from "../lib/vibrator"
import Director from "../lib/director"
import simpleRes from "../lib/director/simple.res.json";
import Router, { MockRouter } from "../lib/router"
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

export const useMockDirector = () => {
  const result = useMemo(() => {
    const router = new MockRouter();
    router.setResponse(simpleRes as any);
    const director = new Director(router);
    const vibrator = new Vibrator(director, Vibration.vibrate);

    return { director, vibrator, router }
  }, [])

  return result
}

export default useDirector

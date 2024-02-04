import { useMemo } from "react"
import Vibrator from "../lib/vibrator"
import Director from "../lib/director"
import Router from "../lib/router"
import { Vibration } from "react-native"

const useDirector = ({ vibrate = true, apiKey }: { vibrate: boolean, apiKey: string }) => {
  const result = useMemo(() => {
    const router = new Router(apiKey);
    const director = new Director(router);
    const vibration = vibrate ? Vibration.vibrate : () => { }
    const vibrator = new Vibrator(director, vibration);

    return { director, vibrator, router }
  }, [])

  return result
}

export default useDirector

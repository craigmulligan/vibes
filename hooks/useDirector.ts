import { useMemo } from "react"
import Vibrator from "../lib/vibrator"
import Director from "../lib/director"
import Router from "../lib/router"
import { Vibration } from "react-native"
import { isDev } from "../lib/utils"

const useDirector = ({ apiKey }: { apiKey: string }) => {
  const result = useMemo(() => {
    const router = new Router(apiKey);
    const director = new Director(router);
    const vibration = isDev() ? () => { } : Vibration.vibrate
    const vibrator = new Vibrator(director, vibration);

    return { director, vibrator, router }
  }, [])

  return result
}

export default useDirector

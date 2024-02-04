import { useEffect, useState } from "react"

export type ConfigData = {
  searchKey: string;
  directionsKey: string;
}

const useConfig = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<ConfigData | undefined>()

  useEffect(() => {
    async function fetchConfig() {
      const res = await fetch(
        "https://vibes.hey5806.workers.dev"
      );

      if (!res.ok) {
        setLoading(false)
        setError('Failed to fetch config')
      }

      const config = await res.json()
      setData(config);
      setLoading(false)
    }

    fetchConfig()
  }, [])

  return { loading, error, data }
}

export default useConfig 

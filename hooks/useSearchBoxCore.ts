import { useMemo } from "react";
import { SessionTokenLike } from "@mapbox/search-js-core";

class MapboxSearch {
  accessToken: string;

  constructor({ accessToken }: { accessToken: string }) {
    this.accessToken = accessToken;
  }

  async suggest(
    query: string,
    {
      sessionToken,
      origin,
    }: { sessionToken: SessionTokenLike; origin: undefined | number[] },
  ) {
    console.log("fetching suggestions", { query, origin });

    const res = await fetch(
      "https://api.mapbox.com/search/searchbox/v1/suggest?" +
        new URLSearchParams({
          access_token: this.accessToken,
          session_token: sessionToken.toString(),
          q: query,
          navigation_profile: "walking",
          language: "en",
          ...(origin ? { origin: origin.join(",") } : {}),
        }),
    );

    if (!res.ok) {
      console.log(res.status);
      throw new Error("Failed to fetch suggestions" + res.toString());
    }

    return res.json();
  }

  async retrieve(
    mapboxId: string,
    { sessionToken }: { sessionToken: SessionTokenLike },
  ) {
    const res = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?` +
        new URLSearchParams({
          access_token: this.accessToken,
          session_token: sessionToken.toString(),
        }),
    );

    if (!res.ok) {
      console.log(res.status);
      throw new Error("Failed to retrieve suggestions" + res.toString());
    }

    return res.json();
  }
}

export default function useMapboxSearch({
  accessToken,
}: {
  accessToken: string;
}) {
  return useMemo(() => new MapboxSearch({ accessToken }), [accessToken]);
}

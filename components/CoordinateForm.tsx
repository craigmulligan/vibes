import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, Text, StyleSheet } from "react-native";
import { SearchBoxSuggestion, SessionToken } from "@mapbox/search-js-core";
import useMapboxSearch from "../hooks/useSearchBoxCore";
import { Feature, Point } from "@turf/turf";
import { Location } from "../lib/director";

const sessionToken = new SessionToken();

const AutocompleteInput = ({
  currentLocation,
  onSelect,
}: {
  currentLocation: Location;
  onSelect: (location: Feature<Point>) => void;
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchBoxSuggestion[]>([]);
  const searchBoxCore = useMapboxSearch({
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN_PUBLIC as string,
  });

  useEffect(() => {
    // Fetch address suggestions when the query changes
    const fetchSuggestions = async () => {
      try {
        if (query.length > 5) {
          const result = await searchBoxCore.suggest(query, {
            sessionToken,
            origin: currentLocation,
          });
          setSuggestions(result.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    fetchSuggestions();
  }, [query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter address"
        value={query}
        onChangeText={(text) => setQuery(text)}
      />
      <FlatList
        data={suggestions}
        keyExtractor={(item) => `${item.mapbox_id}`}
        renderItem={({ item }) => (
          <Text
            style={styles.suggestion}
            onPress={async () => {
              const { features } = await searchBoxCore.retrieve(
                item.mapbox_id,
                { sessionToken },
              );

              console.log("Selected feature:", JSON.stringify(features[0]));

              onSelect(features[0]);
              setSuggestions([]);
            }}
          >
            {item.full_address}
          </Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
  },
  suggestion: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default AutocompleteInput;

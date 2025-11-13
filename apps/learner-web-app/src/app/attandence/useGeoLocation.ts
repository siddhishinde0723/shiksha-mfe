"use client";

import { useCallback } from "react";

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const useGeolocation = () => {
  const getLocation = useCallback(
    async (enableHighAccuracy = false): Promise<GeoLocationData | null> => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        return null;
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          () => resolve(null),
          {
            enableHighAccuracy,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    },
    []
  );

  return { getLocation };
};

export default useGeolocation;


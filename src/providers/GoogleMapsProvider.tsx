/**
 * GoogleMapsProvider
 * Loads Google Maps JavaScript API once for the entire application
 * Prevents multiple script loads when multiple map components are used
 */

"use client";

import { type Libraries, useLoadScript } from "@react-google-maps/api";
import { createContext, type ReactNode, useContext } from "react";
import { clientEnv } from "@/infrastructure/config/ClientEnv";

interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue | undefined>(
  undefined,
);

// Define libraries array outside component to prevent unnecessary re-renders
const libraries: Libraries = ["places"];

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: clientEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

/**
 * Hook to access Google Maps loading state
 * Must be used within GoogleMapsProvider
 */
export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error("useGoogleMaps must be used within GoogleMapsProvider");
  }
  return context;
}

// src/map/MapProvider.jsx
import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ['visualization', 'places'];
const MapContext = createContext({ isLoaded: false, loadError: null });

export function useMap() {
  return useContext(MapContext);
}

export function MapProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'en',
    region: 'US',
  });

  const value = { isLoaded, loadError };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
// TypeScript may complain about side-effect CSS imports in some setups.
// Ignore the next line to allow importing Leaflet's CSS here.
// @ts-ignore
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export const Map = ({ center = [-1.9441, 30.0619], zoom = 13, markers = [], onLocationSelect }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add click handler for location selection
    if (onLocationSelect) {
      mapRef.current.on('click', (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center, zoom, onLocationSelect]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    markers.forEach((marker) => {
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <div class="w-3 h-3 bg-white rounded-full"></div>
               </div>`,
        iconSize: [32, 32],
        popupAnchor: [0, -16],
      });

      L.marker([marker.lat, marker.lng], { icon: customIcon })
        .bindPopup(marker.title || 'Driver')
        .addTo(mapRef.current!);
    });
  }, [markers]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};
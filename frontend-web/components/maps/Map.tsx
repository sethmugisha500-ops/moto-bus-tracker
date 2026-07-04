// components/maps/Map.tsx
"use client";

import { useEffect, useRef } from "react";

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function Map({ center = [-1.9441, 30.0619], zoom = 14, className = "" }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (mapRef.current && !mapInstanceRef.current) {
        // @ts-ignore - Leaflet loaded globally
        const L = window.L;
        
        mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(mapInstanceRef.current);

        // Add marker at center
        const marker = L.marker(center)
          .addTo(mapInstanceRef.current)
          .bindPopup("📍 Your location")
          .openPopup();

        // Add some random markers for nearby drivers
        const nearbyDrivers = [
          { lat: center[0] + 0.002, lng: center[1] + 0.003, name: "Jean Paul" },
          { lat: center[0] - 0.0015, lng: center[1] + 0.004, name: "Marie Claire" },
          { lat: center[0] + 0.003, lng: center[1] - 0.002, name: "Eric Muneza" },
          { lat: center[0] - 0.002, lng: center[1] - 0.003, name: "Peter Nshuti" },
        ];

        nearbyDrivers.forEach((driver) => {
          const icon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background:#00C26F;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,194,111,0.5);display:flex;align-items:center;justify-content:center;font-size:8px;">🏍️</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([driver.lat, driver.lng], { icon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<strong>${driver.name}</strong><br>📍 Nearby driver`);
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      style={{ background: "#0D1510", minHeight: "300px" }}
    />
  );
}
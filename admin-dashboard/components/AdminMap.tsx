// admin-dashboard/components/AdminMap.tsx
"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBhSwtJuzcMWquIKGXCGRsHDsEWcELFINE";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
};

interface AdminMapProps {
  drivers?: Array<{ id: string; lat: number; lng: number; name: string }>;
  rides?: Array<{ id: string; lat: number; lng: number; status: string }>;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function AdminMap({ 
  drivers = [], 
  rides = [], 
  center = { lat: -1.9441, lng: 30.0619 }, 
  zoom = 13 
}: AdminMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  if (loadError) {
    return (
      <div className="bg-[#111714] border border-red-500/20 rounded-xl p-8 text-center">
        <p className="text-red-400">Error loading map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-[#111714] border border-gray-800 rounded-xl p-8 text-center">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-400 text-sm mt-2">Loading map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      options={{
        styles: [
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#1A2E1A" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0D1B2A" }],
          },
        ],
      }}
    >
      {/* Driver markers */}
      {drivers.map((driver) => (
        <Marker
          key={driver.id}
          position={{ lat: driver.lat, lng: driver.lng }}
          label={driver.name}
          icon={{
            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%2300C26F' stroke='%23FFFFFF' stroke-width='2'/%3E%3Ctext x='16' y='20' text-anchor='middle' font-size='14' fill='%23000000'%3E🚗%3C/text%3E%3C/svg%3E",
            scaledSize: new  google.maps.Size(32, 32),
          }}
        />
      ))}

      {/* Ride markers */}
      {rides.map((ride) => (
        <Marker
          key={ride.id}
          position={{ lat: ride.lat, lng: ride.lng }}
          icon={{
            url: ride.status === "ACTIVE" 
              ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23FF6B35' stroke='%23FFFFFF' stroke-width='2'/%3E%3Ctext x='16' y='20' text-anchor='middle' font-size='14' fill='%23000000'%3E📍%3C/text%3E%3C/svg%3E"
              : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%234280F5' stroke='%23FFFFFF' stroke-width='2'/%3E%3Ctext x='16' y='20' text-anchor='middle' font-size='14' fill='%23000000'%3E📍%3C/text%3E%3C/svg%3E",
            scaledSize: new google.maps.Size(32, 32),
          }}
        />
      ))}
    </GoogleMap>
  );
}
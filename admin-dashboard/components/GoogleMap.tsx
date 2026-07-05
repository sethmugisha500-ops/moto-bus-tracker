// components/GoogleMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

// Inline loader for Google Maps script to avoid external dependency
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBhSwtJuzcMWquIKGXCGRsHDsEWcELFINE';
let __googleMapsLoader: Promise<void> | null = null;
function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window is undefined'));
  if ((window as any).google && (window as any).google.maps) return Promise.resolve();
  if (__googleMapsLoader) return __googleMapsLoader;

  __googleMapsLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-google-maps]`);
    if (existing) {
      // if script tag exists, wait for load or error
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return __googleMapsLoader;
}
interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title?: string;
    icon?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: string) => void;
  height?: string | number;
  className?: string;
  showTraffic?: boolean;
  showStreetView?: boolean;
}

export default function GoogleMap({
  center = { lat: -1.9441, lng: 30.0619 },
  zoom = 13,
  markers = [],
  onMapClick,
  onMarkerClick,
  height = '400px',
  className = '',
  showTraffic = false,
  showStreetView = false,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerObjects, setMarkerObjects] = useState<google.maps.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Load Google Maps ──────────────────────────────────────────
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        setLoaded(true);
      } catch (err) {
        setError('Failed to load Google Maps');
        console.error(err);
      }
    };

    initMap();
  }, []);

  // ─── Initialize Map ────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: new google.maps.LatLng(center.lat, center.lng),
        zoom: zoom,
        styles: [
          {
            elementType: 'geometry',
            stylers: [{ color: '#242f3e' }],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#242f3e' }],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#746855' }],
          },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }],
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2835' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }],
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }],
          },
          {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: showStreetView,
        fullscreenControl: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
      });

      // Traffic layer
      if (showTraffic) {
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(mapInstance);
      }

      // Map click handler
      if (onMapClick) {
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
          }
        });
      }

      setMap(mapInstance);
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }
  }, [loaded, center, zoom, showTraffic, showStreetView, onMapClick]);

  // ─── Update Markers ─────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markerObjects.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(markerData.lat, markerData.lng),
        map: map,
        title: markerData.title,
        icon: markerData.icon || undefined,
        animation: google.maps.Animation.DROP,
      });

      if (markerData.onClick || onMarkerClick) {
        marker.addListener('click', () => {
          if (markerData.onClick) {
            markerData.onClick();
          }
          if (onMarkerClick) {
            onMarkerClick(markerData.id);
          }
        });
      }

      // Info window for each marker
      if (markerData.title) {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="color: #000; padding: 8px 12px; font-family: system-ui;">
            <strong>${markerData.title}</strong>
          </div>`,
        });

        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker);
        });

        marker.addListener('mouseout', () => {
          infoWindow.close();
        });
      }

      newMarkers.push(marker);
    });

    setMarkerObjects(newMarkers);

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [map, markers, onMarkerClick]);

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center ${className}`}>
        <p className="text-red-400 text-sm">⚠️ {error}</p>
        <p className="text-xs text-gray-500 mt-2">Please check your Google Maps API key</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className={`bg-[#0A0E0B] rounded-xl flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}
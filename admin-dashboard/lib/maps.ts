// lib/maps.ts
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBhSwtJuzcMWquIKGXCGRsHDsEWcELFINE';

// ─── LOAD GOOGLE MAPS SCRIPT ──────────────────────────────────────
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('#google-maps-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));

    document.head.appendChild(script);
  });
};

// ─── GEOCODE ADDRESS ──────────────────────────────────────────────
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    await loadGoogleMapsScript();
    const geocoder = new (window as any).google.maps.Geocoder();
    
    const result = await new Promise<any[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results: any[] | PromiseLike<any[]>, status: string) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });

    if (result && result.length > 0) {
      const location = result[0].geometry.location;
      return { lat: location.lat(), lng: location.lng() };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// ─── REVERSE GEOCODE ──────────────────────────────────────────────
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    await loadGoogleMapsScript();
    const geocoder = new (window as any).google.maps.Geocoder();
    
    const result = await new Promise<any[]>((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results: any[] | PromiseLike<any[]>, status: string) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });

    if (result && result.length > 0) {
      return result[0].formatted_address;
    }
    return '';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return '';
  }
};

// ─── CALCULATE DISTANCE ───────────────────────────────────────────
export const calculateDistance = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distance: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const service = new (window as any).google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [new (window as any).google.maps.LatLng(origin.lat, origin.lng)],
          destinations: [new (window as any).google.maps.LatLng(destination.lat, destination.lng)],
          travelMode: (window as any).google.maps.TravelMode.DRIVING,
          unitSystem: (window as any).google.maps.UnitSystem.METRIC,
        },
        (response: { rows: { elements: any[]; }[]; }, status: string) => {
          if (status === 'OK') {
            const element = response?.rows[0]?.elements[0];
            if (element?.status === 'OK') {
              resolve({
                distance: element.distance.value / 1000, // Convert to km
                duration: Math.ceil(element.duration.value / 60), // Convert to minutes
              });
            } else {
              reject(new Error('No route found'));
            }
          } else {
            reject(new Error(`Distance calculation failed: ${status}`));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

// ─── GET PLACE AUTOCOMPLETE ───────────────────────────────────────
export const getPlaceAutocomplete = (input: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      const autocompleteService = new (window as any).google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'rw' },
        },
        (predictions: any[] | PromiseLike<any[]>, status: string) => {
          if (status === 'OK' && predictions) {
            resolve(predictions);
          } else {
            reject(new Error(`Autocomplete failed: ${status}`));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

// ─── GET PLACE DETAILS ────────────────────────────────────────────
export const getPlaceDetails = (placeId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails({ placeId }, (result: any, status: string) => {
        if (status === 'OK' && result) {
          resolve(result);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
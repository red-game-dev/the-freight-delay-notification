/**
 * DeliveryMap Component
 * Shows a Google Maps route for a specific delivery
 */

'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { Alert } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';
import { useGoogleMaps } from '@/providers/GoogleMapsProvider';

interface DeliveryMapProps {
  origin: string;
  destination: string;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  mapTypeControl: true,
};

export function DeliveryMap({ origin, destination, className }: DeliveryMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  // Fetch directions when origin/destination change
  useEffect(() => {
    if (!isLoaded || !origin || !destination) return;

    const directionsService = new google.maps.DirectionsService();
    setIsLoadingDirections(true);
    setError(null);

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, status) => {
        setIsLoadingDirections(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setError(`Failed to load route: ${status}`);
        }
      }
    );
  }, [isLoaded, origin, destination]);

  if (loadError) {
    return (
      <Alert variant="error">
        Failed to load Google Maps. Please check your API key configuration.
      </Alert>
    );
  }

  if (!isLoaded || isLoadingDirections) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} style={{ height: '400px' }}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={10}
        options={mapOptions}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}

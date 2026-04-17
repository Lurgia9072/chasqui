import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { User } from '../types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { MapPin, Truck, Navigation, Info, X, Star, Phone } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Icons
const userIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const carrierIcon = L.divIcon({
  html: `<div class="w-10 h-10 bg-green-600 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center transform hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.235-2.977a1 1 0 0 0-.796-.383H15v4.5"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Haversine formula to calculate distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface NearbyCarriersMapProps {
  carriers: User[];
}

interface UserWithDistance extends User {
  distance?: number;
}

export const NearbyCarriersMap: React.FC<NearbyCarriersMapProps> = ({ carriers }) => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<UserWithDistance | null>(null);
  const [carriersWithDistance, setCarriersWithDistance] = useState<UserWithDistance[]>([]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation([-12.046374, -77.042793]);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation && carriers.length > 0) {
      const updated: UserWithDistance[] = carriers.map(carrier => {
        if (carrier.currentLocation?.lat !== undefined && carrier.currentLocation?.lng !== undefined) {
          const distance = calculateDistance(
            userLocation[0], userLocation[1],
            carrier.currentLocation.lat, carrier.currentLocation.lng
          );
          return { ...carrier, distance };
        }
        return carrier;
      });
      
      updated.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
      
      setCarriersWithDistance(updated);
    } else {
      setCarriersWithDistance(carriers);
    }
  }, [userLocation, carriers]);

  return (
    <div className="relative h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
      {userLocation ? (
        <MapContainer 
          center={userLocation} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapController center={userLocation} />

          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center font-bold">Tu Ubicación</div>
            </Popup>
          </Marker>

          {carriersWithDistance.map((carrier) => (
            carrier.currentLocation?.lat !== undefined && carrier.currentLocation?.lng !== undefined && (
              <Marker 
                key={carrier.uid} 
                position={[carrier.currentLocation.lat, carrier.currentLocation.lng]} 
                icon={carrierIcon}
                eventHandlers={{
                  click: () => setSelectedCarrier(carrier),
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <p className="font-bold text-green-600">{carrier.nombre}</p>
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="ml-1 text-[10px] font-bold">{carrier.rating.toFixed(1)}</span>
                    </div>
                    {carrier.distance && (
                      <p className="text-[10px] text-gray-500">A {carrier.distance.toFixed(1)} km</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      ) : (
        <div className="h-full w-full bg-gray-100 flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Obteniendo tu ubicación...</p>
        </div>
      )}

      {/* Floating Info Card */}
      <div className="absolute bottom-6 left-0 right-0 px-6 z-[1000] pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {selectedCarrier ? (
            <Card className="shadow-2xl border-2 border-green-500 bg-white/95 backdrop-blur-sm animate-in slide-in-from-bottom-10 duration-300">
              <CardContent className="p-5 relative">
                <button 
                  onClick={() => setSelectedCarrier(null)}
                  className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
                
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 bg-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-200">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-lg text-gray-900 truncate">{selectedCarrier.nombre}</h3>
                      <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm font-black">{selectedCarrier.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <Truck className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        <span className="truncate">{selectedCarrier.vehiculo?.tipo || 'Transportista'} • {selectedCarrier.vehiculo?.placa || '---'}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-gray-400">
                        <Phone className="h-3 w-3 mr-1.5" />
                        {selectedCarrier.telefono}
                        {selectedCarrier.distance && (
                          <span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                            A {selectedCarrier.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 h-10 font-bold"
                        onClick={() => navigate(`/profile/${selectedCarrier.uid}`)}
                      >
                        Ver Perfil
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-10 px-3"
                        onClick={() => window.open(`tel:${selectedCarrier.telefono}`)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-white/50 shadow-xl text-center">
              <p className="text-xs font-bold text-gray-600 flex items-center justify-center">
                <Info className="h-3 w-3 mr-2 text-green-500" />
                Selecciona un transportista en el mapa para ver detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

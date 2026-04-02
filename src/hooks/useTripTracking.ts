import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useTripTracking = (tripId: string | undefined, isCarrier: boolean) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = onSnapshot(doc(db, 'viajes', tripId), (snapshot) => {
      if (snapshot.exists()) {
        setTrip({ id: snapshot.id, ...snapshot.data() } as Trip);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  // Simulate movement if carrier
  useEffect(() => {
    if (isCarrier && trip?.estado === 'activo' && tripId) {
      const interval = setInterval(async () => {
        const newLat = trip.ubicacionActual.lat + (Math.random() - 0.5) * 0.0005;
        const newLng = trip.ubicacionActual.lng + (Math.random() - 0.5) * 0.0005;
        
        try {
          await updateDoc(doc(db, 'viajes', tripId), {
            ubicacionActual: { lat: newLat, lng: newLng }
          });
        } catch (err) {
          console.error('Error updating location:', err);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isCarrier, trip?.estado, tripId, trip?.ubicacionActual]);

  return { trip, loading };
};

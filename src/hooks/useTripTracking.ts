import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useTripTracking = (tripId: string | undefined, isCarrier: boolean) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = onSnapshot(doc(db, 'trips', tripId), (snapshot) => {
      if (snapshot.exists()) {
        setTrip({ id: snapshot.id, ...snapshot.data() } as Trip);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  // Define what we consider "active" for tracking purposes
  const isActiveStatus = trip?.estado && [
    'en_camino_a_recojo', 
    'recojo_completado', 
    'en_camino_a_destino'
  ].includes(trip.estado);

  // Simulate movement if carrier and trip is in progress
  useEffect(() => {
    if (isCarrier && isActiveStatus && tripId) {
      const interval = setInterval(async () => {
        const currentTracking = trip.seguimiento || { lat: -12.0463, lng: -77.0427 };
        const newLat = currentTracking.lat + (Math.random() - 0.5) * 0.0005;
        const newLng = currentTracking.lng + (Math.random() - 0.5) * 0.0005;
        
        try {
          await updateDoc(doc(db, 'trips', tripId), {
            seguimiento: { 
              lat: newLat, 
              lng: newLng,
              updatedAt: Date.now()
            }
          });
        } catch (err) {
          console.error('Error updating location:', err);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isCarrier, isActiveStatus, tripId, trip?.seguimiento]);

  return { trip, loading };
};

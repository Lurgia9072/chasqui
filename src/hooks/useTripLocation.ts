import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useTripLocation = (tripId: string | undefined) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = onSnapshot(doc(db, 'viajes', tripId), (snapshot) => {
      if (snapshot.exists()) {
        setLocation(snapshot.data().ubicacionActual);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trip location:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  return { location, loading };
};

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useTrip = (tripId: string | undefined) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = onSnapshot(doc(db, 'viajes', tripId), (snapshot) => {
      if (snapshot.exists()) {
        setTrip({ id: snapshot.id, ...snapshot.data() } as Trip);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trip:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  return { trip, loading };
};

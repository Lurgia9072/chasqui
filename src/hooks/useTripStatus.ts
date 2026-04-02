import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { TripStatus } from '../types';

export const useTripStatus = (tripId: string | undefined) => {
  const [status, setStatus] = useState<TripStatus>('activo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = onSnapshot(doc(db, 'viajes', tripId), (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.data().estado as TripStatus);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trip status:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  return { status, loading };
};

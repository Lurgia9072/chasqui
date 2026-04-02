import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useActiveCarrierTripAllInfo = (transportistaId: string | undefined) => {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!transportistaId) return;

    const q = query(
      collection(db, 'viajes'),
      where('transportistaId', '==', transportistaId),
      where('estado', '==', 'activo'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveTrip({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Trip);
      } else {
        setActiveTrip(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching active carrier trip info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [transportistaId]);

  return { activeTrip, loading };
};

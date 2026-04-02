import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useCarrierTripsAllInfo = (transportistaId: string | undefined) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!transportistaId) return;

    const q = query(
      collection(db, 'viajes'),
      where('transportistaId', '==', transportistaId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setTrips(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching carrier trips info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [transportistaId]);

  return { trips, loading };
};

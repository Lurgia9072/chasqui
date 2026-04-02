import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useMerchantTripsAll = (merchantId: string | undefined) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;

    const q = query(
      collection(db, 'viajes'),
      where('comercianteId', '==', merchantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setTrips(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching merchant trips:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [merchantId]);

  return { trips, loading };
};

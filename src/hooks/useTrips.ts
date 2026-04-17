import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useTrips = (userId: string | undefined, role: 'comerciante' | 'transportista') => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const field = role === 'comerciante' ? 'comercianteId' : 'transportistaId';
    const q = query(
      collection(db, 'trips'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
      setTrips(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trips:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, role]);

  return { trips, loading };
};

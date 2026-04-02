import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip } from '../types';

export const useActiveTrip = (userId: string | undefined, role: 'comerciante' | 'transportista') => {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const field = role === 'comerciante' ? 'comercianteId' : 'transportistaId';
    const q = query(
      collection(db, 'viajes'),
      where(field, '==', userId),
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
      console.error("Error fetching active trip:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, role]);

  return { activeTrip, loading };
};

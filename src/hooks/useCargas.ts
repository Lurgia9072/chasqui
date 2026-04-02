import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Cargo } from '../types';

export const useCargas = (filters?: { comercianteId?: string; estado?: string }) => {
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'cargas'), orderBy('createdAt', 'desc'));

    if (filters?.comercianteId) {
      q = query(q, where('comercianteId', '==', filters.comercianteId));
    }

    if (filters?.estado) {
      q = query(q, where('estado', '==', filters.estado));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargas(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cargas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filters?.comercianteId, filters?.estado]);

  return { cargas, loading };
};

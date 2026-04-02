import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Cargo } from '../types';

export const useCarrierCargas = (zones?: string[]) => {
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // En un MVP real, filtraríamos por zonas
    // Para este demo, mostramos todas las abiertas
    const q = query(
      collection(db, 'cargas'),
      where('estado', '==', 'abierta'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargas(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching carrier cargas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [zones]);

  return { cargas, loading };
};

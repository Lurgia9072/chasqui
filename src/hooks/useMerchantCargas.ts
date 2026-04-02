import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Cargo } from '../types';

export const useMerchantCargas = (merchantId: string | undefined) => {
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;

    const q = query(
      collection(db, 'cargas'),
      where('comercianteId', '==', merchantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargas(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching merchant cargas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [merchantId]);

  return { cargas, loading };
};

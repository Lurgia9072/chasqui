import { useState, useEffect } from 'react';
import { collectionGroup, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Offer } from '../types';

export const useOffers = (transportistaId: string | undefined) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!transportistaId) return;

    const q = query(
      collectionGroup(db, 'offers'),
      where('transportistaId', '==', transportistaId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
      setOffers(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching offers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [transportistaId]);

  return { offers, loading };
};

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Offer } from '../types';

export const useCargoOffersAllInfo = (cargoId: string | undefined) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cargoId) return;

    const q = query(collection(db, 'cargas', cargoId, 'offers'), orderBy('precioOfertado', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
      setOffers(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all cargo offers info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cargoId]);

  return { offers, loading };
};

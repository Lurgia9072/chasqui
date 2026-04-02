import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Offer } from '../types';

export const useMyOffer = (cargoId: string | undefined, transportistaId: string | undefined) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cargoId || !transportistaId) return;

    const q = query(
      collection(db, 'cargas', cargoId, 'offers'),
      where('transportistaId', '==', transportistaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setOffer({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Offer);
      } else {
        setOffer(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching my offer:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cargoId, transportistaId]);

  return { offer, loading };
};

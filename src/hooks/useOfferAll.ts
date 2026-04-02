import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Offer } from '../types';

export const useOfferAll = (cargoId: string | undefined, offerId: string | undefined) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cargoId || !offerId) return;

    const unsubscribe = onSnapshot(doc(db, 'cargas', cargoId, 'offers', offerId), (snapshot) => {
      if (snapshot.exists()) {
        setOffer({ id: snapshot.id, ...snapshot.data() } as Offer);
      } else {
        setOffer(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all offer info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cargoId, offerId]);

  return { offer, loading };
};

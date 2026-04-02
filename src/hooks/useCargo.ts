import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Cargo, Offer } from '../types';

export const useCargo = (cargoId: string | undefined) => {
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cargoId) return;

    const fetchCargo = async () => {
      const docRef = doc(db, 'cargas', cargoId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCargo({ id: docSnap.id, ...docSnap.data() } as Cargo);
      }
      setLoading(false);
    };

    fetchCargo();

    const q = query(collection(db, 'cargas', cargoId, 'offers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
      setOffers(docs.sort((a, b) => a.precioOfertado - b.precioOfertado));
    });

    return () => unsubscribe();
  }, [cargoId]);

  return { cargo, offers, loading };
};

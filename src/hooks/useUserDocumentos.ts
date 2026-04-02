import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserDocumentos = (userId: string | undefined) => {
  const [documentos, setDocumentos] = useState<{ dni: string; licencia: string; tarjetaPropiedad: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setDocumentos(snapshot.data().documentosUrls || null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user documents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { documentos, loading };
};

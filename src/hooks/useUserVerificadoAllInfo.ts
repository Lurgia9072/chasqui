import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { VerificationStatus } from '../types';

export const useUserVerificadoAllInfo = (userId: string | undefined) => {
  const [verificado, setVerificado] = useState<VerificationStatus>('pendiente');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setVerificado(snapshot.data().verificado as VerificationStatus);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user verification info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { verificado, loading };
};

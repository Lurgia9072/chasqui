import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { VerificationStatus } from '../types';

export const useUserVerification = (userId: string | undefined) => {
  const [status, setStatus] = useState<VerificationStatus>('pendiente');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.data().verificado as VerificationStatus);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching verification status:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { status, loading };
};

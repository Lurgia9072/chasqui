import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { User, OperationType } from '../types';

export const useAuth = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ 
              uid: userDoc.id, 
              ...data,
              createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : data.createdAt
            } as User);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
};

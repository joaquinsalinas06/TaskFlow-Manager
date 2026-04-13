import { useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export interface AuthError_Custom {
  code: string;
  message: string;
}

export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth);
  const [authError, setAuthError] = useState<AuthError_Custom | null>(null);

  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        setAuthError(null);
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const firebaseErr = err as AuthError;
        setAuthError({
          code: firebaseErr.code,
          message: firebaseErr.message,
        });
        throw err;
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setAuthError(null);
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const firebaseErr = err as AuthError;
        setAuthError({
          code: firebaseErr.code,
          message: firebaseErr.message,
        });
        throw err;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const firebaseErr = err as AuthError;
      setAuthError({
        code: firebaseErr.code,
        message: firebaseErr.message,
      });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setAuthError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      const firebaseErr = err as AuthError;
      setAuthError({
        code: firebaseErr.code,
        message: firebaseErr.message,
      });
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error: error || authError,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
  };
};

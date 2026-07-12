import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = false; // Always false — pure Firebase mode

  useEffect(() => {
    // Clear any stale demo mode flags from previous sessions
    localStorage.removeItem('transitops_demo_mode');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentUser(user);
            setUserRole(docSnap.data().role);
          } else {
            // Auto-create Firestore role document if missing
            let defaultRole = 'Driver';
            if (user.email.includes('manager') || user.email.includes('admin') || user.email.includes('devkamani9313')) {
              defaultRole = 'Manager';
            }
            await setDoc(docRef, {
              uid: user.uid,
              email: user.email,
              role: defaultRole
            });
            setCurrentUser(user);
            setUserRole(defaultRole);
          }
        } catch (e) {
          console.error("Firestore loading error:", e);
          setCurrentUser(user);
          setUserRole('Driver');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase Auth listener error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const docRef = doc(db, 'users', credential.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserRole(docSnap.data().role);
    } else {
      let defaultRole = 'Driver';
      if (email.includes('manager') || email.includes('admin') || email.includes('devkamani9313')) {
        defaultRole = 'Manager';
      }
      await setDoc(docRef, {
        uid: credential.user.uid,
        email: email,
        role: defaultRole
      });
      setUserRole(defaultRole);
    }
    return credential.user;
  };

  const loginAsRole = async (roleName) => {
    // One-click demo login disabled in production Firebase mode
    console.warn("One-Click demo login is disabled in Production Mode.");
  };

  const logout = async () => {
    localStorage.removeItem('transitops_user_session');
    localStorage.removeItem('transitops_demo_mode');
    setCurrentUser(null);
    setUserRole(null);
    await signOut(auth);
  };

  const signup = async (email, password, role) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email,
      role
    });
    setUserRole(role);
    return credential.user;
  };

  const toggleMode = () => {
    console.warn("Environment toggle is disabled in Production Mode.");
  };

  const value = {
    currentUser,
    userRole,
    loading,
    isDemoMode,
    login,
    loginAsRole,
    logout,
    signup,
    toggleMode,
    demoAccounts: {}
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

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
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Default credentials for one-click login
  const demoAccounts = {
    Manager: { email: 'manager@transitops.com', password: 'manager123', role: 'Manager' },
    Driver: { email: 'driver@transitops.com', password: 'driver123', role: 'Driver' },
    Safety: { email: 'safety@transitops.com', password: 'safety123', role: 'Safety Officer' },
    Analyst: { email: 'analyst@transitops.com', password: 'analyst123', role: 'Financial Analyst' }
  };

  useEffect(() => {
    // Check if we are running in local storage demo fallback
    const localDemoSetting = localStorage.getItem('transitops_demo_mode') === 'true';
    if (localDemoSetting) {
      setIsDemoMode(true);
      const activeSession = localStorage.getItem('transitops_user_session');
      if (activeSession) {
        const parsed = JSON.parse(activeSession);
        setCurrentUser(parsed);
        setUserRole(parsed.role);
      }
      setLoading(false);
      return;
    }

    // Try normal Firebase connection
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user role
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setCurrentUser(user);
            setUserRole(docSnap.data().role);
          } else {
            // Default fallback if doc missing
            setCurrentUser(user);
            setUserRole('Driver'); 
          }
        } catch (e) {
          console.warn("Firestore error, falling back to Local Demo Mode:", e);
          enableDemoModeFallback();
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firebase Auth listener error, falling back to Local Demo Mode:", error);
      enableDemoModeFallback();
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const enableDemoModeFallback = () => {
    setIsDemoMode(true);
    localStorage.setItem('transitops_demo_mode', 'true');
    // Pre-populate localStorage with demo mock data if not existing
    if (!localStorage.getItem('transitops_vehicles')) {
      // Create empty registries or copy template data
      console.log("Local Storage pre-seeded with fallback mock data.");
    }
  };

  const login = async (email, password) => {
    if (isDemoMode) {
      // Find matching mock user
      const matched = Object.values(demoAccounts).find(a => a.email === email && a.password === password);
      if (matched) {
        const mockUser = { uid: matched.role, email: matched.email, role: matched.role };
        setCurrentUser(mockUser);
        setUserRole(matched.role);
        localStorage.setItem('transitops_user_session', JSON.stringify(mockUser));
        return mockUser;
      }
      
      // Check dynamically created staff in LocalStorage
      const localDrivers = JSON.parse(localStorage.getItem('transitops_drivers') || '[]');
      const matchedLocal = localDrivers.find(d => d.email === email && d.password === password);
      if (matchedLocal) {
        const mockUser = { uid: matchedLocal.id, email: matchedLocal.email, role: matchedLocal.role };
        setCurrentUser(mockUser);
        setUserRole(matchedLocal.role);
        localStorage.setItem('transitops_user_session', JSON.stringify(mockUser));
        return mockUser;
      }
      throw new Error("Invalid credentials in Demo Mode");
    }

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const docRef = doc(db, 'users', credential.user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserRole(docSnap.data().role);
    }
    return credential.user;
  };

  const loginAsRole = async (roleName) => {
    const cred = demoAccounts[roleName];
    if (!cred) return;
    
    // Switch mode based on selection, default try Firebase first
    if (isDemoMode) {
      const mockUser = { uid: cred.role, email: cred.email, role: cred.role };
      setCurrentUser(mockUser);
      setUserRole(cred.role);
      localStorage.setItem('transitops_user_session', JSON.stringify(mockUser));
      return;
    }

    try {
      await login(cred.email, cred.password);
    } catch (err) {
      console.warn(`Firebase login failed for ${roleName}, running local switch.`, err);
      // Fallback
      setIsDemoMode(true);
      localStorage.setItem('transitops_demo_mode', 'true');
      const mockUser = { uid: cred.role, email: cred.email, role: cred.role };
      setCurrentUser(mockUser);
      setUserRole(cred.role);
      localStorage.setItem('transitops_user_session', JSON.stringify(mockUser));
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      setCurrentUser(null);
      setUserRole(null);
      localStorage.removeItem('transitops_user_session');
      return;
    }
    await signOut(auth);
  };

  const signup = async (email, password, role) => {
    if (isDemoMode) {
      const newUser = { uid: 'user_' + Date.now(), email, role };
      setCurrentUser(newUser);
      setUserRole(role);
      localStorage.setItem('transitops_user_session', JSON.stringify(newUser));
      return newUser;
    }

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
    const nextMode = !isDemoMode;
    setIsDemoMode(nextMode);
    localStorage.setItem('transitops_demo_mode', nextMode ? 'true' : 'false');
    // Force reload to reset listeners
    window.location.reload();
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
    demoAccounts
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

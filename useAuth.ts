import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/error-handler';
import { toast } from 'sonner';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'child' | 'patient';
  logopedistId?: string;
  isMaster?: boolean;
  createdAt: any;
  therapyStartDate?: string;
  initialEvaluation?: string;
  progressEvaluation?: string;
  sessionReports?: any[];
}

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for simple logopedist session first
    const savedSimpleProfile = localStorage.getItem('logopedist_session');
    if (savedSimpleProfile) {
      try {
        setProfile(JSON.parse(savedSimpleProfile));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('logopedist_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const isAdminEmail = firebaseUser.email === "jordache.genetics@gmail.com";
            const savedRole = localStorage.getItem('intended_role') as 'admin' | 'child' | 'patient' | null;
            
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: isAdminEmail ? 'admin' : (savedRole || 'child'),
              createdAt: serverTimestamp()
            };
            
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
              setProfile(newProfile);
            } catch (writeError) {
              handleFirestoreError(writeError, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
            localStorage.removeItem('intended_role');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          toast.error("Eroare la încărcarea profilului. Te rugăm să încerci din nou.");
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const loginSimple = (name: string) => {
    const allowedNames = ["Cristina", "Ramona", "Oana", "Iulia", "Ancuta", "Logotina Full"];
    if (!allowedNames.includes(name)) {
      throw new Error("Nume invalid");
    }

    const simpleProfile: UserProfile = {
      uid: `simple_${name.toLowerCase().replace(/\s+/g, '_')}`,
      email: `${name.toLowerCase().replace(/\s+/g, '_')}@logotina.ro`,
      displayName: name,
      role: 'admin',
      isMaster: name === "Logotina Full",
      createdAt: new Date()
    };

    localStorage.setItem('logopedist_session', JSON.stringify(simpleProfile));
    setProfile(simpleProfile);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('logopedist_session');
      await signOut(auth);
      setProfile(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return { user, profile, loading, login, loginSimple, logout };
}

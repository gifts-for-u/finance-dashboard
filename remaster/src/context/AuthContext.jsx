import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      toast.error("Gagal memeriksa sesi login.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      const result = await signInWithPopup(auth, provider);
      toast.success("Login Berhasil!");
      return result.user;
    } catch (error) {
      console.error("Google Sign In Error:", error);
      let errorMessage = "Login gagal. ";
      switch (error.code) {
        case "auth/popup-closed-by-user":
          errorMessage += "Popup login ditutup. Silakan coba lagi.";
          break;
        case "auth/popup-blocked":
          errorMessage += "Popup diblokir browser. Silakan aktifkan popup.";
          break;
        case "auth/network-request-failed":
          errorMessage += "Koneksi internet bermasalah. Periksa koneksi Anda.";
          break;
        default:
          errorMessage += error.message;
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logout Berhasil.");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Gagal melakukan logout.");
    }
  };

  const value = {
    user,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

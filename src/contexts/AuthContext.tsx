import { createContext, useContext, useState, useEffect } from "react";
import { User } from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

type UserData = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
};

// Mock User type if not using Firebase User directly
type MockUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: MockUser | null; // Use MockUser type
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>; // Add logout function signature
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>; // Add signup signature
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Add localStorage helpers at the top of the file
const saveUserToLocalStorage = (user: MockUser, userData: UserData) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('userData', JSON.stringify(userData));
};

const clearUserFromLocalStorage = () => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userData');
};

const getUserFromLocalStorage = () => {
  const storedUser = localStorage.getItem('currentUser');
  const storedUserData = localStorage.getItem('userData');
  
  if (!storedUser || !storedUserData) return { user: null, userData: null };
  
  try {
    const user = JSON.parse(storedUser) as MockUser;
    const userData = JSON.parse(storedUserData) as UserData;
    // Convert stored string date back to Date object
    userData.createdAt = new Date(userData.createdAt);
    return { user, userData };
  } catch (error) {
    console.error("Error parsing stored user data:", error);
    return { user: null, userData: null };
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null); // Use MockUser type
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // FIX: Define mock user details at the component level so they are accessible by login/logout etc.
  const mockUser: MockUser = {
    uid: "demo-user-123",
    email: "demo@example.com",
    displayName: "Demo User",
    photoURL: null,
  };

  const mockUserData: UserData = {
    uid: mockUser.uid,
    email: mockUser.email,
    displayName: mockUser.displayName,
    photoURL: mockUser.photoURL,
    createdAt: new Date(),
  };

  // Update the auto-login useEffect
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Check for user data in localStorage (for persistence between refreshes)
        const { user, userData } = getUserFromLocalStorage();
        
        if (user && userData) {
          console.log("Restored user session from localStorage");
          setCurrentUser(user);
          setUserData(userData);
        } else {
          // Option 1: Auto-login on load with the mock user
          setCurrentUser(mockUser);
          setUserData(mockUserData);
          // Save to localStorage for persistence
          saveUserToLocalStorage(mockUser, mockUserData);
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
      } finally {
        // Small delay to simulate auth checking process
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    initializeAuth();
  }, []);

  // Update login function to save user to localStorage
  const login = async (email: string, password: string) => {
    console.log("Mock login attempt with:", email);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    // Check mock credentials
    if (email === mockUser.email /* && password === 'password' */) {
      setCurrentUser(mockUser);
      setUserData(mockUserData);
      // Save to localStorage for persistence
      saveUserToLocalStorage(mockUser, mockUserData);
      toast.success("Logged in successfully!");
    } else {
      toast.error("Mock login failed: Invalid credentials");
      throw new Error("Mock login failed");
    }
    setLoading(false);
  };

  // Update loginWithGoogle to save user to localStorage
  const loginWithGoogle = async () => {
    console.log("Mock Google login attempt");
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentUser(mockUser);
    setUserData(mockUserData);
    // Save to localStorage for persistence
    saveUserToLocalStorage(mockUser, mockUserData);
    toast.success("Logged in with Google successfully!");
    setLoading(false);
  };

  // Update logout to clear localStorage
  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    setCurrentUser(null);
    setUserData(null);
    // Clear from localStorage
    clearUserFromLocalStorage();
    toast.success("Logged out successfully");
    setLoading(false);
  };

  // Update the signup function to save to localStorage
  const signup = async (email: string, password: string, displayName: string) => {
    console.log("Mock signup attempt with:", email, displayName);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simulate creating a new user - for mock, just log in as the demo user
    const newUser: MockUser = { ...mockUser, email, displayName, uid: `mock-${Date.now()}` };
    const newUserData: UserData = { ...mockUserData, email, displayName, uid: newUser.uid, createdAt: new Date() };
    setCurrentUser(newUser);
    setUserData(newUserData);
    // Save to localStorage for persistence
    saveUserToLocalStorage(newUser, newUserData);
    toast.success("Account created successfully!");
    setLoading(false);
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    loginWithGoogle,
    logout,
    signup // Provide signup function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

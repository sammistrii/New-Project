import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('ecopoints_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Mock login - replace with real API call
      if (email === 'test@example.com' && password === 'password123') {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          name: 'Demo User',
          points: 1250,
          wallet: 45.50,
          submissions: 8,
          level: 'Eco Warrior'
        };
        setUser(mockUser);
        localStorage.setItem('ecopoints_user', JSON.stringify(mockUser));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      // Mock registration - replace with real API call
      const mockUser = {
        id: Date.now(),
        email,
        name,
        points: 0,
        wallet: 0,
        submissions: 0,
        level: 'Eco Newbie'
      };
      setUser(mockUser);
      localStorage.setItem('ecopoints_user', JSON.stringify(mockUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ecopoints_user');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('ecopoints_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
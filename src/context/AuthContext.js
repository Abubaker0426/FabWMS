import React, { createContext, useContext, useState, useEffect } from 'react';
import webAuth0Service from '../services/webAuth0Service';
import authService from '../config/authConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user,        setUser]        = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => { checkAuthState(); }, []);

  useEffect(() => {
    if (!isLoading && !user) login();
  }, [isLoading, user]);

  const checkAuthState = async () => {
    try {
      const credentials = await webAuth0Service.getStoredCredentials();
      if (credentials?.access_token) {
        setAccessToken(credentials.access_token);
        authService.setUserToken(credentials.access_token);
        await getUserProfile(credentials.access_token);
      }
    } catch (error) {
      console.log('No valid credentials found:', error);
      await webAuth0Service.clearStoredCredentials();
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProfile = async (token) => {
    try {
      const userInfo = await webAuth0Service.getUserProfile(token);
      const username = userInfo.name ? userInfo.name.split('@')[0] : 'unknown_user';
      setUser({ ...userInfo, username });
    } catch (error) {
      console.log('Token expired, clearing credentials');
      await webAuth0Service.clearStoredCredentials();
      authService.setUserToken(null);
      setAccessToken(null);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      const credentials = await webAuth0Service.login();
      setAccessToken(credentials.access_token);
      authService.setUserToken(credentials.access_token);
      await getUserProfile(credentials.access_token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await webAuth0Service.logout();
      authService.setUserToken(null);
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearCredentials = async () => {
    try {
      await webAuth0Service.clearStoredCredentials();
      authService.setUserToken(null);
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, accessToken,
      isAuthenticated: !!user,
      login, logout, clearCredentials,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

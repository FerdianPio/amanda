import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, BusinessUnit, BusinessUnitTheme } from '../types';
import { api, setAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  businessUnit: BusinessUnit | null;
  theme: BusinessUnitTheme | null;
  isLoading: boolean;
  login: (credentials: { email?: string; userId?: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateThemeColors: (colors: { accentColor?: string; accentSoftColor?: string; primaryColor?: string }) => Promise<void>;
}

const defaultTheme: BusinessUnitTheme = {
  primaryColor: '#0D6E63',
  primaryDarkColor: '#094C44',
  accent: '#C97A3A',
  accentSoft: '#F5E7DA',
  backgroundColor: '#F1F4F3',
  surfaceColor: '#FFFFFF',
  surfaceSunkenColor: '#E9EEEC',
  textPrimaryColor: '#15221D',
  textMutedColor: '#5C6B65',
  textFaintColor: '#8B978F',
  borderColor: '#DCE4E1',
  initials: 'AG',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit | null>(null);
  const [theme, setTheme] = useState<BusinessUnitTheme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  const applyThemeToCss = (t: BusinessUnitTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', t.primaryColor);
    root.style.setProperty('--color-primary-dark', t.primaryDarkColor);
    root.style.setProperty('--color-accent', t.accent);
    root.style.setProperty('--color-accent-soft', t.accentSoft);
    root.style.setProperty('--color-bg', t.backgroundColor);
    root.style.setProperty('--color-surface', t.surfaceColor);
    root.style.setProperty('--color-surface-sunken', t.surfaceSunkenColor);
    root.style.setProperty('--color-text-primary', t.textPrimaryColor);
    root.style.setProperty('--color-text-muted', t.textMutedColor);
    root.style.setProperty('--color-text-faint', t.textFaintColor);
    root.style.setProperty('--color-border', t.borderColor);
  };

  const refreshUser = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setBusinessUnit(data.businessUnit);
      setTheme(data.theme);
      applyThemeToCss(data.theme);
    } catch (err) {
      console.warn('Could not restore session, logging in demo user Andi...');
      // Fallback: log in Andi by default
      const loginData = await api.login({ userId: 'u-andi' });
      setAuthToken(loginData.token);
      setUser(loginData.user);
      setBusinessUnit(loginData.businessUnit);
      setTheme(loginData.theme);
      applyThemeToCss(loginData.theme);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email?: string; userId?: string; password?: string }) => {
    setIsLoading(true);
    try {
      const data = await api.login(credentials);
      setAuthToken(data.token);
      setUser(data.user);
      setBusinessUnit(data.businessUnit);
      setTheme(data.theme);
      applyThemeToCss(data.theme);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    setBusinessUnit(null);
  };

  const updateThemeColors = async (colors: { accentColor?: string; accentSoftColor?: string; primaryColor?: string }) => {
    if (!businessUnit) return;
    await api.updateTheme(businessUnit.id, colors);
    const newTheme: BusinessUnitTheme = {
      ...theme,
      accent: colors.accentColor || theme.accent,
      accentSoft: colors.accentSoftColor || theme.accentSoft,
      primaryColor: colors.primaryColor || theme.primaryColor,
    };
    setTheme(newTheme);
    applyThemeToCss(newTheme);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businessUnit,
        theme,
        isLoading,
        login,
        logout,
        refreshUser,
        updateThemeColors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

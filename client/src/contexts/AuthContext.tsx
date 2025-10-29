"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { authService, User, SignupData, SigninData } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (data: SignupData) => Promise<boolean>;
  signin: (data: SigninData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = () => {
      const token = authService.getAccessToken();
      const savedUser = authService.getUser();

      if (token && savedUser) {
        setUser(savedUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signup = useCallback(
    async (data: SignupData): Promise<boolean> => {
      try {
        setIsLoading(true);
        const response = await authService.signup(data);

        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data;

          authService.setTokens(accessToken, refreshToken);
          authService.setUser(user);
          setUser(user);

          toast({
            title: "Success",
            description: response.message || "Admin registered successfully",
          });

          return true;
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to register",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const signin = useCallback(
    async (data: SigninData): Promise<boolean> => {
      try {
        setIsLoading(true);
        const response = await authService.signin(data);

        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data;

          authService.setTokens(accessToken, refreshToken);
          authService.setUser(user);
          setUser(user);

          toast({
            title: "Success",
            description: response.message || "Signed in successfully",
          });

          return true;
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to sign in",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authService.clearTokens();
      authService.clearUser();
      setUser(null);
      router.push("/admin/login");

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    }
  }, [router, toast]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentRefreshToken = authService.getRefreshToken();

      if (!currentRefreshToken) {
        return false;
      }

      const response = await authService.refreshToken({
        refreshToken: currentRefreshToken,
      });

      if (response.success && response.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        authService.setTokens(accessToken, newRefreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signup,
    signin,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

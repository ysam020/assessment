import { apiClient, ApiResponse } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

class AuthService {
  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>("/auth/signup", data);
  }

  async signin(data: SigninData): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>("/auth/signin", data);
  }

  async refreshToken(
    data: RefreshTokenData
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return apiClient.post<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh-token",
      data
    );
  }

  async logout(): Promise<ApiResponse<null>> {
    return apiClient.post<null>("/auth/logout");
  }

  // Token management
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  }

  clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }

  setUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  clearUser(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  }
}

export const authService = new AuthService();

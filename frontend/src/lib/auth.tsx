"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTH_STORAGE_KEY, api } from "./api";
import type { AuthInfo } from "./types";

interface AuthCtx {
  user: AuthInfo | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    businessName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* corrupted storage: treat as logged out */
    }
    setReady(true);
  }, []);

  const store = useCallback((info: AuthInfo) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(info));
    setUser(info);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      store(await api<AuthInfo>("/api/auth/login", { body: { email, password } }));
    },
    [store],
  );

  const register = useCallback<AuthCtx["register"]>(
    async (data) => {
      store(await api<AuthInfo>("/api/auth/register", { body: data }));
    },
    [store],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

"use client";

import { useEffect, useState } from "react";

import { POS_USERS_COOKIE } from "@/lib/auth-constants";

export type PosUserRole = "admin" | "seller";

export type PosUser = {
  id: number;
  userId: string;
  password: string;
  name: string;
  role: PosUserRole;
  createdAt: string;
};

export type PosCategory = {
  id: number;
  name: string;
  createdAt: string;
};

export type PosProduct = {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  categoryId: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
};

export type PosSaleItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
};

export type PosSale = {
  id: number;
  sellerId: number;
  totalAmount: number;
  paymentAmount: number;
  changeAmount: number;
  createdAt: string;
  items: PosSaleItem[];
};

export type PosData = {
  users: PosUser[];
  categories: PosCategory[];
  products: PosProduct[];
  sales: PosSale[];
};

const POS_DATA_EVENT = "pos-data-updated";

const emptyData: PosData = {
  users: [],
  categories: [],
  products: [],
  sales: [],
};

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function syncUsersCookie(users: PosUser[]) {
  if (typeof document === "undefined") return;
  document.cookie = `${POS_USERS_COOKIE}=${encodeBase64Url(JSON.stringify(users))}; Path=/; SameSite=Lax`;
}

export function subscribePosData(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = () => callback();
  window.addEventListener(POS_DATA_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(POS_DATA_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function notifyPosDataChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(POS_DATA_EVENT));
}

export async function fetchPosData() {
  const response = await fetch("/api/pos/bootstrap", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load POS data.");
  }

  const data = (await response.json()) as PosData;
  syncUsersCookie(data.users);
  return data;
}

export function usePosData() {
  const [data, setData] = useState<PosData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const active = { current: true };

    async function load() {
      try {
        setIsLoading(true);
        const nextData = await fetchPosData();
        if (!active.current) return;
        setData(nextData);
        setError("");
      } catch (loadError) {
        if (!active.current) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
      } finally {
        if (active.current) {
          setIsLoading(false);
        }
      }
    }

    void load();

    const unsubscribe = subscribePosData(() => {
      void load();
    });

    return () => {
      active.current = false;
      unsubscribe();
    };
  }, []);

  return { ...data, isLoading, error, refresh: () => notifyPosDataChanged() };
}

async function sendJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    throw new Error(
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "Request failed."
    );
  }

  notifyPosDataChanged();
  return payload as T;
}

export function resetPosData() {
  notifyPosDataChanged();
}

export function saveCategory(input: { id?: number; name: string }) {
  return sendJson("/api/pos/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(categoryId: number) {
  return sendJson("/api/pos/categories", {
    method: "DELETE",
    body: JSON.stringify({ id: categoryId }),
  });
}

export function saveProduct(
  input: Omit<PosProduct, "createdAt" | "updatedAt"> & { id?: number }
) {
  return sendJson("/api/pos/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteProduct(productId: number) {
  return sendJson("/api/pos/products", {
    method: "DELETE",
    body: JSON.stringify({ id: productId }),
  });
}

export function saveUser(input: Omit<PosUser, "createdAt"> & { id?: number }) {
  return sendJson("/api/pos/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteUser(userId: number) {
  return sendJson("/api/pos/users", {
    method: "DELETE",
    body: JSON.stringify({ id: userId }),
  });
}

export function recordSale(input: {
  sellerId: number;
  paymentAmount: number;
  items: Array<{ productId: number; quantity: number; price: number }>;
}) {
  return sendJson<PosSale>("/api/pos/sales", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

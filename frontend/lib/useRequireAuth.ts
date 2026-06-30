"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { STORAGE_KEYS } from "@/lib/storage";

export function useRequireAuth(): { isCheckingAuth: boolean } {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEYS.accessToken)) {
      router.push("/auth");
      return;
    }
    setIsCheckingAuth(false);
  }, [router]);

  return { isCheckingAuth };
}

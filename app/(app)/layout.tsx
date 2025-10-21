"use client";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "next/navigation";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.functions.user.get);
  const setupComplete = useQuery(api.functions.user.setupComplete);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (user && !setupComplete && pathname !== "/auth/setup")
      router.replace("/auth/setup");
  }, [user, router, setupComplete, pathname]);

  return children;
}

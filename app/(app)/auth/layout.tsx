"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <AuthLayout>{children}</AuthLayout>
    </Suspense>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.functions.user.get);
  const router = useRouter();
  const setupComplete = useQuery(api.functions.user.setupComplete);
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (user && setupComplete) {
      if (search.get("redirect") && search.get("redirect")?.startsWith("/"))
        router.replace(search.get("redirect")!);
      else router.replace("/");
    }
    if (user && !setupComplete && pathname !== "/auth/setup")
      router.replace("/auth/setup");
  }, [user, router, pathname, setupComplete, search]);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-74px)] w-full bg-primary">
      <div className="rounded-lg bg-card p-4 w-full max-w-md flex flex-col justify-center gap-4">
        {children}
      </div>
    </div>
  );
}

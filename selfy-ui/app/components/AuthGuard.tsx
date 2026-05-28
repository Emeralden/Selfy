"use client";
import { apiClient } from "@/lib/apiClient";
import { useCharacterStore } from "@/app/store/useCharacterStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_ROUTES = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const pathname   = usePathname();
  const setCharId  = useCharacterStore((s) => s.setCharId);
  const isPublic   = PUBLIC_ROUTES.includes(pathname);

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await apiClient.get("/auth/me");
      return res.data;
    },
    retry: false,
    enabled: !isPublic,
  });

  useEffect(() => {
    if (isPublic || isLoading) return;

    if (isError) {
      router.push("/login");
    } else if (user) {
      if (!user.active_character_id) {
        router.push("/new-life");
      } else {
        setCharId(user.active_character_id);
      }
    }
  }, [user, isLoading, isError, isPublic, router, setCharId]);

  if (isPublic) return <>{children}</>;

  if (isLoading || !user) return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <h1 className="animate-pulse text-xl font-black text-primary">Checking VIP Pass... 🎫</h1>
    </div>
  );

  return <>{children}</>;
}

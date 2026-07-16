"use client";
import { apiClient } from "@/lib/apiClient";
import { useCharacterStore } from "@/app/store/useCharacterStore";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_ROUTES = ["/login", "/register", "/death"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const setCharId  = useCharacterStore((s) => s.setCharId);
  const charId     = useCharacterStore((s) => s.charId);
  const justBorn   = useCharacterStore((s) => s.justBorn);
  const clearJustBorn = useCharacterStore((s) => s.clearJustBorn);
  const isPublic  = PUBLIC_ROUTES.includes(pathname);

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["authMe"],
    queryFn: async () => {
      const res = await apiClient.get("/auth/me");
      return res.data;
    },
    retry: false,
    enabled: !isPublic,
  });

  // Fetch character to check the alive flag
  const activeCharId = charId ?? user?.active_character_id;
  const { data: character, isError: isCharacterError } = useQuery<any>({
    queryKey: ["character", activeCharId],
    queryFn: async () => (await apiClient.get(`/character/${activeCharId}`)).data,
    enabled: !!activeCharId && !isPublic,
    retry: false,
  });

  useEffect(() => {
    if (isPublic || isLoading) return;

    // Fresh birth — new-life just created a character and set charId + justBorn.
    // Skip all redirect logic until authMe cache refreshes with the new character.
    if (justBorn) {
      clearJustBorn();
      return;
    }

    if (isError) {
      router.push("/login");
      return;
    }

    if (!user) return;

    if (user.active_character_id) {
      setCharId(user.active_character_id);

      // Character not found (404 or any error) → treat as no character
      if (isCharacterError) {
        if (pathname !== "/new-life") router.push("/new-life");
        return;
      }

      // Dead? Only /death and /new-life are allowed 💀
      if (character && character.alive === false && pathname !== "/death" && pathname !== "/new-life") {
        router.push("/death");
        return;
      }

      // Allow /new-life even when character is alive — user explicitly shelved
      // their character before navigating here.
    } else {
      // No active character — only /new-life and /user are allowed
      if (pathname !== "/new-life" && pathname !== "/user") router.push("/new-life");
    }
  }, [user, isLoading, isError, isPublic, pathname, router, setCharId, character, isCharacterError, justBorn, clearJustBorn]);

  if (isPublic) return <>{children}</>;

  if (isLoading || !user) return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <h1 className="animate-pulse text-xl font-black text-primary">Checking VIP pass... 🎫</h1>
    </div>
  );

  return <>{children}</>;
}

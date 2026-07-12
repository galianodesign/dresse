"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Root() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      window.location.replace(data.user ? "/armario" : "/login");
    });
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <p className="font-display text-3xl">Dressé</p>
    </main>
  );
}

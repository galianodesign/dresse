"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallback() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function procesar() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // Flujo PKCE: intercambiar el código por sesión explícitamente
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session) {
            window.location.replace("/armario");
            return;
          }
        }

        // Flujo implícito: el token viene en el hash (#access_token=...)
        if (window.location.hash.includes("access_token")) {
          // detectSessionInUrl del cliente ya lo procesa; esperamos y comprobamos
          await new Promise((r) => setTimeout(r, 800));
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            window.location.replace("/armario");
            return;
          }
        }

        // Último intento: comprobar si ya hay sesión activa
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          window.location.replace("/armario");
          return;
        }

        setError(true);
      } catch {
        setError(true);
      }
    }

    procesar();
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6">
      {error ? (
        <>
          <p className="font-display text-2xl">Algo salió mal</p>
          <p className="text-center text-sm text-muted">
            No se pudo completar el inicio de sesión.
          </p>
          <a href="/login" className="btn-primary mt-2 max-w-xs text-center">
            Volver a intentarlo
          </a>
        </>
      ) : (
        <>
          <p className="font-display text-3xl">Dressé</p>
          <p className="text-sm text-muted">Iniciando sesión…</p>
        </>
      )}
    </main>
  );
}

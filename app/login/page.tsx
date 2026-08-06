"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { EDAD_MINIMA, revisarNacimiento, fechaMaxima } from "@/lib/edad";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [nacimiento, setNacimiento] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    // Si ya hay sesión activa, redirigir
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/armario");
    });
  }, []);

  async function loginConGoogle() {
    setCargando(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Error al conectar con Google. Inténtalo de nuevo.");
      setCargando(false);
    }
  }

  async function loginConEmail() {
    if (!email || !password) {
      setError("Rellena el email y la contraseña.");
      return;
    }
    setCargando(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setCargando(false);
    } else {
      router.replace("/armario");
    }
  }

  async function registrarConEmail() {
    if (!email || !password || !nombre) {
      setError("Rellena todos los campos.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    // La edad se comprueba antes de crear nada. Si no llega a los 14, no se
    // abre la cuenta: es más limpio que crearla y borrarla luego.
    const problemaEdad = revisarNacimiento(nacimiento);
    if (problemaEdad) {
      setError(problemaEdad);
      return;
    }
    setCargando(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // La fecha viaja con la cuenta para que ControlEdad la recoja al
        // primer inicio de sesión y no vuelva a preguntar lo mismo.
        data: { full_name: nombre, nacimiento },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Error al crear la cuenta. Prueba con otro email.");
      setCargando(false);
    } else {
      setMensaje("Revisa tu email para confirmar la cuenta y luego inicia sesión.");
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-12">
      <div className="text-center">
        <h1 className="font-display text-[64px] leading-[1] tracking-[-0.02em]">
          Dressé
        </h1>
        <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted">
          Tu boutique personal
        </p>
        <p className="mx-auto mt-5 max-w-[26ch] text-[15px] leading-relaxed text-muted">
          Tu armario, tu estilista y tu comunidad de moda, en un solo sitio.
        </p>
      </div>

      <div className="space-y-4">
        {/* Google */}
        <button
          onClick={loginConGoogle}
          disabled={cargando}
          className="flex w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-ink bg-surface py-4 text-[13px] font-semibold uppercase tracking-[0.04em] transition-all active:scale-[0.98] disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-muted">o</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Tabs login / registro */}
        <div className="flex gap-2">
          <button
            onClick={() => { setModo("login"); setError(""); setMensaje(""); }}
            className="chip flex-1 justify-center"
            data-active={modo === "login"}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => { setModo("registro"); setError(""); setMensaje(""); }}
            className="chip flex-1 justify-center"
            data-active={modo === "registro"}
          >
            Crear cuenta
          </button>
        </div>

        {modo === "registro" && (
          <>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] outline-none transition-colors focus:border-ink"
            />

            {/* Se pregunta aquí, antes de crear nada, para no llegar a abrir
                la cuenta de un menor de 14 y tener que borrarla después. */}
            <div>
              <label
                htmlFor="nacimiento"
                className="mb-2 block px-1 text-[11px] uppercase tracking-[0.18em] text-muted"
              >
                Fecha de nacimiento
              </label>
              <input
                id="nacimiento"
                type="date"
                value={nacimiento}
                max={fechaMaxima()}
                onChange={(e) => { setNacimiento(e.target.value); setError(""); }}
                className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] outline-none transition-colors focus:border-ink"
              />
              <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted">
                Hay que tener al menos {EDAD_MINIMA} años. No se muestra a nadie.
              </p>
            </div>
          </>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] outline-none transition-colors focus:border-ink"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={modo === "registro" ? "Contraseña (mín. 6 caracteres)" : "Contraseña"}
          onKeyDown={(e) => e.key === "Enter" && (modo === "login" ? loginConEmail() : registrarConEmail())}
          className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] outline-none transition-colors focus:border-ink"
        />

        {error && (
          <p className="rounded-xl bg-accentSoft px-4 py-3 text-xs text-muted">
            {error}
          </p>
        )}

        {mensaje && (
          <p className="rounded-xl bg-accentSoft px-4 py-3 text-xs text-accent">
            {mensaje}
          </p>
        )}

        <button
          onClick={modo === "login" ? loginConEmail : registrarConEmail}
          disabled={cargando}
          className="btn-primary"
        >
          {cargando
            ? "Un momento…"
            : modo === "login"
            ? "Iniciar sesión"
            : "Crear mi cuenta"}
        </button>
      </div>

      {/* Estos dos enlaces son obligatorios y tienen que poder leerse ANTES de
          registrarse, no después. Durante meses esta frase prometió dos páginas
          que no existían. */}
      <p className="text-center text-xs leading-relaxed text-muted">
        Al continuar aceptas los{" "}
        <Link href="/legal/terminos" className="underline hover:text-ink">
          términos de uso
        </Link>{" "}
        y la{" "}
        <Link href="/legal/privacidad" className="underline hover:text-ink">
          política de privacidad
        </Link>
        . Tus fotos se analizan con inteligencia artificial para reconocer tus
        prendas.
      </p>
    </main>
  );
}

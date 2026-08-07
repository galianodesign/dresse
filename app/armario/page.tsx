"use client";

import { useMemo, useRef, useState } from "react";
import BotonCerrar, { CabeceraPanel } from "@/components/BotonCerrar";
import BottomNav from "@/components/BottomNav";
import GuiaPrimerosPasos from "@/components/GuiaPrimerosPasos";
import Header from "@/components/Header";
import PrendaCard from "@/components/PrendaCard";
import { Flourish, SectionBackdrop } from "@/components/ThemeDecor";
import Toast from "@/components/Toast";
import { useStore } from "@/lib/store";
import { plural } from "@/lib/plural";
import { CATEGORIAS, Categoria, ESTILOS, Prenda, Look, diasSinUsar } from "@/lib/data";
import { t, ClaveTexto } from "@/lib/i18n";
import { comprimirADataUrl } from "@/lib/imagen";

const LIMITE_GRATIS = 20;
const DIAS_OLVIDO = 30;

export default function Armario() {
  const {
    prendas,
    addPrenda,
    updatePrenda,
    removePrenda,
    looks,
    addLook,
    removeLook,
    perfil,
  } = useStore();

  const [vista, setVista] = useState<"prendas" | "looks">("prendas");
  const [filtro, setFiltro] = useState<Categoria | "todas">("todas");
  const [filtroEstilo, setFiltroEstilo] = useState<string>("Todos");
  const [filtroColor, setFiltroColor] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"recientes" | "olvidadas" | "color" | "nombre">("recientes");
  const [modoVista, setModoVista] = useState<"grid" | "lista">("grid");
  const [toast, setToast] = useState("");
  const [nueva, setNueva] = useState<Prenda | null>(null);
  const [analizando, setAnalizando] = useState(false);
  // Las dos versiones de la foto, para que la usuaria pueda quedarse con la
  // suya si el recorte automático no le convence.
  const [originalFoto, setOriginalFoto] = useState<string | null>(null);
  const [fotoLimpia, setFotoLimpia] = useState<string | null>(null);
  const [usarOriginal, setUsarOriginal] = useState(false);
  const [eligiendo, setEligiendo] = useState(false);
  const [limiteAbierto, setLimiteAbierto] = useState(false);
  const [detalle, setDetalle] = useState<Prenda | null>(null);
  const [creandoLook, setCreandoLook] = useState(false);
  const [lookSel, setLookSel] = useState<string[]>([]);
  const [lookNombre, setLookNombre] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function avisar(msg: string) {
    setToast("");
    // setTimeout y no requestAnimationFrame: si la pantalla no esta
    // pintando fotogramas (app en segundo plano, pestana oculta) rAF no llega
    // a ejecutarse nunca y el aviso no aparece. Con avisos de error eso
    // significa fallar en silencio, que es justo lo que se quiere evitar.
    setTimeout(() => setToast(msg), 0);
    setTimeout(() => setToast(""), 1900);
  }
  const galeriaRef = useRef<HTMLInputElement>(null);

  const coloresUnicos = useMemo(
    () => Array.from(new Set(prendas.map((p) => p.color).filter((c) => c && c !== "—"))).sort(),
    [prendas]
  );
  const estilosUnicos = useMemo(
    () => Array.from(new Set(prendas.map((p) => p.estilo).filter((e) => e && e !== "—"))).sort(),
    [prendas]
  );

  // Outfit del día: sugerencia determinista según la fecha
  const outfitDelDia = useMemo(() => {
    const dia = Math.floor(Date.now() / 86400000);
    const pick = (cat: Categoria) => {
      const grupo = prendas.filter((p) => p.categoria === cat);
      return grupo.length ? grupo[dia % grupo.length] : null;
    };
    const partes = [pick("top"), pick("pantalon"), pick("calzado")].filter(
      (p): p is Prenda => p !== null
    );
    return partes.length >= 2 ? partes : null;
  }, [prendas]);

  const visibles = useMemo(() => {
    let v = filtro === "todas" ? prendas : prendas.filter((p) => p.categoria === filtro);
    if (filtroEstilo !== "Todos") v = v.filter((p) => p.estilo === filtroEstilo);
    if (filtroColor !== "Todos") v = v.filter((p) => p.color === filtroColor);
    const q = busqueda.trim().toLowerCase();
    if (q) {
      v = v.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.color.toLowerCase().includes(q) ||
          p.estilo.toLowerCase().includes(q)
      );
    }
    v = [...v];
    if (orden === "olvidadas") {
      v.sort((a, b) => (diasSinUsar(b) ?? -1) - (diasSinUsar(a) ?? -1));
    } else if (orden === "color") {
      v.sort((a, b) => a.color.localeCompare(b.color, "es"));
    } else if (orden === "nombre") {
      v.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    // "recientes" mantiene el orden natural (las nuevas se añaden primero)
    return v;
  }, [prendas, filtro, filtroEstilo, filtroColor, busqueda, orden]);

  const olvidada = useMemo(() => {
    const conDias = prendas
      .map((p) => ({ p, d: diasSinUsar(p) }))
      .filter((x): x is { p: Prenda; d: number } => x.d !== null && x.d >= DIAS_OLVIDO)
      .sort((a, b) => b.d - a.d);
    return conDias[0] || null;
  }, [prendas]);

  const limiteAlcanzado = !perfil.premium && prendas.length >= LIMITE_GRATIS;
  const tx = (clave: ClaveTexto) => t(perfil.idioma, clave);

  async function onFoto(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAnalizando(true);
      setOriginalFoto(dataUrl);
      setUsarOriginal(false);

      // Catalogar y limpiar la foto van EN PARALELO: las dos tardan unos
      // segundos, así que la espera es la de la más lenta, no la suma.
      // Madame Dressé analiza la foto original a propósito: los colores y
      // detalles reales son los suyos, no los de una imagen ya procesada.
      const catalogar = (async () => {
        try {
          // Reducir antes de enviar: Vercel rechaza peticiones >4,5 MB y una
          // foto de iPhone a resolución completa las supera. Sin esto el
          // catalogado fallaba y la prenda se guardaba sin color, que es
          // justo lo que Madame Dressé necesita para vestirte.
          const paraIA = await comprimirADataUrl(dataUrl);
          const res = await fetch("/api/asesor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modo: "catalogar", imagen: paraIA }),
          });
          if (res.ok) return await res.json();
          // Un 401 o un 429 no son "no la he reconocido": son sesión caducada
          // o cupo agotado, y conviene decirlo tal cual.
          const motivo = await res.json().catch(() => null);
          if (motivo?.error) return { _error: motivo.error as string };
        } catch {}
        return null;
      })();

      const limpiar = (async () => {
        try {
          const { recortarFondo } = await import("@/lib/recorteFondo");
          const r = await recortarFondo(dataUrl);
          // Cobertura absurda = el modelo no ha encontrado la prenda.
          // Mejor la foto original que un recorte sin sentido.
          if (r.cobertura < 0.01 || r.cobertura > 0.97) return null;
          return r.imagen;
        } catch {
          return null; // sin conexión, navegador antiguo, etc.
        }
      })();

      const [sugerencia, limpia] = await Promise.all([catalogar, limpiar]);
      setAnalizando(false);
      setFotoLimpia(limpia);
      // Si el catalogado falla, la prenda se guarda sin color y eso deja
      // ciega a Madame Dressé. Antes pasaba en silencio: ahora se avisa.
      if (sugerencia?._error) avisar(sugerencia._error);
      else if (!sugerencia) avisar("No pude reconocer la prenda; revísala");
      const s = sugerencia?._error ? {} : sugerencia || {};
      setNueva({
        id: `p${Date.now()}`,
        nombre: s.nombre || "Nueva prenda",
        categoria: s.categoria || "top",
        color: s.color || "—",
        estilo: s.estilo || perfil.estilo || "—",
        imagen: limpia || dataUrl,
        ultimoUso: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  }

  function guardarLook() {
    const nombre = lookNombre.trim();
    if (!nombre || lookSel.length < 2) return;
    const look: Look = {
      id: `l${Date.now()}`,
      nombre,
      prendaIds: lookSel,
      creado: new Date().toISOString(),
    };
    addLook(look);
    setCreandoLook(false);
    setLookSel([]);
    setLookNombre("");
    setVista("looks");
    avisar("Look guardado");
  }

  const nombreDe = (id: string) => prendas.find((p) => p.id === id)?.nombre || "—";

  return (
    <main className="relative mx-auto max-w-md px-5 pb-28 pt-8">
      <SectionBackdrop seccion="armario" />

      <Header
        titulo="Mi armario"
        subtitulo={`${plural(prendas.length, "prenda")} · ${plural(looks.length, "look")}${!perfil.premium ? ` · ${plural(Math.max(0, LIMITE_GRATIS - prendas.length), "libre")} en tu plan` : ""}`}
      />

      {/* Guía de primeros pasos: desaparece sola al completar los tres */}
      {vista === "prendas" && (
        <GuiaPrimerosPasos
          onAnadirPrenda={() => setEligiendo(true)}
          onCrearLook={() => {
            setCreandoLook(true);
            setLookSel([]);
            setLookNombre("");
          }}
        />
      )}

      {/* Aviso de prenda olvidada */}
      {olvidada && vista === "prendas" && (
        <button
          onClick={() => setDetalle(olvidada.p)}
          className="card rise mb-4 flex w-full items-center gap-3 p-3.5 text-left"
        >
          <span className="text-xl">🧥</span>
          <p className="text-sm leading-snug text-muted">
            Llevas <span className="font-medium text-ink">{plural(olvidada.d, "día")}</span> sin
            ponerte <span className="font-medium text-ink">{olvidada.p.nombre}</span>.
            ¿Le das una oportunidad esta semana?
          </p>
        </button>
      )}

      {/* Outfit del día */}
      {outfitDelDia && vista === "prendas" && (
        <div className="hang-tag rise mb-4 px-4 py-4 pt-8">
          <p className="text-[12px] uppercase tracking-[0.25em] text-accent">
            Outfit del día
          </p>
          <p className="mt-1 font-display text-lg leading-snug">
            {outfitDelDia.map((p) => p.nombre).join(" + ")}
          </p>
          <button
            onClick={() => {
              addLook({
                id: `l${Date.now()}`,
                nombre: `Outfit del ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`,
                prendaIds: outfitDelDia.map((p) => p.id),
                creado: new Date().toISOString(),
              });
              avisar("Guardado en tus looks");
            }}
            className="mt-2 rounded-xl border border-accent bg-accentSoft px-4 py-2 text-xs"
          >
            Guardar como look
          </button>
        </div>
      )}

      {/* Conmutador Prendas / Looks */}
      <div className="mb-4 flex gap-2">
        <button className="chip" data-active={vista === "prendas"} onClick={() => setVista("prendas")}>
          Prendas
        </button>
        <button className="chip" data-active={vista === "looks"} onClick={() => setVista("looks")}>
          Mis looks {looks.length > 0 && `(${looks.length})`}
        </button>
        {vista === "prendas" && prendas.length >= 2 && (
          <button
            className="chip ml-auto"
            onClick={() => {
              setCreandoLook(true);
              setLookSel([]);
              setLookNombre("");
            }}
          >
            + Crear look
          </button>
        )}
      </div>

      {vista === "prendas" && (
        <>
          {/* Buscador y filtros: con el armario vacío solo estorban */}
          {prendas.length > 0 && (
            <>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, color o estilo…"
                className="mb-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
              />

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFiltro("todas")} className="chip" data-active={filtro === "todas"}>
                  Todas
                </button>
                {CATEGORIAS.map((c) => (
                  <button key={c.id} onClick={() => setFiltro(c.id)} className="chip" data-active={filtro === c.id}>
                    {c.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Filtro combinado: estilo + color */}
          {(estilosUnicos.length > 1 || coloresUnicos.length > 1) && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              <select
                value={filtroEstilo}
                onChange={(e) => setFiltroEstilo(e.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none"
              >
                <option value="Todos">Estilo: todos</option>
                {estilosUnicos.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <select
                value={filtroColor}
                onChange={(e) => setFiltroColor(e.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none"
              >
                <option value="Todos">Color: todos</option>
                {coloresUnicos.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {(filtroEstilo !== "Todos" || filtroColor !== "Todos") && (
                <button
                  className="chip"
                  onClick={() => {
                    setFiltroEstilo("Todos");
                    setFiltroColor("Todos");
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* Ordenar + cambiar vista */}
          {prendas.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as typeof orden)}
                className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none"
              >
                <option value="recientes">Más recientes</option>
                <option value="olvidadas">Más olvidadas</option>
                <option value="color">Por color (A-Z)</option>
                <option value="nombre">Por nombre (A-Z)</option>
              </select>
              <button
                onClick={() => setModoVista(modoVista === "grid" ? "lista" : "grid")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface"
                aria-label="Cambiar vista"
              >
                {modoVista === "grid" ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="4" width="7" height="7" rx="1.5" />
                    <rect x="13" y="4" width="7" height="7" rx="1.5" />
                    <rect x="4" y="13" width="7" height="7" rx="1.5" />
                    <rect x="13" y="13" width="7" height="7" rx="1.5" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {modoVista === "grid" ? (
            <div className="grid grid-cols-2 gap-3">
              {visibles.map((p) => (
                <button key={p.id} onClick={() => setDetalle(p)} className="text-left">
                  <PrendaCard prenda={p} />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {visibles.map((p) => {
                const d = diasSinUsar(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => setDetalle(p)}
                    className="card flex w-full items-center gap-3 p-3 text-left"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-accentSoft">
                      {p.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagen} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" fill="none" stroke="currentColor" strokeWidth="1.4">
                            <path d="M16 4l4 3-2 3-2-1v11H8V9L6 10 4 7l4-3a3 3 0 004 0 3 3 0 004 0z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base leading-tight">
                        {p.favorito && <span className="mr-1 text-accent">♥</span>}
                        {p.nombre}
                      </p>
                      <p className="text-[12px] uppercase tracking-widest text-muted">
                        {p.color} · {p.estilo}
                        {d !== null && ` · hace ${d}d`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {visibles.length === 0 && (
            <div className="py-14 text-center">
              <div className="mb-3 flex justify-center opacity-60">
                <Flourish size={64} />
              </div>
              <p className="text-sm text-muted">
                {busqueda
                  ? "No hay prendas que encajen con tu búsqueda."
                  : "Tu armario está esperando su primera prenda."}
              </p>
              {!busqueda && (
                <button
                  onClick={() => setEligiendo(true)}
                  className="mt-4 rounded-xl bg-ink px-6 py-2.5 text-xs text-bg"
                >
                  Añadir mi primera prenda
                </button>
              )}
            </div>
          )}
        </>
      )}

      {vista === "looks" && (
        <div className="space-y-3">
          {looks.length === 0 && (
            <div className="py-14 text-center">
              <div className="mb-3 flex justify-center opacity-60">
                <Flourish size={64} />
              </div>
              <p className="text-sm text-muted">
                Aún no has guardado ningún look.
              </p>
              <button
                onClick={() => {
                  setCreandoLook(true);
                  setLookSel([]);
                  setLookNombre("");
                }}
                className="mt-4 rounded-xl bg-ink px-6 py-2.5 text-xs text-bg"
              >
                Crear mi primer look
              </button>
            </div>
          )}
          {looks.map((l) => (
            <div key={l.id} className="hang-tag px-4 py-4 pt-7">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg">{l.nombre}</p>
                <button
                  onClick={() => removeLook(l.id)}
                  className="text-[12px] text-muted underline underline-offset-2"
                >
                  Eliminar
                </button>
              </div>
              <p className="mt-1 text-sm text-muted">
                {l.prendaIds.map(nombreDe).join(" + ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Inputs de foto */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFoto(f);
          e.target.value = "";
        }}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFoto(f);
          e.target.value = "";
        }}
      />

      {/* Botón flotante */}
      {vista === "prendas" && (
        <button
          onClick={() => {
            if (limiteAlcanzado) {
              setLimiteAbierto(true);
              return;
            }
            setEligiendo(true);
          }}
          className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-bg shadow-lg"
          aria-label="Añadir prenda"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Armario lleno en el plan gratuito.
          Era un alert() del navegador sin salida ninguna. Mientras Stripe no
          esté, lo honesto es explicarlo y ofrecer lo único que sí se puede
          hacer hoy: quitar alguna prenda. */}
      {limiteAbierto && (
        <div
          className="overlay fixed inset-0 z-50 flex items-end bg-ink/40"
          onClick={() => setLimiteAbierto(false)}
        >
          <div
            className="sheet w-full rounded-t-[28px] bg-surface p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <CabeceraPanel
              titulo="Tu armario está lleno"
              onCerrar={() => setLimiteAbierto(false)}
            >
              <p className="mt-1 text-sm leading-relaxed text-muted">
                El plan gratuito guarda hasta {LIMITE_GRATIS} prendas y ya las
                tienes todas.
              </p>
            </CabeceraPanel>

            <p className="text-sm leading-relaxed text-muted">
              Premium quitará ese límite, pero todavía no está disponible.
              Mientras tanto, puedes hacer sitio quitando alguna prenda que ya
              no uses: toca una y elige “Eliminar prenda”.
            </p>

            <button
              onClick={() => {
                setLimiteAbierto(false);
                setOrden("olvidadas");
              }}
              className="btn-primary mt-5"
            >
              Ver las que menos me pongo
            </button>
          </div>
        </div>
      )}

      {/* Elegir origen de la foto */}
      {eligiendo && (
        <div className="overlay fixed inset-0 z-50 flex items-end bg-ink/40" onClick={() => setEligiendo(false)}>
          <div className="sheet w-full rounded-t-[28px] bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <CabeceraPanel
              titulo={tx("fotoTitulo")}
              onCerrar={() => setEligiendo(false)}
            />

            {/* Instrucciones en el paso obligatorio: para llegar a la cámara
                hay que pasar por aquí, así que nadie se las salta. */}
            <div className="mt-4 rounded-2xl bg-accentSoft p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                {tx("fotoGuiaTitulo")}
              </p>
              <ol className="mt-2.5 space-y-2">
                {[tx("fotoGuia1"), tx("fotoGuia2"), tx("fotoGuia3")].map((linea, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-snug">
                    <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-bg">
                      {i + 1}
                    </span>
                    <span>{linea}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[12px] leading-snug text-muted">
                {tx("fotoGuiaNota")}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  setEligiendo(false);
                  fileRef.current?.click();
                }}
                className="btn-primary"
              >
                {tx("fotoHacer")}
              </button>
              <button
                onClick={() => {
                  setEligiendo(false);
                  galeriaRef.current?.click();
                }}
                className="w-full rounded-2xl border border-line bg-bg py-3.5 text-sm tracking-wide"
              >
                {tx("fotoGaleria")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar prenda nueva */}
      {(nueva || analizando) && (
        <div className="overlay fixed inset-0 z-50 flex items-end bg-ink/40" onClick={() => !analizando && setNueva(null)}>
          <div className="sheet w-full rounded-t-[28px] bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            {analizando ? (
              <p className="py-10 text-center text-sm text-muted">
                Analizando tu prenda…
              </p>
            ) : (
              nueva && (
                <>
                  <CabeceraPanel
                    titulo="Nueva prenda"
                    onCerrar={() => setNueva(null)}
                  />

                  {/* Vista previa. Si hubo recorte, se puede volver a la
                      foto original: el modelo falla con prendas claras sobre
                      fondo claro y no queremos obligarla a tragar con ello. */}
                  {(fotoLimpia || originalFoto) && (
                    <div className="mt-4">
                      <div className="overflow-hidden rounded-2xl bg-accentSoft">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={(usarOriginal ? originalFoto : fotoLimpia) || originalFoto || ""}
                          alt=""
                          className="mx-auto block max-h-52 w-auto"
                        />
                      </div>
                      {fotoLimpia && (
                        <button
                          onClick={() => {
                            const siguiente = !usarOriginal;
                            setUsarOriginal(siguiente);
                            setNueva({
                              ...nueva,
                              imagen: siguiente ? originalFoto : fotoLimpia,
                            });
                          }}
                          className="mt-2 w-full py-1.5 text-[12px] uppercase tracking-[0.16em] text-muted underline underline-offset-4"
                        >
                          {usarOriginal ? tx("fotoUsarLimpia") : tx("fotoUsarOriginal")}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    <input
                      value={nueva.nombre}
                      onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })}
                      className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
                      placeholder="Nombre de la prenda"
                    />
                    <div className="flex gap-2 overflow-x-auto">
                      {CATEGORIAS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setNueva({ ...nueva, categoria: c.id })}
                          className="chip"
                          data-active={nueva.categoria === c.id}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      addPrenda(nueva);
                      setNueva(null);
                      avisar("Prenda guardada");
                    }}
                    className="btn-primary mt-5"
                  >
                    Guardar en mi armario
                  </button>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* Detalle de prenda */}
      {detalle && (
        <div className="overlay fixed inset-0 z-50 flex items-end bg-ink/40" onClick={() => setDetalle(null)}>
          <div className="sheet max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-accentSoft">
              {detalle.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detalle.imagen} alt={detalle.nombre} className="h-full w-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-12 w-12 text-accent" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M16 4l4 3-2 3-2-1v11H8V9L6 10 4 7l4-3a3 3 0 004 0 3 3 0 004 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <BotonCerrar
                onClick={() => setDetalle(null)}
                className="absolute right-3 top-3"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                value={detalle.nombre}
                onChange={(e) => setDetalle({ ...detalle, nombre: e.target.value })}
                className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-4 py-3 font-display text-lg outline-none focus:border-accent"
              />
              <button
                onClick={() => {
                  const fav = !detalle.favorito;
                  setDetalle({ ...detalle, favorito: fav });
                  updatePrenda(detalle.id, { favorito: fav });
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-bg"
                aria-label="Favorita"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill={detalle.favorito ? "var(--accent)" : "none"} stroke="var(--accent)" strokeWidth="1.8">
                  <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.5 4.5 6 4.5c2.2 0 3.7 1.2 6 3.6 2.3-2.4 3.8-3.6 6-3.6 3.5 0 5.5 3.5 4 7.2C19.5 16.3 12 21 12 21z" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDetalle({ ...detalle, categoria: c.id })}
                  className="chip"
                  data-active={detalle.categoria === c.id}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Color y estilo editables. Antes solo se mostraban, así que si
                la IA se equivocaba no había forma de corregirlo — y son justo
                los dos datos con los que Madame Dressé te viste. */}
            <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-muted">
              Color
            </label>
            <input
              value={detalle.color === "—" ? "" : detalle.color}
              onChange={(e) => setDetalle({ ...detalle, color: e.target.value })}
              placeholder="Azul marino, crudo, negro…"
              maxLength={30}
              className="mt-1.5 w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
            />

            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted">
              Estilo
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {ESTILOS.map((e) => (
                <button
                  key={e}
                  onClick={() =>
                    setDetalle({ ...detalle, estilo: detalle.estilo === e ? "—" : e })
                  }
                  className="chip"
                  data-active={detalle.estilo === e}
                >
                  {e}
                </button>
              ))}
            </div>

            {diasSinUsar(detalle) !== null && (
              <p className="mt-3 text-xs text-muted">
                Último uso hace {diasSinUsar(detalle)} días
              </p>
            )}

            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  updatePrenda(detalle.id, {
                    nombre: detalle.nombre,
                    categoria: detalle.categoria,
                    color: detalle.color.trim() || "—",
                    estilo: detalle.estilo,
                  });
                  setDetalle(null);
                  avisar("Cambios guardados");
                }}
                className="btn-primary"
              >
                Guardar cambios
              </button>
              <button
                onClick={() => {
                  updatePrenda(detalle.id, { ultimoUso: new Date().toISOString(), usos: (detalle.usos || 0) + 1 });
                  setDetalle(null);
                  avisar("¡Buen look hoy!");
                }}
                className="w-full rounded-2xl border border-line bg-bg py-3.5 text-sm"
              >
                Me la he puesto hoy
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar “${detalle.nombre}” de tu armario?`)) {
                    removePrenda(detalle.id);
                    setDetalle(null);
                  }
                }}
                className="w-full rounded-2xl border border-line bg-bg py-3.5 text-sm text-muted"
              >
                Eliminar prenda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crear look */}
      {creandoLook && (
        <div className="overlay fixed inset-0 z-50 flex items-end bg-ink/40" onClick={() => setCreandoLook(false)}>
          <div className="sheet max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-surface p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <CabeceraPanel
              titulo="Crear look"
              onCerrar={() => setCreandoLook(false)}
            >
              <p className="mt-1 text-sm text-muted">
                Elige al menos 2 prendas y ponle nombre.
              </p>
            </CabeceraPanel>

            <input
              value={lookNombre}
              onChange={(e) => setLookNombre(e.target.value)}
              placeholder="Nombre del look (ej. Cena del viernes)"
              className="mt-4 w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-accent"
            />

            <div className="mt-4 space-y-2">
              {prendas.map((p) => {
                const sel = lookSel.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      setLookSel(
                        sel ? lookSel.filter((id) => id !== p.id) : [...lookSel, p.id]
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      sel ? "border-accent bg-accentSoft" : "border-line bg-bg"
                    }`}
                  >
                    <span>{p.nombre}</span>
                    {sel && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Un botón apagado sin decir por qué es un callejón sin salida:
                el aviso de arriba ya no se ve después de bajar por la lista de
                prendas. La propia etiqueta dice qué falta. */}
            <button
              onClick={guardarLook}
              disabled={lookSel.length < 2 || !lookNombre.trim()}
              className="btn-primary mt-5"
            >
              {lookSel.length < 2
                ? `Elige ${2 - lookSel.length} ${lookSel.length === 1 ? "prenda más" : "prendas"}`
                : !lookNombre.trim()
                ? "Ponle un nombre al look"
                : `Guardar look (${plural(lookSel.length, "prenda")})`}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast mensaje={toast} />}
      <BottomNav />
    </main>
  );
}

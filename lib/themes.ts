export type ThemeId =
  | "signature"
  | "paris"
  | "milano"
  | "riviera"
  | "tokio"
  | "londres";

export interface Theme {
  id: ThemeId;
  nombre: string;
  descripcion: string;
  premium: boolean;
  swatches: [string, string, string];
  /** Ornamento distintivo del tema, aparece en cabeceras y detalles */
  motif: string;
  /** Frase corta que aparece bajo el título de cada sección */
  tagline: string;
  /** Gradiente para las fotos placeholder de la comunidad */
  tile: string;
}

export const THEMES: Theme[] = [
  {
    id: "signature",
    nombre: "Signature",
    descripcion: "El clásico Dressé. Atemporal.",
    premium: false,
    swatches: ["#faf8f4", "#a8896b", "#1a1714"],
    motif: "✦",
    tagline: "Atemporal, como los básicos bien elegidos",
    tile: "linear-gradient(160deg, #efe7db 0%, #dcCfc0 100%)",
  },
  {
    id: "paris",
    nombre: "Paris",
    descripcion: "Rosa palo y dorado suave.",
    premium: true,
    swatches: ["#fdf9f7", "#cf8f9a", "#3d2e2e"],
    motif: "❀",
    tagline: "Comme il faut, querida",
    tile: "linear-gradient(160deg, #f9ecec 0%, #ecd2d2 100%)",
  },
  {
    id: "milano",
    nombre: "Milano",
    descripcion: "Negro sofisticado, modo noche.",
    premium: true,
    swatches: ["#121212", "#c0c0c8", "#f2f2f0"],
    motif: "◆",
    tagline: "La eleganza non si compra",
    tile: "linear-gradient(160deg, #2a2a2e 0%, #3d3d44 100%)",
  },
  {
    id: "riviera",
    nombre: "Riviera",
    descripcion: "Azul cielo mediterráneo.",
    premium: true,
    swatches: ["#f6fafc", "#3f9fd0", "#1e3442"],
    motif: "⛵",
    tagline: "Brisa, sal y lino blanco",
    tile: "linear-gradient(160deg, #e3f1f8 0%, #c4e0ef 100%)",
  },
  {
    id: "tokio",
    nombre: "Tokio",
    descripcion: "Lila y rosa, la más girly.",
    premium: true,
    swatches: ["#fbf8fe", "#b678e0", "#3a2d4a"],
    motif: "✿",
    tagline: "Kawaii pero con criterio",
    tile: "linear-gradient(160deg, #f5ebfc 0%, #e5cff5 100%)",
  },
  {
    id: "londres",
    nombre: "Londres",
    descripcion: "Verde salvia con carácter.",
    premium: false,
    swatches: ["#f7f8f4", "#7c9a67", "#232920"],
    motif: "❖",
    tagline: "Efortless, con paraguas a juego",
    tile: "linear-gradient(160deg, #eaf0e3 0%, #d3ddc5 100%)",
  },
];

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

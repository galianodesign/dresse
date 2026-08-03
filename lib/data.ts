export type Categoria = "top" | "pantalon" | "calzado" | "accesorio" | "abrigo";

export interface Prenda {
  id: string;
  nombre: string;
  categoria: Categoria;
  color: string;
  estilo: string;
  imagen: string | null;
  /** Fecha ISO de la última vez que el usuario se la puso */
  ultimoUso?: string;
  /** Marcada como favorita por el usuario */
  favorito?: boolean;
  /** Veces que el usuario ha registrado que se la pone */
  usos?: number;
}

/** Prenda guardada en la wishlist para decidir más tarde */
export interface WishItem {
  id: string;
  imagen: string | null;
  nota: string;
  fecha: string;
}

/** Outfit publicado por el propio usuario en su perfil */
export interface PostPropio {
  id: string;
  imagen: string | null;
  titulo: string;
  descripcion: string;
  prendaIds: string[];
  likes: number;
  fecha: string;
}

export interface Look {
  id: string;
  nombre: string;
  prendaIds: string[];
  creado: string;
}

export interface AnalisisGuardado {
  id: string;
  fecha: string;
  compra: boolean;
  resumen: string;
  imagen: string | null;
}

export interface Comentario {
  usuaria: string;
  texto: string;
}

export interface OutfitComunidad {
  id: string;
  usuaria: string;
  titulo: string;
  descripcion: string;
  prendas: string[];
  estilo: string;
  rating: number;
  votos: number;
  likes: number;
  emoji: string;
  alto: number;
  comentarios: Comentario[];
}

export const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: "top", label: "Tops" },
  { id: "pantalon", label: "Pantalones" },
  { id: "calzado", label: "Calzado" },
  { id: "abrigo", label: "Abrigos" },
  { id: "accesorio", label: "Accesorios" },
];

export const ESTILOS = [
  "Minimalista",
  "Colorida",
  "Elegante",
  "Casual",
  "Streetwear",
  "Romántica",
];

const dias = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const PRENDAS_DEMO: Prenda[] = [
  { id: "p1", nombre: "Camiseta blanca básica", categoria: "top", color: "Blanco", estilo: "Minimalista", imagen: null, ultimoUso: dias(2) },
  { id: "p2", nombre: "Blusa de lino beige", categoria: "top", color: "Beige", estilo: "Elegante", imagen: null, ultimoUso: dias(12) },
  { id: "p3", nombre: "Vaqueros rectos", categoria: "pantalon", color: "Azul medio", estilo: "Casual", imagen: null, ultimoUso: dias(1) },
  { id: "p4", nombre: "Pantalón sastre negro", categoria: "pantalon", color: "Negro", estilo: "Elegante", imagen: null, ultimoUso: dias(9) },
  { id: "p5", nombre: "Zapatillas blancas", categoria: "calzado", color: "Blanco", estilo: "Casual", imagen: null, ultimoUso: dias(3) },
  { id: "p6", nombre: "Botines de piel", categoria: "calzado", color: "Marrón", estilo: "Elegante", imagen: null, ultimoUso: dias(41) },
  { id: "p7", nombre: "Blazer camel", categoria: "abrigo", color: "Camel", estilo: "Elegante", imagen: null, ultimoUso: dias(35) },
  { id: "p8", nombre: "Bolso bandolera", categoria: "accesorio", color: "Negro", estilo: "Minimalista", imagen: null, ultimoUso: dias(6) },
];

/** Días desde el último uso, o null si no hay registro */
export function diasSinUsar(p: Prenda): number | null {
  if (!p.ultimoUso) return null;
  return Math.floor((Date.now() - new Date(p.ultimoUso).getTime()) / 86400000);
}

export const OUTFITS_COMUNIDAD: OutfitComunidad[] = [
  {
    id: "o1",
    usuaria: "claudia.st",
    titulo: "Office core de otoño",
    descripcion: "Mi uniforme de oficina cuando quiero parecer que me esfuerzo sin esforzarme. El blazer lo hace todo.",
    prendas: ["Blazer oversize gris", "Camiseta blanca", "Sastre negro", "Mocasines"],
    estilo: "Elegante",
    rating: 4.8,
    votos: 214,
    likes: 892,
    emoji: "🤎",
    alto: 240,
    comentarios: [
      { usuaria: "lu.wardrobe", texto: "El blazer oversize es LA pieza, necesito saber de dónde es" },
      { usuaria: "martina__v", texto: "Guardadísimo para el lunes" },
    ],
  },
  {
    id: "o2",
    usuaria: "martina__v",
    titulo: "Domingo de vermut",
    descripcion: "Vestido de flores + cesta = no falla nunca en terraza.",
    prendas: ["Vestido midi flores", "Sandalias tiras", "Cesta rafia"],
    estilo: "Romántica",
    rating: 4.5,
    votos: 167,
    likes: 543,
    emoji: "🌸",
    alto: 300,
    comentarios: [
      { usuaria: "elenacloset", texto: "La cesta de rafia eleva cualquier look de verano" },
    ],
  },
  {
    id: "o3",
    usuaria: "no.esunlook",
    titulo: "Uni fit sin pensar",
    descripcion: "Para los días de 8am en los que vestirse es un logro.",
    prendas: ["Sudadera crema", "Cargo beige", "Samba blancas"],
    estilo: "Casual",
    rating: 4.2,
    votos: 341,
    likes: 1204,
    emoji: "🥐",
    alto: 200,
    comentarios: [
      { usuaria: "claudia.st", texto: "El monocromo beige siempre parece intencional aunque no lo sea" },
      { usuaria: "no.esunlook", texto: "jajaja exacto, ese es el truco" },
    ],
  },
  {
    id: "o4",
    usuaria: "lu.wardrobe",
    titulo: "Cena en el centro",
    descripcion: "Satén + vaquero: arreglada pero sin parecer que vas de boda.",
    prendas: ["Top satén negro", "Vaquero recto", "Tacón sandalia", "Clutch dorado"],
    estilo: "Elegante",
    rating: 4.9,
    votos: 428,
    likes: 2011,
    emoji: "🖤",
    alto: 280,
    comentarios: [
      { usuaria: "martina__v", texto: "El combo satén y denim es superior y no acepto debate" },
      { usuaria: "tokio.girl", texto: "Necesito ese clutch en mi vida" },
    ],
  },
  {
    id: "o5",
    usuaria: "elenacloset",
    titulo: "Riviera mood",
    descripcion: "Lino, blanco y azul. Mi armario entero quiere ser un agosto en Menorca.",
    prendas: ["Camisa lino azul", "Short blanco", "Alpargatas"],
    estilo: "Casual",
    rating: 4.4,
    votos: 129,
    likes: 476,
    emoji: "⛵",
    alto: 260,
    comentarios: [],
  },
  {
    id: "o6",
    usuaria: "tokio.girl",
    titulo: "Cita en librería",
    descripcion: "Suave, lila y con calcetines por fuera. Sí, a propósito.",
    prendas: ["Cárdigan lila", "Falda plisada", "Mary janes", "Calcetines blancos"],
    estilo: "Romántica",
    rating: 4.6,
    votos: 198,
    likes: 731,
    emoji: "📚",
    alto: 320,
    comentarios: [
      { usuaria: "lu.wardrobe", texto: "Las mary janes con calcetín son un sí eterno" },
    ],
  },
  {
    id: "o7",
    usuaria: "no.esunlook",
    titulo: "Streetwear de estreno",
    descripcion: "Baggy, capa sobre capa y la gorra que me costó tres pagas.",
    prendas: ["Hoodie gris", "Baggy jeans", "Dunks", "Gorra vintage"],
    estilo: "Streetwear",
    rating: 4.3,
    votos: 256,
    likes: 967,
    emoji: "🛹",
    alto: 230,
    comentarios: [
      { usuaria: "claudia.st", texto: "El layering te quedó de 10" },
    ],
  },
  {
    id: "o8",
    usuaria: "claudia.st",
    titulo: "Total black minimal",
    descripcion: "Cuando no sabes qué ponerte: negro entero y actitud.",
    prendas: ["Jersey cuello alto", "Pantalón recto negro", "Botas chelsea"],
    estilo: "Minimalista",
    rating: 4.7,
    votos: 189,
    likes: 823,
    emoji: "⬛",
    alto: 290,
    comentarios: [],
  },
];

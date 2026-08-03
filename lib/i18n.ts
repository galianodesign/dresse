"use client";

/** Diccionario de la interfaz. La app detecta el idioma del móvil al entrar. */
export const TEXTOS = {
  es: {
    armario: "Armario", asesor: "Asesor", comunidad: "Comunidad", perfil: "Perfil",
    miArmario: "Mi armario", buscar: "Buscar…", guardar: "Guardar", publicar: "Publicar",
    seguir: "Seguir", siguiendo: "Siguiendo", solicitar: "Solicitar seguir",
    solicitado: "Solicitado · toca para cancelar", comentarios: "Comentarios",
    compartir: "Compartir este look", seguidores: "seguidores", seguidos: "seguidos",
    posts: "Posts", guardados: "Guardados", looks: "Looks", favoritas: "Favoritas",
    stats: "Estadísticas", editarPerfil: "Editar perfil", publicarOutfit: "+ Publicar outfit",
    ajustes: "Ajustes", nuevoTablero: "Nuevo tablero", crearTablero: "Crear tablero",
    guardarEn: "Guardar en…", cancelar: "Cancelar", cerrarSesion: "Cerrar sesión",

    /* ── Bienvenida (onboarding) ── */
    obSaltar: "Saltar",
    obSiguiente: "Siguiente",
    obAtras: "Atrás",
    obBienvenida: "Bienvenida a",
    obTagline: "Tu boutique personal",
    obTitulo1: "Tu armario, ordenado",
    obTexto1:
      "Haz una foto a cada prenda y Dressé la cataloga sola: nombre, color y estilo. Tu ropa deja de estar solo en el armario para estar también en el móvil.",
    obTitulo2: "Madame Dressé",
    obTexto2:
      "Tu estilista personal. Le enseñas algo que quieres comprarte y te dice con honestidad si encaja con lo que ya tienes. O le preguntas qué ponerte y te propone looks con tu propia ropa.",
    obTitulo3: "Una comunidad con criterio",
    obTexto3:
      "Publica tus looks, guarda los que te inspiren en tableros y sigue a quien te guste cómo viste. Tú decides si tu cuenta es pública o privada.",
    obTitulo4: "Cuéntanos de ti",
    obTexto4:
      "Dos cosas rápidas y entras. Con tu estilo, Madame Dressé afina mucho más sus consejos.",
    obNombre: "¿Cómo te llamas?",
    obNombrePh: "Tu nombre",
    obEstilo: "¿Cómo dirías que vistes?",
    obEstiloAyuda: "Puedes cambiarlo cuando quieras desde tu perfil.",
    obEntrar: "Entrar en Dressé",

    /* ── Guía de primeros pasos ── */
    guiaTitulo: "Primeros pasos",
    guiaPaso1: "Añade tu primera prenda",
    guiaPaso2: "Crea tu primer look",
    guiaPaso3: "Pregunta a Madame Dressé",
    guiaPaso1Ayuda: "Una foto y listo, se cataloga sola.",
    guiaPaso2Ayuda: "Combina dos prendas y ponle nombre.",
    guiaPaso3Ayuda: "Te dice si comprarte algo o qué ponerte hoy.",
    guiaOcultar: "Ocultar guía",
    guiaCompletado: "completado",

    /* ── Cómo hacer la foto de una prenda ── */
    fotoTitulo: "Añadir prenda",
    fotoGuiaTitulo: "Para que quede bien",
    fotoGuia1: "Extiéndela sobre una superficie lisa y de color plano.",
    fotoGuia2: "Luz de ventana, sin flash y sin tu sombra encima.",
    fotoGuia3: "La prenda entera en el encuadre, vista desde arriba.",
    fotoGuiaNota:
      "Dressé le quita el fondo y la centra sola, pero no puede quitar arrugas: eso depende de tu foto.",
    fotoHacer: "Hacer una foto",
    fotoGaleria: "Elegir de la galería",
    fotoLimpiando: "Dejando la foto limpia…",
    fotoVersionLimpia: "Versión limpia",
    fotoVersionOriginal: "Tu foto original",
    fotoUsarOriginal: "Prefiero mi foto original",
    fotoUsarLimpia: "Usar la versión limpia",
  },
  en: {
    armario: "Wardrobe", asesor: "Advisor", comunidad: "Community", perfil: "Profile",
    miArmario: "My wardrobe", buscar: "Search…", guardar: "Save", publicar: "Post",
    seguir: "Follow", siguiendo: "Following", solicitar: "Request to follow",
    solicitado: "Requested · tap to cancel", comentarios: "Comments",
    compartir: "Share this look", seguidores: "followers", seguidos: "following",
    posts: "Posts", guardados: "Saved", looks: "Looks", favoritas: "Favorites",
    stats: "Stats", editarPerfil: "Edit profile", publicarOutfit: "+ Post outfit",
    ajustes: "Settings", nuevoTablero: "New board", crearTablero: "Create board",
    guardarEn: "Save to…", cancelar: "Cancel", cerrarSesion: "Log out",

    /* ── Onboarding ── */
    obSaltar: "Skip",
    obSiguiente: "Next",
    obAtras: "Back",
    obBienvenida: "Welcome to",
    obTagline: "Your personal boutique",
    obTitulo1: "Your wardrobe, organised",
    obTexto1:
      "Snap a photo of each piece and Dressé catalogues it for you: name, colour and style. Your clothes live in your pocket, not just in your closet.",
    obTitulo2: "Madame Dressé",
    obTexto2:
      "Your personal stylist. Show her something you're thinking of buying and she'll tell you honestly whether it works with what you own. Or ask what to wear and she'll build looks from your own clothes.",
    obTitulo3: "A community with taste",
    obTexto3:
      "Post your looks, save the ones that inspire you to boards, and follow the people whose style you love. You choose whether your account is public or private.",
    obTitulo4: "Tell us about you",
    obTexto4:
      "Two quick things and you're in. Knowing your style lets Madame Dressé give far sharper advice.",
    obNombre: "What's your name?",
    obNombrePh: "Your name",
    obEstilo: "How would you describe your style?",
    obEstiloAyuda: "You can change this any time from your profile.",
    obEntrar: "Enter Dressé",

    /* ── First steps guide ── */
    guiaTitulo: "First steps",
    guiaPaso1: "Add your first piece",
    guiaPaso2: "Create your first look",
    guiaPaso3: "Ask Madame Dressé",
    guiaPaso1Ayuda: "One photo and done — it catalogues itself.",
    guiaPaso2Ayuda: "Combine two pieces and give it a name.",
    guiaPaso3Ayuda: "She'll tell you what to buy or what to wear today.",
    guiaOcultar: "Hide guide",
    guiaCompletado: "done",

    /* ── How to photograph a garment ── */
    fotoTitulo: "Add a piece",
    fotoGuiaTitulo: "To get a good result",
    fotoGuia1: "Lay it flat on a smooth, plain-coloured surface.",
    fotoGuia2: "Window light — no flash, and keep your shadow out of it.",
    fotoGuia3: "The whole piece in frame, shot from above.",
    fotoGuiaNota:
      "Dressé removes the background and centres it for you, but it can't iron out creases — that part is down to your photo.",
    fotoHacer: "Take a photo",
    fotoGaleria: "Choose from gallery",
    fotoLimpiando: "Cleaning up your photo…",
    fotoVersionLimpia: "Cleaned up",
    fotoVersionOriginal: "Your original photo",
    fotoUsarOriginal: "I prefer my original photo",
    fotoUsarLimpia: "Use the cleaned-up version",
  },
} as const;

export type ClaveTexto = keyof typeof TEXTOS.es;

export function t(idioma: "es" | "en", clave: ClaveTexto): string {
  return TEXTOS[idioma]?.[clave] ?? TEXTOS.es[clave];
}

/** Los 6 estilos personales, traducidos. El valor guardado siempre es el español. */
export const ESTILOS_I18N: Record<string, { es: string; en: string }> = {
  Minimalista: { es: "Minimalista", en: "Minimalist" },
  Colorida: { es: "Colorida", en: "Colourful" },
  Elegante: { es: "Elegante", en: "Elegant" },
  Casual: { es: "Casual", en: "Casual" },
  Streetwear: { es: "Streetwear", en: "Streetwear" },
  Romántica: { es: "Romántica", en: "Romantic" },
};

/** Devuelve el nombre del estilo en el idioma pedido, sin cambiar el valor guardado. */
export function estiloLabel(idioma: "es" | "en", estilo: string): string {
  return ESTILOS_I18N[estilo]?.[idioma] ?? estilo;
}

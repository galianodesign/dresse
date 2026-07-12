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
  },
} as const;

export type ClaveTexto = keyof typeof TEXTOS.es;

export function t(idioma: "es" | "en", clave: ClaveTexto): string {
  return TEXTOS[idioma]?.[clave] ?? TEXTOS.es[clave];
}

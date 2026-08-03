# Dressé — Tu boutique personal

PWA de armario inteligente: digitaliza tu ropa, comprueba antes de comprar si una prenda combina con lo que ya tienes, y descubre los looks mejor valorados de la comunidad.

## Qué incluye este MVP

- **Onboarding** en 3 pasos (estilo personal + nombre)
- **Mi Armario**: grid por categorías, subida de prendas con la cámara, catalogación automática con IA, límite de 20 prendas en plan gratuito
- **Asesor**: fotografía una prenda que quieres comprar y la IA te dice si combina con tu armario y con qué looks concretos
- **Comunidad**: feed de outfits con rating de estrellas (datos de ejemplo, pendiente de backend)
- **Perfil**: 6 temas visuales (Signature gratuito + Paris, Milano, Riviera, Tokio y Londres en premium), simulación de suscripción
- **PWA**: manifest listo para "añadir a pantalla de inicio"

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # añade tu ANTHROPIC_API_KEY
npm run dev
```

Sin API key la app funciona en **modo demo** (respuestas simuladas del asesor), útil para revisar toda la interfaz sin coste.

## Estado actual de los datos

Todo se guarda en `localStorage` del navegador: perfil, tema y armario. Es suficiente para validar el producto con usuarios reales. La comunidad usa datos de ejemplo.

## Siguientes pasos (por orden)

1. **Supabase**: tablas `perfiles`, `prendas`, `outfits`, `valoraciones` + Storage para las fotos + Auth con email/Google. Sustituye el `localStorage`.
2. **Stripe**: suscripción premium real (4,99 €/mes) que desbloquee temas, armario ilimitado y publicación en comunidad.
3. **Comunidad real**: publicar outfits, rating persistente, destacados de la semana.
4. **Probador virtual**: fase 2, generación de imagen del outfit puesto.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · API de Claude (visión) · PWA

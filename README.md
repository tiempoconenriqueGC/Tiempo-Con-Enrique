# Tiempo Con Enrique

Blog simple de noticias meteorológicas con Next.js, TypeScript, Tailwind CSS y Supabase.

## Requisitos

- Node.js 20.9 o superior
- npm
- Proyecto de Supabase

## Instalación

```bash
npm install
npm run dev
```

La app quedará disponible en `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores públicos de Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

No uses ni guardes la secret key en el frontend. Si alguna secret key se compartió por error, rótala desde el panel de Supabase.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre el SQL Editor y ejecuta `supabase/schema.sql`.
3. Crea un usuario en Authentication.
4. Convierte ese usuario en admin:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-email@example.com';
```

El esquema crea:

- `profiles`: perfiles y roles `reader` / `admin`.
- `articles`: noticias publicadas.
- `article_images`: imágenes asociadas a noticias.
- Bucket público `news-images` con rutas guardadas en base de datos.
- Políticas RLS: lectura pública de noticias publicadas e imágenes; escritura, edición, borrado y Storage solo para admins autenticados.

## Uso

- Lectores: pueden entrar, ver la home y leer noticias.
- Admin: inicia sesión con el botón `Admin`, publica desde el botón flotante, edita noticias existentes, gestiona imágenes y borra noticias con confirmación.

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. Importa el proyecto en Vercel.
3. Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Environment Variables.
4. Despliega.

`.env.local` está protegido en `.gitignore`; no subas claves privadas ni valores reales al repositorio.

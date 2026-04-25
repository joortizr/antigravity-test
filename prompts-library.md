# Prompts Library - CineSwipe 🎬

Esta biblioteca contiene prompts optimizados para el desarrollo y mantenimiento de la aplicación CineSwipe, categorizados y siguiendo la estructura profesional [CTX/OBJ/RES/FMT/VAL].

---

## 🎨 Categoría: UI / UX Design

### 1. Refactorización de Componente a Tailwind
- **[CTX]** Componente SwipeCard.tsx desarrollado con CSS inline.
- **[OBJ]** Migrar todos los estilos inline a clases de Tailwind CSS manteniendo la interactividad.
- **[RES]** Uso de clases dinámicas para estados `isDragging` y gradientes de legibilidad.
- **[FMT]** Código TSX limpio con separación de lógica y maquetación.
- **[VAL]** Verificar que la animación de rotación no se pierda durante el drag.

### 2. Creación de Skeleton Screen
- **[CTX]** El usuario ve una pantalla en blanco mientras se cargan las películas de TMDB.
- **[OBJ]** Diseñar un Skeleton Loader que imite el tamaño y forma de la SwipeCard.
- **[RES]** Uso de `animate-pulse` de Tailwind y gradientes grises.
- **[FMT]** Componente funcional `SwipeSkeleton.tsx`.
- **[VAL]** Asegurar que el Skeleton ocupe el mismo espacio exacto para evitar CLS (Layout Shift).

---

## ⚙️ Categoría: Backend & Persistence

### 3. Integración de Supabase
- **[CTX]** Persistencia local actual en localStorage.
- **[OBJ]** Refactorizar el MovieContext para insertar interacciones en la tabla `movie_interactions` de Supabase.
- **[RES]** Uso de `@supabase/supabase-js`, manejo asíncrono y optimistic UI.
- **[FMT]** Métodos asíncronos en el contexto con manejo de errores try/catch.
- **[VAL]** Validar que si la red falla, el estado local se revierta o informe al usuario.

### 4. Optimización de Query de Películas
- **[CTX]** Solicitudes a /discover de TMDB trayendo datos innecesarios.
- **[OBJ]** Filtrar los campos del payload para que solo lleguen title, poster_path, release_date y vote_average.
- **[RES]** Reducción de tamaño de respuesta JSON en un 40%.
- **[FMT]** Actualización de TMDBMovie interface y mapeo de fetch.
- **[VAL]** Probar con datos reales de la API v3.

---

## 🧪 Categoría: Testing

### 5. Unit Test para Hook useMovies
- **[CTX]** Lógica compleja de paginación y caché en useMovies.ts.
- **[OBJ]** Crear test unitario con Vitest que simule una respuesta de red exitosa.
- **[RES]** Mock de la función `fetch` global y verificación de estado `movies`.
- **[FMT]** Archivo `useMovies.test.ts` con suites de `it` descriptivas.
- **[VAL]** Confirmar que el estado `loading` cambie correctamente de true a false.

### 6. Test de Integración con Supabase
- **[CTX]** Función swipe(direction) guarda datos en remoto.
- **[OBJ]** Verificar que el cliente de Supabase sea llamado con los parámetros correctos.
- **[RES]** Uso de `vi.spyOn` sobre el objeto supabase.
- **[FMT]** Test de integración en Vitest.
- **[VAL]** El test debe fallar si el `movie_id` enviado es nulo.

---

## 🛠️ Categoría: Refactor & Clean Code

### 7. Separación de Concerns en el Hook Principal
- **[CTX]** El hook useMovies tiene más de 150 líneas manejando fetch, caché y estado.
- **[OBJ]** Dividir el hook en sub-hooks: useTmdbCache y useTmdbFetch.
- **[RES]** Mayor legibilidad y reusabilidad de la lógica de caché.
- **[FMT]** Archivo `useMovies.v2.ts` con export principal.
- **[VAL]** El componente Discovery.tsx no debe percibir cambios en la firma de uso del hook.

### 8. Optimización de Rendimiento con Memoización
- **[CTX]** SwipeCard se re-renderiza con cada movimiento de ratón.
- **[OBJ]** Implementar memoización para evitar re-calculos pesados.
- **[RES]** Uso de `React.memo`, `useCallback` en handlers de puntero y `useMemo` para estilos.
- **[FMT]** Componente final `SwipeCard.optimized.tsx`.
- **[VAL]** Usar React DevTools Profiler para confirmar la reducción de re-renders.

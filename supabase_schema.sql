-- Función para limpiar registros si lo necesitas
-- DROP TABLE IF EXISTS public.movie_interactions;

-- 1. Crear tipo de enumeración para las interacciones (Opcional, pero recomendado para mantener la integridad)
CREATE TYPE interaction_type AS ENUM ('like', 'dislike');

-- 2. Creación de la tabla principal de historial/swipes
CREATE TABLE public.movie_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Vinculado a Supabase Auth genérico
    movie_id INT NOT NULL, -- El id numérico de TMDB de la película
    movie_title TEXT NOT NULL,
    movie_year INT,
    movie_rating NUMERIC(3,1), -- Ejemplo: 8.5
    poster_path TEXT, -- El raw path, ejemplo: '/1pdfLvkbY9ohJlCjQH2JGjjc91p.jpg'
    interaction interaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices de rendimiento
-- Crear índices para buscar eficientemente el historial de un usuario, o qué películas tienen más "likes"
CREATE INDEX idx_interactions_user_id ON public.movie_interactions(user_id);
CREATE INDEX idx_interactions_movie_id ON public.movie_interactions(movie_id);

-- 4. Polizas de Seguridad RLS (Row Level Security) 
-- ¡Importante habilitarlo para proteger desde el frontend!

ALTER TABLE public.movie_interactions ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden "LEER" sus propios likes y dislikes
CREATE POLICY "Users can view their own interactions" 
ON public.movie_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Los usuarios solo pueden "INSERTAR" likes o dislikes en su nombre
CREATE POLICY "Users can insert their own interactions" 
ON public.movie_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- (Opcional) Si quieres permitir que alguien revoque su "Like/Dislike"
CREATE POLICY "Users can delete their own interactions" 
ON public.movie_interactions 
FOR DELETE 
USING (auth.uid() = user_id);

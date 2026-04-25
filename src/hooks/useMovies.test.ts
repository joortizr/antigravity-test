import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMovies } from './useMovies.v2';

// Mock global de fetch
global.fetch = vi.fn();

describe('useMovies Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('debe iniciar con estado de carga true y luego false al recibir datos', async () => {
    const mockMovies = {
      page: 1,
      results: [{ id: 1, title: 'Test Movie' }],
      total_pages: 1
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMovies),
    });

    // Mock de las variables de entorno de Vite
    vi.stubEnv('VITE_TMDB_KEY', 'fake_key');

    const { result } = renderHook(() => useMovies());

    // Esperar a que la carga termine
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.movies).toHaveLength(1);
    expect(result.current.movies[0].title).toBe('Test Movie');
  });
});

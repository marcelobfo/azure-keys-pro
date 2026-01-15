import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Fallback client-side para /share/:identifier.
 * 
 * Em produção (Vercel), /share/:slug é reescrito para a Edge Function (og-meta) para OG tags.
 * Mas em alguns ambientes (preview, caches, etc.) a SPA pode receber /share direto.
 * Aqui nós só redirecionamos para a rota real do imóvel.
 */
export default function ShareRedirect() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!identifier) {
      navigate('/', { replace: true });
      return;
    }

    navigate(`/imovel/${identifier}`, { replace: true });
  }, [identifier, navigate]);

  return null;
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expected targets for domain validation
const EXPECTED_CNAME_TARGETS = ['techmoveis.com.br', 'cname.vercel-dns.com'];
// Common Vercel/Lovable IPs (may change, CNAME is preferred)
const EXPECTED_IPS = ['76.76.21.21', '76.76.21.98'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return new Response(JSON.stringify({ 
        error: 'Domínio é obrigatório',
        status: 'invalid'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean domain (remove https://, www., trailing slashes)
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '')
      .trim();

    console.log(`[DNS Check] Verifying domain: ${cleanDomain}`);

    // Query DNS via Cloudflare DNS-over-HTTPS for A records
    const aRecordPromise = fetch(
      `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`,
      { headers: { 'Accept': 'application/dns-json' } }
    );

    // Query CNAME records
    const cnameRecordPromise = fetch(
      `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=CNAME`,
      { headers: { 'Accept': 'application/dns-json' } }
    );

    const [aResponse, cnameResponse] = await Promise.all([aRecordPromise, cnameRecordPromise]);
    const [aData, cnameData] = await Promise.all([aResponse.json(), cnameResponse.json()]);

    let status: 'valid' | 'invalid' | 'pending' = 'invalid';
    let details = '';
    const records: Array<{ type: string; value: string }> = [];

    // Check A records
    if (aData.Answer && aData.Answer.length > 0) {
      aData.Answer.forEach((r: { type: number; data: string }) => {
        if (r.type === 1) { // A record type
          records.push({ type: 'A', value: r.data });
        }
      });
      
      const hasValidIP = aData.Answer.some((r: { data: string }) => 
        EXPECTED_IPS.includes(r.data)
      );
      
      if (hasValidIP) {
        status = 'valid';
        details = 'Registro A configurado corretamente para a plataforma.';
      }
    }

    // Check CNAME records
    if (cnameData.Answer && cnameData.Answer.length > 0) {
      cnameData.Answer.forEach((r: { type: number; data: string }) => {
        if (r.type === 5) { // CNAME record type
          // Remove trailing dot from DNS response
          const cnameValue = r.data.replace(/\.$/, '');
          records.push({ type: 'CNAME', value: cnameValue });
        }
      });
      
      if (status !== 'valid') {
        const hasValidCname = cnameData.Answer.some((r: { data: string }) => {
          const cnameValue = r.data.replace(/\.$/, '').toLowerCase();
          return EXPECTED_CNAME_TARGETS.some(target => cnameValue.includes(target));
        });
        
        if (hasValidCname) {
          status = 'valid';
          details = 'CNAME configurado corretamente para a plataforma.';
        }
      }
    }

    // Determine final status and message
    if (status === 'invalid') {
      if (records.length === 0) {
        status = 'pending';
        details = 'Nenhum registro DNS encontrado. Configure o DNS ou aguarde a propagação (pode levar até 48h).';
      } else {
        details = `DNS não aponta para a plataforma. Configure um CNAME apontando para techmoveis.com.br`;
      }
    }

    console.log(`[DNS Check] Result for ${cleanDomain}: ${status} - ${details}`);
    console.log(`[DNS Check] Records found:`, records);

    return new Response(JSON.stringify({
      domain: cleanDomain,
      status,
      details,
      records,
      expectedTargets: {
        cname: EXPECTED_CNAME_TARGETS,
        ips: EXPECTED_IPS,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[DNS Check] Error:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      status: 'invalid',
      details: 'Erro ao verificar DNS. Tente novamente.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

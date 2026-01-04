import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useTheme } from '@/contexts/ThemeContext';

export interface BrandColors {
  primaryColor: string;
  primaryColorDark: string;
  accentColor: string;
  accentColorDark: string;
  successColor: string;
  gradientEnabled: boolean;
}

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primaryColor: '#0088CC',
  primaryColorDark: '#38BDF8',
  accentColor: '#F58700',
  accentColorDark: '#FB923C',
  successColor: '#10B981',
  gradientEnabled: true,
};

// Presets de cores disponíveis
export const COLOR_PRESETS = {
  ocean: {
    name: 'Azul Oceano',
    primaryColor: '#0088CC',
    primaryColorDark: '#38BDF8',
    accentColor: '#F58700',
    accentColorDark: '#FB923C',
  },
  emerald: {
    name: 'Verde Esmeralda',
    primaryColor: '#10B981',
    primaryColorDark: '#34D399',
    accentColor: '#F59E0B',
    accentColorDark: '#FBBF24',
  },
  purple: {
    name: 'Roxo Elegante',
    primaryColor: '#8B5CF6',
    primaryColorDark: '#A78BFA',
    accentColor: '#EC4899',
    accentColorDark: '#F472B6',
  },
  red: {
    name: 'Vermelho Vivo',
    primaryColor: '#EF4444',
    primaryColorDark: '#F87171',
    accentColor: '#F97316',
    accentColorDark: '#FB923C',
  },
  blue: {
    name: 'Azul Corporativo',
    primaryColor: '#3B82F6',
    primaryColorDark: '#60A5FA',
    accentColor: '#06B6D4',
    accentColorDark: '#22D3EE',
  },
};

// Função para converter HEX para HSL
export const hexToHSL = (hex: string): string => {
  // Remove # se existir
  hex = hex.replace('#', '');
  
  // Validar hex
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return '200 100% 40%'; // Fallback para azul
  }
  
  // Converter para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const useBrandColors = () => {
  const { selectedTenantId, currentTenant } = useTenant();
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<BrandColors>(DEFAULT_BRAND_COLORS);
  const [loading, setLoading] = useState(true);
  
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;

  const applyColors = useCallback((brandColors: BrandColors) => {
    const root = document.documentElement;
    const isDark = resolvedTheme === 'dark';
    
    // Aplicar cor primária
    const primaryHex = isDark ? brandColors.primaryColorDark : brandColors.primaryColor;
    const primaryHSL = hexToHSL(primaryHex);
    root.style.setProperty('--primary', primaryHSL);
    root.style.setProperty('--ring', primaryHSL);
    root.style.setProperty('--sidebar-primary', primaryHSL);
    
    // Aplicar cor de destaque/accent
    const accentHex = isDark ? brandColors.accentColorDark : brandColors.accentColor;
    const accentHSL = hexToHSL(accentHex);
    root.style.setProperty('--accent', accentHSL);
    
    // Aplicar cor de sucesso
    const successHSL = hexToHSL(brandColors.successColor);
    root.style.setProperty('--success', successHSL);
    
    // Atualizar meta theme-color para mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0B1120' : primaryHex);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const fetchColors = async () => {
      setLoading(true);
      
      const colorKeys = [
        'brand_primary_color',
        'brand_primary_dark',
        'brand_accent_color',
        'brand_accent_dark',
        'brand_success_color',
        'brand_gradient_enabled',
      ];
      
      let query = supabase
        .from('site_settings')
        .select('key, value')
        .in('key', colorKeys);
      
      if (effectiveTenantId) {
        query = query.eq('tenant_id', effectiveTenantId);
      } else {
        query = query.is('tenant_id', null);
      }
      
      const { data } = await query;
      
      const colorMap: Record<string, string> = {};
      data?.forEach(item => {
        colorMap[item.key] = item.value || '';
      });
      
      const brandColors: BrandColors = {
        primaryColor: colorMap.brand_primary_color || DEFAULT_BRAND_COLORS.primaryColor,
        primaryColorDark: colorMap.brand_primary_dark || DEFAULT_BRAND_COLORS.primaryColorDark,
        accentColor: colorMap.brand_accent_color || DEFAULT_BRAND_COLORS.accentColor,
        accentColorDark: colorMap.brand_accent_dark || DEFAULT_BRAND_COLORS.accentColorDark,
        successColor: colorMap.brand_success_color || DEFAULT_BRAND_COLORS.successColor,
        gradientEnabled: colorMap.brand_gradient_enabled !== 'false',
      };
      
      setColors(brandColors);
      applyColors(brandColors);
      setLoading(false);
    };
    
    fetchColors();
  }, [effectiveTenantId, applyColors]);

  // Reaplicar cores quando o tema muda
  useEffect(() => {
    applyColors(colors);
  }, [resolvedTheme, colors, applyColors]);

  return { colors, loading, applyColors };
};

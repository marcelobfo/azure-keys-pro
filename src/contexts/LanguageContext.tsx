
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.properties': 'Imóveis',
    'nav.contact': 'Contato',
    'nav.login': 'Entrar',
    'nav.logout': 'Sair',
    'nav.dashboard': 'Painel',
    
    // Home
    'home.hero.title': 'Encontre o Imóvel dos Seus Sonhos',
    'home.hero.subtitle': 'Descubra as melhores oportunidades do mercado imobiliário',
    'home.search.placeholder': 'Digite o que procura...',
    'home.search.button': 'Buscar',
    'home.features.title': 'Destaques',
    'home.about.title': 'Quem Somos',
    'home.about.text': 'Somos uma imobiliária moderna e confiável, comprometida em conectar pessoas aos seus lares ideais.',
    
    // Properties
    'properties.title': 'Nossos Imóveis',
    'properties.subtitle': 'Encontre o imóvel perfeito para você',
    'properties.rent': 'Imóveis para Alugar',
    'properties.sale': 'Imóveis para Comprar',
    'properties.filter.type': 'Tipo',
    'properties.filter.city': 'Cidade',
    'properties.filter.price': 'Preço',
    'properties.filter.area': 'Área',
    'properties.filter.advanced': 'Filtros Avançados',
    'properties.contact': 'Entrar em Contato',
    'properties.noResults': 'Nenhum imóvel encontrado com os filtros selecionados.',
    'properties.clearFilters': 'Limpar Filtros',
    'properties.loadMore': 'Carregar Mais Imóveis',
    'properties.filters': 'Filtros',
    'properties.found': 'Encontrados',
    'properties.properties': 'imóveis',
    
    // Contact
    'contact.title': 'Entre em Contato',
    'contact.name': 'Nome',
    'contact.email': 'E-mail',
    'contact.phone': 'Telefone',
    'contact.message': 'Mensagem',
    'contact.send': 'Enviar',
    
    // Auth
    'auth.login': 'Entrar',
    'auth.email': 'E-mail',
    'auth.password': 'Senha',
    'auth.forgot': 'Esqueci minha senha',
    'auth.register': 'Cadastrar-se',
    
    // Dashboard
    'dashboard.properties': 'Meus Imóveis',
    'dashboard.leads': 'Leads',
    'dashboard.settings': 'Configurações',
    'dashboard.admin': 'Administração',
    
    // Common
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.properties': 'Properties',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    
    // Home
    'home.hero.title': 'Find Your Dream Property',
    'home.hero.subtitle': 'Discover the best opportunities in the real estate market',
    'home.search.placeholder': 'Type what you are looking for...',
    'home.search.button': 'Search',
    'home.features.title': 'Featured',
    'home.about.title': 'About Us',
    'home.about.text': 'We are a modern and reliable real estate agency, committed to connecting people to their ideal homes.',
    
    // Properties
    'properties.title': 'Our Properties',
    'properties.subtitle': 'Find your perfect property',
    'properties.rent': 'Properties for Rent',
    'properties.sale': 'Properties for Sale',
    'properties.filter.type': 'Type',
    'properties.filter.city': 'City',
    'properties.filter.price': 'Price',
    'properties.filter.area': 'Area',
    'properties.filter.advanced': 'Advanced Filters',
    'properties.contact': 'Contact',
    'properties.noResults': 'No properties found with the selected filters.',
    'properties.clearFilters': 'Clear Filters',
    'properties.loadMore': 'Load More Properties',
    'properties.filters': 'Filters',
    'properties.found': 'Found',
    'properties.properties': 'properties',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.message': 'Message',
    'contact.send': 'Send',
    
    // Auth
    'auth.login': 'Login',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgot': 'Forgot password',
    'auth.register': 'Register',
    
    // Dashboard
    'dashboard.properties': 'My Properties',
    'dashboard.leads': 'Leads',
    'dashboard.settings': 'Settings',
    'dashboard.admin': 'Administration',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.properties': 'Propiedades',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar Sesión',
    'nav.logout': 'Cerrar Sesión',
    'nav.dashboard': 'Panel',
    
    // Home
    'home.hero.title': 'Encuentra la Propiedad de Tus Sueños',
    'home.hero.subtitle': 'Descubre las mejores oportunidades del mercado inmobiliario',
    'home.search.placeholder': 'Escribe lo que buscas...',
    'home.search.button': 'Buscar',
    'home.features.title': 'Destacados',
    'home.about.title': 'Quiénes Somos',
    'home.about.text': 'Somos una inmobiliaria moderna y confiable, comprometida en conectar personas con sus hogares ideales.',
    
    // Properties
    'properties.title': 'Nuestras Propiedades',
    'properties.subtitle': 'Encuentra tu propiedad perfecta',
    'properties.rent': 'Propiedades en Alquiler',
    'properties.sale': 'Propiedades en Venta',
    'properties.filter.type': 'Tipo',
    'properties.filter.city': 'Ciudad',
    'properties.filter.price': 'Precio',
    'properties.filter.area': 'Área',
    'properties.filter.advanced': 'Filtros Avanzados',
    'properties.filters': 'Filtros',
    'properties.found': 'Encontradas',
    'properties.properties': 'propiedades',
    'properties.contact': 'Contactar',
    'properties.noResults': 'No se encontraron propiedades con los filtros seleccionados.',
    'properties.clearFilters': 'Limpiar Filtros',
    'properties.loadMore': 'Cargar Más Propiedades',
    
    // Contact
    'contact.title': 'Contáctanos',
    'contact.name': 'Nombre',
    'contact.email': 'Correo',
    'contact.phone': 'Teléfono',
    'contact.message': 'Mensaje',
    'contact.send': 'Enviar',
    
    // Auth
    'auth.login': 'Iniciar Sesión',
    'auth.email': 'Correo',
    'auth.password': 'Contraseña',
    'auth.forgot': 'Olvidé mi contraseña',
    'auth.register': 'Registrarse',
    
    // Dashboard
    'dashboard.properties': 'Mis Propiedades',
    'dashboard.leads': 'Leads',
    'dashboard.settings': 'Configuración',
    'dashboard.admin': 'Administración',
    
    // Common
    'common.loading': 'Cargando...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['pt']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

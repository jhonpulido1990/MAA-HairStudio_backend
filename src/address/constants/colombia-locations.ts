export const COLOMBIA_DEPARTMENTS = [
  'Amazonas',
  'Antioquia', 
  'Arauca',
  'Atlántico',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada'
] as const;

export const MAJOR_CITIES = {
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta'],
  'Cundinamarca': ['Bogotá', 'Soacha', 'Zipaquirá', 'Chía', 'Facatativá'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
  'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona'],
  // Agregar más según necesidades
} as const;

export const POSTAL_CODE_PATTERNS = {
  'Bogotá': /^11\d{4}$/,
  'Medellín': /^05\d{4}$/,
  'Cali': /^76\d{4}$/,
  'Barranquilla': /^08\d{4}$/,
  'Cartagena': /^13\d{4}$/,
  'Bucaramanga': /^68\d{4}$/,
  // Patrones básicos por ciudad principal
} as const;

export type ColombiaDepartment = typeof COLOMBIA_DEPARTMENTS[number];
export type ColombiaCity = typeof MAJOR_CITIES[keyof typeof MAJOR_CITIES][number];
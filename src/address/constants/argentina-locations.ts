export const ARGENTINA_PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
] as const;

export const MAJOR_CITIES = {
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría'],
  'Ciudad Autónoma de Buenos Aires': ['Buenos Aires'],
  'Córdoba': ['Córdoba', 'Río Cuarto', 'Villa Carlos Paz', 'San Francisco'],
  'Santa Fe': ['Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto'],
  'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Maipú'],
  'Tucumán': ['San Miguel de Tucumán', 'Yerba Buena', 'Banda del Río Salí'],
  'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú', 'Uruguay'],
  'Salta': ['Salta', 'San Ramón de la Nueva Orán', 'Tartagal'],
  'Misiones': ['Posadas', 'Puerto Iguazú', 'Oberá', 'Eldorado'],
  'Chaco': ['Resistencia', 'Barranqueras', 'Fontana', 'Puerto Vilelas'],
  // Agregar más según necesidades
} as const;

export const POSTAL_CODE_PATTERNS = {
  // Argentina usa formato de 4 dígitos (NNNN) o nuevo formato (ANNNNAAA)
  'Buenos Aires': /^[B]\d{4}[A-Z]{3}$|^\d{4}$/,
  'Ciudad Autónoma de Buenos Aires': /^[C]\d{4}[A-Z]{3}$|^[C]?\d{4}$/,
  'Córdoba': /^[X]\d{4}[A-Z]{3}$|^[5]\d{3}$/,
  'Santa Fe': /^[S]\d{4}[A-Z]{3}$|^[2-3]\d{3}$/,
  'Mendoza': /^[M]\d{4}[A-Z]{3}$|^[5]\d{3}$/,
  // Patrón general para el resto
  'general': /^[A-Z]?\d{4}[A-Z]{0,3}$/
} as const;

export type ArgentinaProvince = typeof ARGENTINA_PROVINCES[number];
export type ArgentinaCity = typeof MAJOR_CITIES[keyof typeof MAJOR_CITIES][number];
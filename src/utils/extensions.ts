import { AddInExtension } from '../types/document';

export const AVAILABLE_EXTENSIONS: AddInExtension[] = [
  {
    id: 'ai-copilot',
    name: 'Asistente de Redacción IA & Copilot',
    iconName: 'Sparkles',
    category: 'Productividad & IA',
    description: 'Mejora redacción, parafrasea párrafos, resume textos extensos y corrige gramática automáticamente.',
    installed: true,
    version: '2.4.0',
    author: 'Word Studio Labs'
  },
  {
    id: 'apa-citations',
    name: 'Gestor de Citas APA 7ª / MLA / IEEE',
    iconName: 'BookOpen',
    category: 'Académico',
    description: 'Genera citas normalizadas y bibliografías completas a partir de libros, artículos o enlaces DOI.',
    installed: true,
    version: '3.1.2',
    author: 'Academic Tools'
  },
  {
    id: 'text-to-speech',
    name: 'Narrador de Voz (Text-to-Speech)',
    iconName: 'Volume2',
    category: 'Accesibilidad',
    description: 'Lee en voz alta el contenido del documento o el texto seleccionado para revisión auditiva.',
    installed: true,
    version: '1.8.0',
    author: 'AudioDoc Speech'
  },
  {
    id: 'math-equations',
    name: 'Editor de Ecuaciones & Fórmulas',
    iconName: 'Binary',
    category: 'Ciencia & Matemáticas',
    description: 'Inserta fórmulas matemáticas complejas, integrales, matrices y símbolos científicos.',
    installed: true,
    version: '2.0.1',
    author: 'FormulaTeX'
  },
  {
    id: 'signature-pad',
    name: 'Firma Digital y Sello Corporativo',
    iconName: 'PenTool',
    category: 'Legal & Contratos',
    description: 'Dibuja o genera firmas digitales vectoriales con sello temporal de verificación.',
    installed: true,
    version: '1.5.0',
    author: 'SignSafe Office'
  },
  {
    id: 'qr-generator',
    name: 'Incrustador de Códigos QR',
    iconName: 'QrCode',
    category: 'Multimedia',
    description: 'Inserta códigos QR enlazados a sitios web, vCards, repositorios o documentos externos.',
    installed: true,
    version: '2.2.0',
    author: 'QuickLink Pro'
  },
  {
    id: 'watermark-designer',
    name: 'Marcas de Agua & Sellos de Seguridad',
    iconName: 'ShieldAlert',
    category: 'Seguridad',
    description: 'Añade marcas de agua diagonales (CONFIDENCIAL, BORRADOR, COPIA, PERSONALIZADA).',
    installed: true,
    version: '1.2.0',
    author: 'DocSecurity'
  },
  {
    id: 'table-designer',
    name: 'Generador de Matrices y Tablas Pro',
    iconName: 'Table',
    category: 'Diseño',
    description: 'Crea tablas estilizadas para presupuestos, cronogramas, matrices FODA y comparativas.',
    installed: true,
    version: '2.5.0',
    author: 'Office Tables'
  }
];

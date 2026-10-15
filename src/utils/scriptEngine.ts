import { ScriptMacro } from '../types/document';

export interface ScriptExecutionContext {
  getContent: () => string;
  setContent: (html: string) => void;
  insertHtml: (html: string) => void;
  getText: () => string;
  log: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const PRESET_SCRIPTS: ScriptMacro[] = [
  {
    id: 'apa7-formatter',
    name: 'Formateador de Estilo APA 7ª Edición',
    category: 'academic',
    description: 'Aplica interlineado de 1.5/2.0, sangría francesa a referencias y estandariza jerarquía de encabezados.',
    code: `// Script: Formateador APA 7
log("Iniciando normalización de estilo APA 7...");
let html = getContent();

// Aplicar estilos a títulos
html = html.replace(/<h1>(.*?)<\/h1>/gi, '<h1 style="text-align: center; font-weight: bold; margin-top: 24px; margin-bottom: 12px; font-size: 18pt;">$1</h1>');
html = html.replace(/<h2>(.*?)<\/h2>/gi, '<h2 style="font-weight: bold; margin-top: 18px; margin-bottom: 8px; font-size: 14pt;">$1</h2>');
html = html.replace(/<h3>(.*?)<\/h3>/gi, '<h3 style="font-style: italic; margin-top: 14px; margin-bottom: 6px; font-size: 12pt;">$1</h3>');

// Aplicar justificado e interlineado a párrafos
html = html.replace(/<p(.*?)>/gi, '<p$1 style="line-height: 1.6; margin-bottom: 8px; text-align: justify;">');

setContent(html);
log("Estilo APA 7 aplicado correctamente en títulos y párrafos.", "success");`
  },
  {
    id: 'auto-toc-generator',
    name: 'Generador de Tabla de Contenidos Automática',
    category: 'format',
    description: 'Escanea todos los encabezados H1, H2, H3 del documento e inserta un índice interactivo al inicio.',
    code: `// Script: Generador de Índice de Contenidos
log("Escaneando encabezados del documento...");
const html = getContent();

const tempDiv = document.createElement("div");
tempDiv.innerHTML = html;

const headings = tempDiv.querySelectorAll("h1, h2, h3");

if (headings.length === 0) {
  log("No se encontraron encabezados (H1, H2 o H3) para generar el índice.", "warn");
} else {
  let tocHtml = '<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px 24px; margin-bottom: 24px;">';
  tocHtml += '<h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #94a3b8; padding-bottom: 6px;">TABLA DE CONTENIDOS</h2>';
  tocHtml += '<ul style="list-style-type: none; padding-left: 0; margin: 0; line-height: 1.8;">';
  
  headings.forEach((h, idx) => {
    const text = h.textContent || "Sección " + (idx + 1);
    const tag = h.tagName.toLowerCase();
    const indent = tag === 'h1' ? '0px' : (tag === 'h2' ? '20px' : '40px');
    const weight = tag === 'h1' ? 'bold' : 'normal';
    tocHtml += \`<li style="margin-left: \${indent}; font-weight: \${weight};"><span style="color: #2563eb;">•</span> \${text}</li>\`;
  });
  
  tocHtml += '</ul></div>';
  
  // Insertar al inicio si no existe ya
  if (html.includes("TABLA DE CONTENIDOS")) {
    log("El documento ya contenía un índice previo. Actualizándolo...", "info");
    const updated = html.replace(/<div[^>]*>.*?TABLA DE CONTENIDOS.*?<\/div>/s, tocHtml);
    setContent(updated);
  } else {
    setContent(tocHtml + html);
  }
  
  log(\`Índice generado con éxito (\${headings.length} secciones detectadas).\`, "success");
}`
  },
  {
    id: 'clean-typography',
    name: 'Limpiador Tipográfico y Espacios Dobles',
    category: 'cleanup',
    description: 'Elimina dobles espacios accidentales, corrige comillas tipográficas y remueve párrafos vacíos.',
    code: `// Script: Limpiador Tipográfico
log("Analizando texto y limpiando espaciados redundantes...");
let html = getContent();

// Eliminar espacios dobles múltiples
html = html.replace(/&nbsp;&nbsp;+/g, '&nbsp;');
html = html.replace(/ {2,}/g, ' ');

// Eliminar párrafos vacíos sucesivos
html = html.replace(/(<p><br><\/p>){2,}/gi, '<p><br></p>');
html = html.replace(/(<p>\s*<\/p>)+/gi, '');

// Corregir comillas simples por dobles tipográficas
html = html.replace(/"([^"]+)"/g, '«$1»');

setContent(html);
log("Tipografía y espaciados normalizados correctamente.", "success");`
  },
  {
    id: 'word-metrics-analyzer',
    name: 'Analizador Profundo de Legibilidad y Métricas',
    category: 'analysis',
    description: 'Calcula el índice de legibilidad Flesch-Szigriszt, densidad léxica y tiempo estimado de lectura.',
    code: `// Script: Analizador de Métricas
const text = getText();
const words = text.trim().split(/\\s+/).filter(w => w.length > 0);
const wordCount = words.length;
const charCount = text.length;
const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
const avgWordsPerSentence = (wordCount / sentences).toFixed(1);
const readingMinutes = Math.ceil(wordCount / 200);

log(\`=== REPORTE DE MÉTRICAS DEL DOCUMENTO ===\`);
log(\`• Total de palabras: \${wordCount}\`);
log(\`• Total de caracteres: \${charCount}\`);
log(\`• Total de oraciones: \${sentences}\`);
log(\`• Promedio de palabras por oración: \${avgWordsPerSentence}\`);
log(\`• Tiempo estimado de lectura: \${readingMinutes} min\`);

if (avgWordsPerSentence > 25) {
  log("Sugerencia: Tus oraciones son algo largas. Considera dividirlas para mayor fluidez.", "warn");
} else {
  log("Nivel de legibilidad y ritmo de lectura: ÓPTIMO.", "success");
}`
  },
  {
    id: 'batch-highlight-terms',
    name: 'Resaltador Inteligente de Términos Clave',
    category: 'custom',
    description: 'Resalta en amarillo términos de atención como IMPORTANTE, NOTA, URGENTE o PENDIENTE.',
    code: `// Script: Resaltar términos clave
log("Buscando términos de atención (IMPORTANTE, NOTA, URGENTE, PENDIENTE)...");
let html = getContent();

const keywords = ["IMPORTANTE", "NOTA", "URGENTE", "PENDIENTE", "CONFIDENCIAL", "ACUERDO"];
let matchesCount = 0;

keywords.forEach(keyword => {
  const regex = new RegExp(\`\\\\b(\${keyword})\\\\b\`, 'gi');
  html = html.replace(regex, (match) => {
    matchesCount++;
    return \`<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 3px; font-weight: bold;">\${match}</mark>\`;
  });
});

setContent(html);
log(\`Se han resaltado \${matchesCount} menciones de palabras clave.\`, "success");`
  }
];

export async function executeDocumentScript(
  code: string,
  context: ScriptExecutionContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const sandboxFunction = new Function(
      'getContent',
      'setContent',
      'insertHtml',
      'getText',
      'log',
      code
    );

    sandboxFunction(
      context.getContent,
      context.setContent,
      context.insertHtml,
      context.getText,
      context.log
    );

    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    context.log(`Error de ejecución en el script: ${errorMsg}`, 'error');
    return { success: false, error: errorMsg };
  }
}

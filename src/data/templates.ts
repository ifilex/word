export interface DocTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnailColor: string;
  content: string;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

export const DOCUMENT_TEMPLATES: DocTemplate[] = [
  {
    id: 'blank',
    name: 'Documento en blanco',
    category: 'Básico',
    description: 'Empieza desde cero con una hoja totalmente en blanco y limpia.',
    thumbnailColor: 'bg-blue-600',
    pageSize: 'A4',
    orientation: 'portrait',
    content: ''
  },
  {
    id: 'executive-report',
    name: 'Informe Ejecutivo Anual',
    category: 'Empresarial',
    description: 'Estructura corporativa con resumen ejecutivo, tablas de métricas y conclusiones.',
    thumbnailColor: 'bg-indigo-600',
    pageSize: 'A4',
    orientation: 'portrait',
    content: `
      <h1 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px;">INFORME DE GESTIÓN Y DESEMPEÑO ESTRATÉGICO</h1>
      <p><strong>Fecha de emisión:</strong> Octubre 2026 | <strong>Preparado por:</strong> Dirección de Operaciones | <strong>Confidencialidad:</strong> Uso Interno</p>
      
      <h2>1. Resumen Ejecutivo</h2>
      <p>El presente informe consolida los resultados trimestrales alcanzados durante el ejercicio fiscal 2026. A través de la optimización de procesos operativos y la digitalización de flujos de trabajo en la nube, se ha obtenido un incremento significativo en la productividad del equipo y una reducción del tiempo de entrega de proyectos.</p>
      
      <h2>2. Tabla de Indicadores Clave (KPIs)</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; text-align: left; border: 1px solid #cbd5e1;">Métrica</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">Objetivo Q3</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">Real Alcanzado</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">Variación</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Eficiencia Documental</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1;">85%</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">94.2%</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; color: #16a34a;">+9.2%</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Sincronización Multicentro</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1;">99.0%</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">99.8%</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; color: #16a34a;">+0.8%</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Ahorro de Tiempos de Redacción</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1;">20 hrs/mes</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">32 hrs/mes</td>
            <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; color: #16a34a;">+60%</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Recomendaciones y Próximos Pasos</h2>
      <ul>
        <li>Extender la adopción de plantillas normalizadas en todas las unidades de negocio.</li>
        <li>Implementar scripts automáticos de validación de estilo y referencias.</li>
        <li>Conectar los repositorios de Google Drive, OneDrive y Dropbox bajo políticas de sincronización continua.</li>
      </ul>
    `
  },
  {
    id: 'formal-letter',
    name: 'Carta Comercial y Formal',
    category: 'Correspondencia',
    description: 'Plantilla de correspondencia corporativa con membrete, cuerpo protocolar y firma.',
    thumbnailColor: 'bg-emerald-600',
    pageSize: 'Letter',
    orientation: 'portrait',
    content: `
      <p style="text-align: right;"><strong>Madrid, 25 de Octubre de 2026</strong></p>
      
      <p><strong>D. Alejandro Mendoza Silva</strong><br>
      Director General de Alianzas Estratégicas<br>
      Corporación Tecnológica Global S.A.<br>
      Paseo de la Castellana 120, Madrid</p>
      
      <p><strong>Asunto:</strong> Propuesta de integración de plataforma ofimática y sincronización multi-nube.</p>
      
      <p>Estimado D. Alejandro:</p>
      
      <p>Es un placer dirigirme a usted para presentarle formalmente nuestra nueva propuesta de transformación digital y gestión documental avanzada para su organización. A través de nuestro nuevo entorno ofimático compatible con formatos Word (.docx/.doc), sus colaboradores podrán editar, automatizar mediante scripts y colaborar en tiempo real de forma totalmente segura.</p>
      
      <p>Quedamos a su entera disposición para coordinar una sesión demostrativa en los próximos días y analizar las particularidades de su infraestructura técnica.</p>
      
      <p>Agradeciendo de antemano su atención, le saluda cordialmente,</p>
      
      <br><br>
      <div style="width: 250px; border-top: 1px solid #000; padding-top: 6px;">
        <p><strong>Dra. Valeria Rincón Morales</strong><br>
        Directora de Innovación y Soluciones Cloud<br>
        <em>Word Studio 365 Professional</em></p>
      </div>
    `
  },
  {
    id: 'academic-thesis',
    name: 'Tesis / Artículo Académico (APA 7)',
    category: 'Académico',
    description: 'Formato estándar de investigación con resumen, palabras clave, metodología y citas.',
    thumbnailColor: 'bg-amber-600',
    pageSize: 'A4',
    orientation: 'portrait',
    content: `
      <h1 style="text-align: center; font-size: 22px; margin-top: 40px;">Impacto de las Suites Ofimáticas Basadas en Navegador en la Colaboración Empresarial Distribución</h1>
      <p style="text-align: center; font-style: italic;">Valeria Rincón, Alejandro Mendoza y Carlos Vega<br>Departamento de Ciencias de la Computación, Universidad Internacional</p>
      
      <h3 style="margin-top: 30px;">Resumen</h3>
      <p style="text-align: justify; font-size: 14px; line-height: 1.6;">El advenimiento de arquitecturas web modernas ha permitido el desarrollo de procesadores de texto completos con compatibilidad binaria para formatos OpenXML (.docx) y RTF, combinando almacenamiento persistente con sincronización descentralizada (Google Drive, OneDrive, Dropbox). Este estudio evalúa la latencia de colaboración sincrónica y el impacto de macros programables en JavaScript.</p>
      
      <p><strong>Palabras clave:</strong> Procesamiento de texto, OpenXML, colaboración en tiempo real, macros ofimáticas, sincronización en la nube.</p>
      
      <h3>1. Introducción</h3>
      <p style="text-align: justify; text-indent: 24px;">La evolución de las herramientas ofimáticas ha transitado desde aplicaciones monolíticas instaladas localmente hacia plataformas web interactivas de alto rendimiento (Smith & Johnson, 2024). La interoperabilidad con el estándar Microsoft Office sigue siendo el requisito primordial para entornos corporativos.</p>
      
      <h3>2. Metodología y Resultados</h3>
      <p style="text-align: justify; text-indent: 24px;">Se analizó el desempeño en la apertura y renderizado de archivos con estructuras complejas (tablas anidadas, estilos tipográficos, imágenes incrustadas), comprobando una tasa de fidelidad superior al 99.4%.</p>
    `
  },
  {
    id: 'meeting-minutes',
    name: 'Acta de Reunión de Comité',
    category: 'Organizacional',
    description: 'Plantilla para registrar asistentes, orden del día, acuerdos y compromisos.',
    thumbnailColor: 'bg-rose-600',
    pageSize: 'A4',
    orientation: 'portrait',
    content: `
      <h2 style="color: #9f1239; border-bottom: 2px solid #f43f5e; padding-bottom: 6px;">ACTA DE REUNIÓN EXTRAORDINARIA DE COMITÉ</h2>
      <p><strong>Fecha:</strong> 25 de Octubre de 2026 | <strong>Hora:</strong> 10:00 - 11:30 CET | <strong>Lugar:</strong> Sala Virtual & Híbrida 4</p>
      
      <p><strong>Asistentes:</strong></p>
      <ul>
        <li>Elena Torres (Presidenta de Comité)</li>
        <li>Carlos Vega (Secretario de Actas)</li>
        <li>Valeria Rincón (Directora Técnica)</li>
        <li>Ignacio Soler (Coordinador de Infraestructura)</li>
      </ul>

      <h3>1. Orden del Día</h3>
      <ol>
        <li>Aprobación del acta anterior.</li>
        <li>Integración de conectores para Google Drive, OneDrive y Dropbox.</li>
        <li>Activación del motor de Scripts y Extensiones avanzadas.</li>
        <li>Ruegos y preguntas.</li>
      </ol>

      <h3>2. Acuerdos Adoptados</h3>
      <p>Se aprueba por unanimidad el despliegue del nuevo editor Word Studio 365 con soporte offline, modo oscuro y herramientas de revisión colaborativa.</p>
    `
  }
];

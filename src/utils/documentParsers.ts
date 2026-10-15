import mammoth from 'mammoth';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Converts a raw File (DOCX, RTF, HTML, TXT, MD, JSON) to clean, rich HTML content
 */
export async function parseDocumentFile(file: File): Promise<{ html: string; title: string; type: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const title = file.name.replace(/\.[^/.]+$/, "");

  if (extension === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // 1. Check if the file is an HTML-based DOCX (e.g. Word HTML container format)
      const uint8 = new Uint8Array(arrayBuffer.slice(0, 100));
      const firstBytes = String.fromCharCode(...Array.from(uint8));
      if (firstBytes.includes('<html') || firstBytes.includes('<!DOCTYPE') || firstBytes.includes('<w:WordDocument') || firstBytes.includes('xmlns:w=')) {
        const textDecoder = new TextDecoder('utf-8');
        const rawText = textDecoder.decode(arrayBuffer);
        const bodyMatch = rawText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const html = bodyMatch ? bodyMatch[1] : rawText;
        return { html: sanitizeImportedHtml(html), title, type: 'docx' };
      }

      // 2. Try Mammoth with comprehensive style mappings and inline base64 image converter
      let mammothSuccess = false;
      let htmlFromMammoth = '';
      try {
        const mammothResult = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            convertImage: mammoth.images.imgElement(function(image) {
              return image.read("base64").then(function(imageBuffer) {
                return {
                  src: `data:${image.contentType || 'image/png'};base64,${imageBuffer}`
                };
              });
            }),
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Heading 4'] => h4:fresh",
              "p[style-name='Heading 5'] => h5:fresh",
              "p[style-name='Heading 6'] => h6:fresh",
              "p[style-name='Title'] => h1.doc-title:fresh",
              "p[style-name='Subtitle'] => h2.doc-subtitle:fresh",
              "p[style-name='Título 1'] => h1:fresh",
              "p[style-name='Título 2'] => h2:fresh",
              "p[style-name='Título 3'] => h3:fresh",
              "p[style-name='Título'] => h1.doc-title:fresh",
              "p[style-name='Subtítulo'] => h2.doc-subtitle:fresh",
              "r[style-name='Strong'] => strong",
              "r[style-name='Emphasis'] => em",
              "p[style-name='Quote'] => blockquote:fresh",
              "p[style-name='Intense Quote'] => blockquote.intense:fresh",
              "p[style-name='Cita'] => blockquote:fresh",
              "p[style-name='List Bullet'] => ul > li:fresh",
              "p[style-name='List Number'] => ol > li:fresh",
              "table => table.table-auto:fresh"
            ],
            includeDefaultStyleMap: true,
            ignoreEmptyParagraphs: false
          }
        );

        if (mammothResult && mammothResult.value && mammothResult.value.trim().length > 0) {
          htmlFromMammoth = sanitizeImportedHtml(mammothResult.value);
          mammothSuccess = true;
        }
      } catch (mammothErr) {
        console.warn('Mammoth conversion encountered an issue, running OpenXML deep engine...', mammothErr);
      }

      // 3. Fallback / Alternative: Native OpenXML Deep DOM Parser (Extracts full tables, drawings, styles, colors)
      if (!mammothSuccess || htmlFromMammoth.length < 20) {
        const openXmlHtml = await parseDocxWithOpenXml(arrayBuffer);
        if (openXmlHtml && openXmlHtml.trim().length > 0) {
          return { html: openXmlHtml, title, type: 'docx' };
        }
      }

      if (mammothSuccess) {
        return { html: htmlFromMammoth, title, type: 'docx' };
      }

      return { html: '', title, type: 'docx' };
    } catch (err) {
      console.error('All DOCX parsers failed for file:', file.name, err);
      throw new Error('No se pudo procesar el archivo DOCX. Asegúrate de que no esté dañado ni protegido por contraseña.');
    }
  }

  if (extension === 'rtf') {
    const rawRtf = await file.text();
    const html = parseRtfToHtml(rawRtf);
    return { html, title, type: 'rtf' };
  }

  if (extension === 'html' || extension === 'htm') {
    const rawHtml = await file.text();
    const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const html = bodyMatch ? bodyMatch[1] : rawHtml;
    return { html: sanitizeImportedHtml(html), title, type: 'html' };
  }

  if (extension === 'md' || extension === 'markdown') {
    const rawMd = await file.text();
    const html = parseMarkdownToHtml(rawMd);
    return { html, title, type: 'md' };
  }

  if (extension === 'json') {
    const rawJson = await file.text();
    try {
      const parsed = JSON.parse(rawJson);
      return { 
        html: parsed.content || parsed.html || '', 
        title: parsed.title || title, 
        type: 'json' 
      };
    } catch {
      return { html: `<pre>${escapeHtml(rawJson)}</pre>`, title, type: 'json' };
    }
  }

  // Plain Text (TXT)
  const rawText = await file.text();
  const paragraphs = rawText
    .split(/\n\n+/)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return { html: paragraphs || '', title, type: 'txt' };
}

/**
 * OpenXML Native DOM Parser for Word DOCX archives
 * Extracts word/document.xml, relationships, styles, tables, drawings, images, fonts and formatting.
 */
async function parseDocxWithOpenXml(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Extract media relationships (images) from document.xml.rels
  const imageMap: Record<string, string> = {};
  try {
    const relsFile = zip.file('word/_rels/document.xml.rels');
    if (relsFile) {
      const relsXml = await relsFile.async('text');
      const parser = new DOMParser();
      const relsDoc = parser.parseFromString(relsXml, 'application/xml');
      const relElements = relsDoc.getElementsByTagName('Relationship');
      
      for (let i = 0; i < relElements.length; i++) {
        const rel = relElements[i];
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        const type = rel.getAttribute('Type') || '';
        
        if (id && target && (type.includes('image') || target.match(/\.(png|jpe?g|gif|svg|webp|bmp|tiff)$/i))) {
          let imagePath = target;
          if (imagePath.startsWith('/')) imagePath = imagePath.slice(1);
          if (!imagePath.startsWith('word/')) imagePath = `word/${imagePath}`;

          const imgFile = zip.file(imagePath);
          if (imgFile) {
            const base64 = await imgFile.async('base64');
            const ext = target.split('.').pop()?.toLowerCase() || 'png';
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'svg' ? 'image/svg+xml' : `image/${ext}`);
            imageMap[id] = `data:${mime};base64,${base64}`;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not read DOCX image relationships', e);
  }

  // 2. Read word/document.xml
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    return '';
  }

  const docXml = await docFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, 'application/xml');

  // Traverse body children (namespace agnostic)
  const bodyNodes = xmlDoc.getElementsByTagNameNS('*', 'body');
  const body = bodyNodes.length > 0 ? bodyNodes[0] : (xmlDoc.getElementsByTagName('w:body')[0] || xmlDoc.getElementsByTagName('body')[0]);
  if (!body) return '';

  let htmlResult = '';

  for (let i = 0; i < body.childNodes.length; i++) {
    const node = body.childNodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    const tagName = el.localName || el.nodeName.split(':').pop() || '';

    if (tagName === 'p') {
      htmlResult += parseOpenXmlParagraph(el, imageMap);
    } else if (tagName === 'tbl') {
      htmlResult += parseOpenXmlTable(el, imageMap);
    } else if (tagName === 'sdt') {
      // Structured Document Tag
      const sdtContentNodes = el.getElementsByTagNameNS('*', 'sdtContent');
      const sdtContent = sdtContentNodes.length > 0 ? sdtContentNodes[0] : (el.getElementsByTagName('w:sdtContent')[0] || el.getElementsByTagName('sdtContent')[0]);
      if (sdtContent) {
        for (let j = 0; j < sdtContent.childNodes.length; j++) {
          const sdtChild = sdtContent.childNodes[j];
          if (sdtChild.nodeType === Node.ELEMENT_NODE) {
            const childEl = sdtChild as Element;
            const childTag = childEl.localName || childEl.nodeName.split(':').pop() || '';
            if (childTag === 'p') htmlResult += parseOpenXmlParagraph(childEl, imageMap);
            else if (childTag === 'tbl') htmlResult += parseOpenXmlTable(childEl, imageMap);
          }
        }
      }
    }
  }

  return sanitizeImportedHtml(htmlResult);
}

/**
 * Parses an OpenXML paragraph element
 */
function parseOpenXmlParagraph(pEl: Element, imageMap: Record<string, string>): string {
  let tag = 'p';
  let isHeading1 = false;
  let isHeading2 = false;
  let isHeading3 = false;
  let isBullet = false;
  const inlineStyles: string[] = [];

  // Find pPr properties
  const pPrList = pEl.getElementsByTagNameNS('*', 'pPr');
  const pPr = pPrList.length > 0 ? pPrList[0] : (pEl.getElementsByTagName('w:pPr')[0] || pEl.getElementsByTagName('pPr')[0]);

  if (pPr) {
    // Style name
    const pStyleNodes = pPr.getElementsByTagNameNS('*', 'pStyle');
    const pStyle = pStyleNodes.length > 0 ? pStyleNodes[0] : (pPr.getElementsByTagName('w:pStyle')[0] || pPr.getElementsByTagName('pStyle')[0]);
    if (pStyle) {
      const val = (pStyle.getAttribute('w:val') || pStyle.getAttribute('val') || '').toLowerCase();
      if (val.includes('heading1') || val === 'heading 1' || val === 'title' || val === 'título 1' || val === 'título') isHeading1 = true;
      else if (val.includes('heading2') || val === 'heading 2' || val === 'subtitle' || val === 'título 2' || val === 'subtítulo') isHeading2 = true;
      else if (val.includes('heading3') || val === 'heading 3' || val === 'título 3') isHeading3 = true;
      else if (val.includes('list') || val.includes('bullet') || val.includes('viñeta')) isBullet = true;
    }

    // Numbering / Bullet list
    const numPrNodes = pPr.getElementsByTagNameNS('*', 'numPr');
    if (numPrNodes.length > 0) isBullet = true;

    // Alignment
    const jcNodes = pPr.getElementsByTagNameNS('*', 'jc');
    const jc = jcNodes.length > 0 ? jcNodes[0] : (pPr.getElementsByTagName('w:jc')[0] || pPr.getElementsByTagName('jc')[0]);
    if (jc) {
      const jcVal = (jc.getAttribute('w:val') || jc.getAttribute('val') || '').toLowerCase();
      if (jcVal === 'center') inlineStyles.push('text-align: center');
      else if (jcVal === 'right') inlineStyles.push('text-align: right');
      else if (jcVal === 'both' || jcVal === 'justify') inlineStyles.push('text-align: justify');
      else if (jcVal === 'left') inlineStyles.push('text-align: left');
    }

    // Spacing
    const spNodes = pPr.getElementsByTagNameNS('*', 'spacing');
    const sp = spNodes.length > 0 ? spNodes[0] : (pPr.getElementsByTagName('w:spacing')[0] || pPr.getElementsByTagName('spacing')[0]);
    if (sp) {
      const before = sp.getAttribute('w:before') || sp.getAttribute('before');
      const after = sp.getAttribute('w:after') || sp.getAttribute('after');
      if (before) inlineStyles.push(`margin-top: ${Math.round(parseInt(before) / 20)}pt`);
      if (after) inlineStyles.push(`margin-bottom: ${Math.round(parseInt(after) / 20)}pt`);
    }
  }

  if (isHeading1) tag = 'h1';
  else if (isHeading2) tag = 'h2';
  else if (isHeading3) tag = 'h3';
  else if (isBullet) tag = 'li';

  let innerContent = '';

  // Process child nodes: runs, breaks, hyperlinks, drawings
  for (let i = 0; i < pEl.childNodes.length; i++) {
    const child = pEl.childNodes[i];
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const childEl = child as Element;
    const name = childEl.localName || childEl.nodeName.split(':').pop() || '';

    if (name === 'r') {
      innerContent += parseOpenXmlRun(childEl, imageMap);
    } else if (name === 'hyperlink') {
      const rInside = childEl.getElementsByTagNameNS('*', 'r');
      let linkText = '';
      for (let k = 0; k < rInside.length; k++) {
        linkText += parseOpenXmlRun(rInside[k], imageMap);
      }
      innerContent += `<a href="#" class="text-blue-600 underline">${linkText || 'Enlace'}</a>`;
    } else if (name === 'drawing' || name === 'pict') {
      innerContent += parseOpenXmlDrawing(childEl, imageMap);
    }
  }

  const styleAttr = inlineStyles.length > 0 ? ` style="${inlineStyles.join('; ')}"` : '';

  if (!innerContent.trim()) {
    return tag === 'li' ? '' : `<${tag}${styleAttr}><br></${tag}>`;
  }

  if (tag === 'li') {
    return `<ul><li${styleAttr}>${innerContent}</li></ul>`;
  }

  return `<${tag}${styleAttr}>${innerContent}</${tag}>`;
}

/**
 * Parses an OpenXML text run element <w:r>
 */
function parseOpenXmlRun(rEl: Element, imageMap: Record<string, string>): string {
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isStrike = false;
  let isSubscript = false;
  let isSuperscript = false;
  let color = '';
  let highlight = '';
  let fontSizePt = 0;
  let fontFamily = '';

  const rPrNodes = rEl.getElementsByTagNameNS('*', 'rPr');
  const rPr = rPrNodes.length > 0 ? rPrNodes[0] : (rEl.getElementsByTagName('w:rPr')[0] || rEl.getElementsByTagName('rPr')[0]);

  if (rPr) {
    if (rPr.getElementsByTagNameNS('*', 'b').length > 0 || rPr.getElementsByTagName('w:b').length > 0) isBold = true;
    if (rPr.getElementsByTagNameNS('*', 'i').length > 0 || rPr.getElementsByTagName('w:i').length > 0) isItalic = true;
    if (rPr.getElementsByTagNameNS('*', 'u').length > 0 || rPr.getElementsByTagName('w:u').length > 0) isUnderline = true;
    if (rPr.getElementsByTagNameNS('*', 'strike').length > 0 || rPr.getElementsByTagName('w:strike').length > 0) isStrike = true;

    // Subscript / Superscript
    const vertAlign = rPr.getElementsByTagNameNS('*', 'vertAlign')[0] || rPr.getElementsByTagName('w:vertAlign')[0];
    if (vertAlign) {
      const vVal = vertAlign.getAttribute('w:val') || vertAlign.getAttribute('val');
      if (vVal === 'superscript') isSuperscript = true;
      else if (vVal === 'subscript') isSubscript = true;
    }

    // Font size (in half points)
    const szEl = rPr.getElementsByTagNameNS('*', 'sz')[0] || rPr.getElementsByTagName('w:sz')[0];
    if (szEl) {
      const szVal = szEl.getAttribute('w:val') || szEl.getAttribute('val');
      if (szVal) {
        fontSizePt = Math.round(parseInt(szVal, 10) / 2);
      }
    }

    // Font Family
    const fontEl = rPr.getElementsByTagNameNS('*', 'rFonts')[0] || rPr.getElementsByTagName('w:rFonts')[0];
    if (fontEl) {
      fontFamily = fontEl.getAttribute('w:ascii') || fontEl.getAttribute('w:hAnsi') || fontEl.getAttribute('ascii') || '';
    }

    // Color
    const colorEl = rPr.getElementsByTagNameNS('*', 'color')[0] || rPr.getElementsByTagName('w:color')[0];
    if (colorEl) {
      const cVal = colorEl.getAttribute('w:val') || colorEl.getAttribute('val');
      if (cVal && cVal !== 'auto') color = `#${cVal}`;
    }

    // Highlight
    const hlEl = rPr.getElementsByTagNameNS('*', 'highlight')[0] || rPr.getElementsByTagName('w:highlight')[0];
    if (hlEl) {
      const hVal = hlEl.getAttribute('w:val') || hlEl.getAttribute('val');
      if (hVal) highlight = hVal === 'yellow' ? '#fef08a' : (hVal === 'cyan' ? '#a5f3fc' : '#fed7aa');
    }
  }

  let text = '';
  // Text nodes
  const textNodes = rEl.getElementsByTagNameNS('*', 't');
  if (textNodes.length > 0) {
    for (let t = 0; t < textNodes.length; t++) {
      text += textNodes[t].textContent || '';
    }
  } else {
    const rawT = rEl.getElementsByTagName('w:t');
    for (let t = 0; t < rawT.length; t++) {
      text += rawT[t].textContent || '';
    }
  }

  // Tabs
  if (rEl.getElementsByTagNameNS('*', 'tab').length > 0 || rEl.getElementsByTagName('w:tab').length > 0) {
    text += '\u00A0\u00A0\u00A0\u00A0';
  }

  // Line breaks inside run
  const brNodes = rEl.getElementsByTagNameNS('*', 'br');
  if (brNodes.length > 0) {
    for (let b = 0; b < brNodes.length; b++) {
      const type = brNodes[b].getAttribute('w:type') || brNodes[b].getAttribute('type');
      if (type === 'page') {
        text += '</div><div class="page-break" style="break-after: page; page-break-after: always; height: 16px; border-bottom: 2px dashed #94a3b8; margin: 24px 0; text-align: center; font-size: 10px; color: #94a3b8; user-select: none;">--- Salto de Página ---</div><div>';
      } else {
        text += '<br>';
      }
    }
  }

  // Drawing images embedded in runs
  text += parseOpenXmlDrawing(rEl, imageMap);

  if (!text) return '';

  let formatted = escapeHtml(text)
    .replace(/&lt;br&gt;/g, '<br>')
    .replace(/&lt;div class="page-break"[\s\S]*?&lt;\/div&gt;/g, (match) => {
      const div = document.createElement('div');
      div.innerHTML = match;
      return div.innerText || '';
    });

  if (isBold) formatted = `<strong>${formatted}</strong>`;
  if (isItalic) formatted = `<em>${formatted}</em>`;
  if (isUnderline) formatted = `<u>${formatted}</u>`;
  if (isStrike) formatted = `<s>${formatted}</s>`;
  if (isSuperscript) formatted = `<sup>${formatted}</sup>`;
  if (isSubscript) formatted = `<sub>${formatted}</sub>`;

  const runStyles: string[] = [];
  if (color) runStyles.push(`color: ${color}`);
  if (highlight) runStyles.push(`background-color: ${highlight}`);
  if (fontSizePt > 0 && fontSizePt !== 11 && fontSizePt !== 12) runStyles.push(`font-size: ${fontSizePt}pt`);
  if (fontFamily && fontFamily !== 'Calibri') runStyles.push(`font-family: '${fontFamily}', sans-serif`);

  if (runStyles.length > 0) {
    formatted = `<span style="${runStyles.join('; ')}">${formatted}</span>`;
  }

  return formatted;
}

/**
 * Parses drawing tags & images
 */
function parseOpenXmlDrawing(containerEl: Element, imageMap: Record<string, string>): string {
  let imgHtml = '';

  // Look for a:blip or v:imagedata
  const blips = containerEl.getElementsByTagNameNS('*', 'blip');
  for (let b = 0; b < blips.length; b++) {
    const embedId = blips[b].getAttribute('r:embed') || blips[b].getAttribute('embed') || blips[b].getAttribute('r:link');
    if (embedId && imageMap[embedId]) {
      imgHtml += `<img src="${imageMap[embedId]}" alt="Imagen DOCX" style="max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; display: block;" />`;
    }
  }

  const imagedatas = containerEl.getElementsByTagNameNS('*', 'imagedata');
  for (let b = 0; b < imagedatas.length; b++) {
    const embedId = imagedatas[b].getAttribute('r:id') || imagedatas[b].getAttribute('id');
    if (embedId && imageMap[embedId]) {
      imgHtml += `<img src="${imageMap[embedId]}" alt="Imagen DOCX" style="max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; display: block;" />`;
    }
  }

  return imgHtml;
}

/**
 * Parses an OpenXML table element <w:tbl>
 */
function parseOpenXmlTable(tblEl: Element, imageMap: Record<string, string>): string {
  let html = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; border: 1px solid #cbd5e1;"><tbody>';
  const rows = tblEl.getElementsByTagNameNS('*', 'tr');

  for (let r = 0; r < rows.length; r++) {
    const rowEl = rows[r];
    const isHeaderRow = r === 0;
    html += `<tr style="${isHeaderRow ? 'background-color: #f8fafc; font-weight: 600;' : ''}">`;

    const cells = rowEl.getElementsByTagNameNS('*', 'tc');
    for (let c = 0; c < cells.length; c++) {
      const cellEl = cells[c];
      let cellText = '';
      
      // Cell background shading
      let cellBg = '';
      const shd = cellEl.getElementsByTagNameNS('*', 'shd')[0];
      if (shd) {
        const fill = shd.getAttribute('w:fill') || shd.getAttribute('fill');
        if (fill && fill !== 'auto' && fill !== 'none') cellBg = `background-color: #${fill};`;
      }

      // Colspan
      let colspanAttr = '';
      const gridSpan = cellEl.getElementsByTagNameNS('*', 'gridSpan')[0];
      if (gridSpan) {
        const spanVal = gridSpan.getAttribute('w:val') || gridSpan.getAttribute('val');
        if (spanVal) colspanAttr = ` colspan="${spanVal}"`;
      }

      const paragraphs = cellEl.getElementsByTagNameNS('*', 'p');
      for (let p = 0; p < paragraphs.length; p++) {
        cellText += parseOpenXmlParagraph(paragraphs[p], imageMap);
      }

      const cellTag = isHeaderRow ? 'th' : 'td';
      html += `<${cellTag}${colspanAttr} style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; vertical-align: top; ${cellBg}">${cellText || '&nbsp;'}</${cellTag}>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

/**
 * Sanitize and normalize imported HTML to prevent DOM breaking or malformed tags
 */
function sanitizeImportedHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<!\[if !supportLists\]>[\s\S]*?<!\[endif\]>/gi, '')
    .replace(/class="Mso[a-zA-Z0-9]+"/gi, '')
    .replace(/style="mso-[^"]*"/gi, '')
    .replace(/<span style="mso-[^"]*">([\s\S]*?)<\/span>/gi, '$1')
    .trim();
}

/**
 * Convert RTF to HTML
 */
export function parseRtfToHtml(rtf: string): string {
  let text = rtf.replace(/\{\\\*[\s\S]*?\}/g, '');
  text = text.replace(/\{\\fonttbl[\s\S]*?\}/g, '');
  text = text.replace(/\{\\colortbl[\s\S]*?\}/g, '');

  text = text.replace(/\\b\s([\s\S]*?)\\b0/g, '<strong>$1</strong>');
  text = text.replace(/\\i\s([\s\S]*?)\\i0/g, '<em>$1</em>');
  text = text.replace(/\\ul\s([\s\S]*?)\\ulnone/g, '<u>$1</u>');
  text = text.replace(/\\par\s?/g, '</p><p>');
  text = text.replace(/\\[a-z0-9\-]+/g, '');
  text = text.replace(/[{}]/g, '');

  const lines = text.split('</p><p>').map(l => l.trim()).filter(Boolean);
  return lines.length > 0 ? `<p>${lines.join('</p><p>')}</p>` : '';
}

/**
 * Convert Markdown to HTML
 */
export function parseMarkdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  const lines = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<blockquote') || block.startsWith('<li')) {
      if (block.startsWith('<li>')) return `<ul>${block}</ul>`;
      return block;
    }
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  });

  return lines.filter(Boolean).join('');
}

/**
 * Export HTML content to DOCX format (Word OpenXML HTML MIME container)
 */
export function exportToDocx(title: string, htmlContent: string): void {
  const docxTemplate = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title || 'Documento')}</title>
      <!--[if gte mso 9]>
      <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 21.0cm 29.7cm;
          margin: 2.5cm 2.5cm 2.5cm 2.5cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #111827;
        }
        h1 { font-size: 20pt; font-weight: bold; color: #1e3a8a; margin-top: 18pt; margin-bottom: 6pt; }
        h2 { font-size: 15pt; font-weight: bold; color: #1e40af; margin-top: 14pt; margin-bottom: 4pt; }
        h3 { font-size: 13pt; font-weight: bold; color: #3b82f6; margin-top: 10pt; margin-bottom: 2pt; }
        p { margin-top: 0; margin-bottom: 8pt; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 10pt; }
        th, td { border: 1px solid #cbd5e1; padding: 6pt 8pt; text-align: left; }
        th { background-color: #f1f5f9; font-weight: bold; }
        blockquote { border-left: 3pt solid #3b82f6; margin: 12pt 0; padding-left: 10pt; color: #475569; font-style: italic; }
      </style>
    </head>
    <body>
      ${htmlContent || '<p></p>'}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + docxTemplate], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  downloadBlob(blob, `${title || 'documento'}.docx`);
}

/**
 * Export to HTML file
 */
export function exportToHtml(title: string, htmlContent: string): void {
  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || 'Documento')}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      background-color: #ffffff;
    }
    h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
    blockquote { border-left: 4px solid #3b82f6; margin: 0; padding-left: 16px; color: #64748b; font-style: italic; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
  </style>
</head>
<body>
  ${htmlContent || '<p></p>'}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${title || 'documento'}.html`);
}

/**
 * Multi-page High-Resolution PDF Exporter
 * Generates an authentic, perfectly sized A4/Letter PDF with multi-page segmentation.
 */
export async function exportToPdf(
  title: string,
  contentOrElement: string | HTMLElement,
  options?: {
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    watermarkText?: string;
    pageColor?: string;
  }
): Promise<void> {
  const isLandscape = options?.orientation === 'landscape';
  const paperFormat = (options?.pageSize?.toLowerCase() || 'a4') as 'a4' | 'letter' | 'legal';
  
  // Dimensions in mm
  let pdfWidthMm = isLandscape ? 297 : 210;
  let pdfHeightMm = isLandscape ? 210 : 297;
  if (paperFormat === 'letter') {
    pdfWidthMm = isLandscape ? 279.4 : 215.9;
    pdfHeightMm = isLandscape ? 215.9 : 279.4;
  } else if (paperFormat === 'legal') {
    pdfWidthMm = isLandscape ? 355.6 : 215.9;
    pdfHeightMm = isLandscape ? 215.9 : 355.6;
  }

  // Create clean off-screen staging DOM
  const stagingContainer = document.createElement('div');
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.left = '-9999px';
  stagingContainer.style.top = '0';
  stagingContainer.style.width = isLandscape ? '1123px' : '794px';
  stagingContainer.style.backgroundColor = options?.pageColor || '#ffffff';
  stagingContainer.style.color = '#0f172a';
  stagingContainer.style.fontFamily = 'Calibri, Segoe UI, Arial, sans-serif';
  stagingContainer.style.fontSize = '14px';
  stagingContainer.style.lineHeight = '1.6';
  stagingContainer.style.padding = '40px 48px';
  stagingContainer.style.boxSizing = 'border-box';
  stagingContainer.style.zIndex = '-9999';

  // Inject content
  if (typeof contentOrElement === 'string') {
    stagingContainer.innerHTML = contentOrElement || '<p></p>';
  } else {
    // Clone node without transform scale
    const clone = contentOrElement.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    stagingContainer.appendChild(clone);
  }

  // Add watermark if needed
  if (options?.watermarkText) {
    const wm = document.createElement('div');
    wm.innerText = options.watermarkText;
    wm.style.position = 'absolute';
    wm.style.top = '50%';
    wm.style.left = '50%';
    wm.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
    wm.style.fontSize = '80px';
    wm.style.fontWeight = '900';
    wm.style.color = 'rgba(239, 68, 68, 0.12)';
    wm.style.textTransform = 'uppercase';
    wm.style.letterSpacing = '10px';
    wm.style.pointerEvents = 'none';
    wm.style.userSelect = 'none';
    stagingContainer.appendChild(wm);
  }

  document.body.appendChild(stagingContainer);

  try {
    const canvas = await html2canvas(stagingContainer, {
      scale: 2, // 2x high resolution crisp print quality
      useCORS: true,
      logging: false,
      backgroundColor: options?.pageColor || '#ffffff',
      windowWidth: isLandscape ? 1123 : 794
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: paperFormat
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate height of one page in canvas pixels
    const pxPageHeight = (canvasWidth * pdfHeightMm) / pdfWidthMm;
    const totalPages = Math.ceil(canvasHeight / pxPageHeight);

    if (totalPages <= 1) {
      // Single Page
      const singleImgHeight = (canvasHeight * pdfWidthMm) / canvasWidth;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidthMm, singleImgHeight);
    } else {
      // Multi-Page Slicing
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = pxPageHeight;
      const pageCtx = pageCanvas.getContext('2d');

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage(paperFormat, isLandscape ? 'landscape' : 'portrait');
        }

        if (pageCtx) {
          pageCtx.fillStyle = options?.pageColor || '#ffffff';
          pageCtx.fillRect(0, 0, canvasWidth, pxPageHeight);
          
          const sourceY = page * pxPageHeight;
          const sourceHeight = Math.min(pxPageHeight, canvasHeight - sourceY);

          pageCtx.drawImage(
            canvas,
            0, sourceY, canvasWidth, sourceHeight,
            0, 0, canvasWidth, sourceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm);
        }
      }
    }

    const cleanFilename = (title || 'documento').trim().replace(/[/\\?%*:|"<>]/g, '-');
    pdf.save(`${cleanFilename}.pdf`);
  } catch (err) {
    console.error('Error generando el archivo PDF:', err);
    // Fallback to native print
    window.print();
  } finally {
    if (document.body.contains(stagingContainer)) {
      document.body.removeChild(stagingContainer);
    }
  }
}

/**
 * Export to RTF format
 */
export function exportToRtf(title: string, htmlContent: string): void {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const plainText = tempDiv.innerText || tempDiv.textContent || '';
  
  let rtf = "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang3082{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\n";
  rtf += "{\\colortbl ;\\red30\\green58\\blue138;\\red51\\green65\\blue85;}\n";
  rtf += "\\viewkind4\\uc1\\pard\\f0\\fs22 ";
  
  const paragraphs = plainText.split('\n');
  for (const p of paragraphs) {
    if (p.trim()) {
      rtf += `${escapeRtf(p)}\\par\n`;
    } else {
      rtf += "\\par\n";
    }
  }
  rtf += "}";

  const blob = new Blob([rtf], { type: 'application/rtf;charset=utf-8' });
  downloadBlob(blob, `${title || 'documento'}.rtf`);
}

/**
 * Export to Plain Text (.txt)
 */
export function exportToTxt(title: string, htmlContent: string): void {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const text = tempDiv.innerText || tempDiv.textContent || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${title || 'documento'}.txt`);
}

/**
 * Export to Markdown (.md)
 */
export function exportToMarkdown(title: string, htmlContent: string): void {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  let md = `# ${title || 'Documento'}\n\n`;
  const nodes = tempDiv.childNodes;
  nodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const text = el.innerText || el.textContent || '';
      
      if (tag === 'h1') md += `# ${text}\n\n`;
      else if (tag === 'h2') md += `## ${text}\n\n`;
      else if (tag === 'h3') md += `### ${text}\n\n`;
      else if (tag === 'blockquote') md += `> ${text}\n\n`;
      else if (tag === 'ul') {
        el.querySelectorAll('li').forEach(li => {
          md += `- ${li.innerText}\n`;
        });
        md += '\n';
      }
      else if (tag === 'ol') {
        el.querySelectorAll('li').forEach((li, idx) => {
          md += `${idx + 1}. ${li.innerText}\n`;
        });
        md += '\n';
      }
      else if (tag === 'p') md += `${text}\n\n`;
      else md += `${text}\n\n`;
    }
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${title || 'documento'}.md`);
}

/**
 * Native Browser Printing Engine
 * Creates an isolated print context ensuring crisp layout, exact page sizes,
 * margins, watermarks, headers/footers, and invokes the browser's native print dialog.
 */
export interface NativePrintOptions {
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  marginsMm?: { top: number; bottom: number; left: number; right: number };
  watermarkText?: string;
  watermarkOpacity?: number;
  headerText?: string;
  footerText?: string;
  includeHeaderFooter?: boolean;
  colorMode?: 'color' | 'grayscale';
  pageColor?: string;
}

export function generatePrintableHtml(
  title: string,
  content: string,
  options?: NativePrintOptions
): string {
  const isLandscape = options?.orientation === 'landscape';
  const paperFormat = (options?.pageSize || 'A4').toUpperCase();
  const orientation = isLandscape ? 'landscape' : 'portrait';
  const margins = options?.marginsMm || { top: 20, bottom: 20, left: 20, right: 20 };
  const isGrayscale = options?.colorMode === 'grayscale';
  const watermarkText = options?.watermarkText || '';
  const watermarkOpacity = options?.watermarkOpacity || 0.12;
  const includeHeaderFooter = options?.includeHeaderFooter ?? true;
  const docTitle = title || 'Documento sin título';

  let pageDimensionsCss = '210mm 297mm';
  if (paperFormat === 'LETTER') {
    pageDimensionsCss = isLandscape ? '279.4mm 215.9mm' : '215.9mm 279.4mm';
  } else if (paperFormat === 'LEGAL') {
    pageDimensionsCss = isLandscape ? '355.6mm 215.9mm' : '215.9mm 355.6mm';
  } else {
    pageDimensionsCss = isLandscape ? '297mm 210mm' : '210mm 297mm';
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    @page {
      size: ${pageDimensionsCss} ${orientation};
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: ${options?.pageColor || '#ffffff'} !important;
      color: #0f172a !important;
      font-family: 'Calibri', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 11.5pt;
      line-height: 1.6;
      ${isGrayscale ? 'filter: grayscale(100%);' : ''}
    }

    .print-container {
      position: relative;
      width: 100%;
      min-height: 100%;
    }

    /* Watermark */
    .print-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      font-weight: 900;
      color: #ef4444;
      opacity: ${watermarkOpacity};
      text-transform: uppercase;
      letter-spacing: 12px;
      pointer-events: none;
      z-index: 0;
      user-select: none;
      white-space: nowrap;
    }

    /* Header & Footer */
    .print-header {
      font-size: 8.5pt;
      color: #64748b;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .print-footer {
      font-size: 8.5pt;
      color: #64748b;
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Content styling */
    .print-content {
      position: relative;
      z-index: 1;
    }

    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      break-after: avoid;
      color: #0f172a;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
    }

    h1 { font-size: 20pt; font-weight: 700; color: #1e3a8a; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; }
    h2 { font-size: 15pt; font-weight: 700; color: #1e40af; }
    h3 { font-size: 13pt; font-weight: 600; color: #2563eb; }

    p {
      margin: 0 0 10pt 0;
      line-height: 1.6;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14pt 0;
      font-size: 10pt;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6pt 9pt;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9 !important;
      font-weight: 600;
    }

    blockquote {
      border-left: 3.5pt solid #3b82f6;
      margin: 12pt 0;
      padding: 4pt 0 4pt 12pt;
      color: #475569;
      font-style: italic;
    }

    ul, ol {
      margin: 8pt 0 12pt 20pt;
      padding: 0;
    }

    li {
      margin-bottom: 4pt;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      height: 0 !important;
      margin: 0 !important;
      border: none !important;
      visibility: hidden !important;
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${watermarkText ? `<div class="print-watermark">${escapeHtml(watermarkText)}</div>` : ''}
    
    ${includeHeaderFooter ? `
    <div class="print-header">
      <span>${escapeHtml(docTitle)}</span>
      <span>${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>` : ''}

    <div class="print-content">
      ${content || '<p></p>'}
    </div>

    ${includeHeaderFooter ? `
    <div class="print-footer">
      <span>Microsoft Word 365</span>
      <span>Documento Oficial</span>
    </div>` : ''}
  </div>
</body>
</html>`;
}

export function printDocumentNative(
  title: string,
  content?: string,
  options?: NativePrintOptions
): boolean {
  const docHtml = generatePrintableHtml(title, content || '', options);

  try {
    // 1. Try printing through an isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'word-native-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc && iframe.contentWindow) {
      iframeDoc.open();
      iframeDoc.write(docHtml);
      iframeDoc.close();

      const executePrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (frameErr) {
          console.warn('Iframe print failed, falling back to window.print():', frameErr);
          window.focus();
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      };

      if (iframeDoc.readyState === 'complete') {
        setTimeout(executePrint, 150);
      } else {
        iframe.onload = executePrint;
        setTimeout(executePrint, 400);
      }
      return true;
    }
  } catch (err) {
    console.warn('Failed to setup print iframe, trying window.print():', err);
  }

  // Fallback direct window print
  try {
    const originalTitle = document.title;
    if (title) document.title = title;
    window.focus();
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
    return true;
  } catch (err2) {
    console.error('Direct window.print error:', err2);
    return false;
  }
}

/**
 * Helper to trigger browser file download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 250);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRtf(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

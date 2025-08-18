// Minimal HTML sanitizer that preserves essential inline styles used by the editor
// and strips dangerous tags/attributes/js URLs. No external deps.

const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'text-align',
  'font-weight',
  'font-style',
  'text-decoration',
]);

function sanitizeStyle(styleValue: string): string {
  // Split into declarations and filter allowed properties
  const declarations = styleValue
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);

  const safeDecls: string[] = [];
  for (const decl of declarations) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const valRaw = decl.slice(idx + 1).trim();

    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;

    // Basic value sanitation: allow hex/rgb/rgba/keywords and alignment keywords
    const safeVal = valRaw.replace(/[^#(),.%a-z0-9\s-]/gi, '').toLowerCase();

    // Extra guardrails for text-align
    if (prop === 'text-align' && !/^(left|right|center|justify)$/.test(safeVal)) continue;

    // Guard for color values (hex/rgb/rgba/named)
    if (
      (prop === 'color' || prop === 'background-color') &&
      !/^#([0-9a-f]{3}|[0-9a-f]{6})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|0?\.\d+|1)\s*\)$|^[a-z]+$/i.test(safeVal)
    ) {
      continue;
    }

    // Basic checks for font-weight and font-style and text-decoration
    if (prop === 'font-weight' && !/^(normal|bold|bolder|lighter|[1-9]00)$/.test(safeVal)) continue;
    if (prop === 'font-style' && !/^(normal|italic|oblique)$/.test(safeVal)) continue;
    if (prop === 'text-decoration' && !/^(none|underline|line-through|overline)$/.test(safeVal)) continue;

    safeDecls.push(`${prop}: ${safeVal}`);
  }

  return safeDecls.join('; ');
}

export default function sanitizeHtml(html: string): string {
  if (!html) return '';

  let out = html;

  // 1) Remove dangerous tags entirely
  out = out.replace(/<\/(?:script|style|iframe|object|embed)>/gi, '</removed>'); // close tags first to avoid nested tricks
  out = out.replace(/<(?:script|style|iframe|object|embed)([\s\S]*?)>([\s\S]*?)<\/\s*(?:removed)>/gi, '');
  out = out.replace(/<(?:script|style|iframe|object|embed)([\s\S]*?)>/gi, '');

  // 2) Remove event handlers (on*) and javascript: in href/src
  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '');
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '');

  // 3) Neutralize javascript: or data: URIs in href/src (allow http, https, mailto)
  out = out.replace(/\s(href|src)\s*=\s*"\s*(?!https?:|mailto:)[^"]*"/gi, (m: string) => {
    // allow empty, but disallow javascript: and other unknown schemes
    if (/javascript:|data:/i.test(m)) return ' '; 
    return m;
  });
  out = out.replace(/\s(href|src)\s*=\s*'\s*(?!https?:|mailto:)[^']*'/gi, (m: string) => {
    if (/javascript:|data:/i.test(m)) return ' ';
    return m;
  });

  // 4) Sanitize style attributes: only keep allowed properties
  out = out.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (match, p1) => {
    const safe = sanitizeStyle(p1 || '');
    return safe ? ` style="${safe}"` : '';
  });
  out = out.replace(/\sstyle\s*=\s*'([^']*)'/gi, (match, p1) => {
    const safe = sanitizeStyle(p1 || '');
    return safe ? ` style='${safe}'` : '';
  });

  // 5) Ensure rel attributes for target=_blank links
  out = out.replace(/<a([^>]*?)>/gi, (full: string, attrs: string) => {
    let newAttrs = attrs;

    // If target=_blank add rel noopener noreferrer
    const hasBlank = /target\s*=\s*[_"']?\s*_blank/i.test(newAttrs);
    if (hasBlank) {
      if (/\srel\s*=\s*/i.test(newAttrs)) {
        // append required rel values if missing
        newAttrs = newAttrs.replace(/rel\s*=\s*([\"'])((?:.|\n)*?)\1/i, (m: string, q: string, v: string) => {
          const set = new Set(v.split(/\s+/).filter(Boolean));
          set.add('noopener');
          set.add('noreferrer');
          return `rel=${q}${Array.from(set).join(' ')}${q}`;
        });
      } else {
        newAttrs += ' rel="noopener noreferrer"';
      }
    }

    return `<a${newAttrs}>`;
  });

  return out;
}

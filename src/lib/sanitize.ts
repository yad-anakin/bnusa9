import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param content - Raw HTML content
 * @returns Sanitized HTML content
 */
export function sanitizeContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'rel', 'target', 'style'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'div': ['class', 'style'],
      'span': ['class', 'style'],
      'p': ['class', 'style'],
      'blockquote': ['class', 'style'],
      'li': ['class', 'style'],
      'h1': ['class', 'style'],
      'h2': ['class', 'style'],
      'h3': ['class', 'style'],
      'h4': ['class', 'style'],
      'h5': ['class', 'style'],
      'h6': ['class', 'style']
    },
    allowedStyles: {
      '*': {
        // Allow text color as hex or rgb(...)
        'color': [
          /^#(?:[0-9a-fA-F]{3}){1,2}$/,
          /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/
        ],
        // Allow background color (for highlight)
        'background-color': [
          /^#(?:[0-9a-fA-F]{3}){1,2}$/,
          /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/
        ],
        // Alignment
        'text-align': [/^(left|right|center|justify)$/],
        // Basic decoration used by editor links
        'text-decoration': [/^(none|underline|line-through)$/]
      }
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    }
  });
}

/**
 * Sanitize plain text input
 * @param text - Raw text input
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize book/chapter data
 * @param data - Book or chapter data
 * @returns Sanitized data
 */
export function sanitizeBookData(data: any) {
  return {
    ...data,
    title: sanitizeText(data.title),
    description: sanitizeText(data.description),
    genre: sanitizeText(data.genre),
    content: data.content ? sanitizeContent(data.content) : undefined,
    author: data.author, // Preserve author data
    // Pass spotifyLink as trimmed plain text; server will validate domain/type
    spotifyLink: typeof data.spotifyLink === 'string' ? sanitizeText(data.spotifyLink) : undefined,
    // Pass arrays of links as trimmed strings; server will validate and cap lengths
    youtubeLinks: Array.isArray(data.youtubeLinks)
      ? data.youtubeLinks.map((u: any) => (typeof u === 'string' ? sanitizeText(u) : '')).filter(Boolean)
      : undefined,
    resourceLinks: Array.isArray(data.resourceLinks)
      ? data.resourceLinks
          .map((item: any) => {
            if (!item) return null;
            if (typeof item === 'string') {
              const url = sanitizeText(item);
              return url ? { name: '', url } : null;
            }
            if (typeof item === 'object') {
              const name = typeof item.name === 'string' ? sanitizeText(item.name) : '';
              const url = typeof item.url === 'string' ? sanitizeText(item.url) : '';
              if (!url) return null;
              return { name, url };
            }
            return null;
          })
          .filter(Boolean)
      : undefined
  };
}

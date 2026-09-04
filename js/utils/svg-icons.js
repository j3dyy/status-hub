/**
 * Status Radar - SVG Icon Library (Feather/Lucide style)
 */

export const icons = {
  checkCircle: (size = 18, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>`,

  alertTriangle: (size = 18, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,

  xCircle: (size = 18, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,

  wrench: (size = 18, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>`,

  refresh: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
    </svg>`,

  sun: (size = 18, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
    </svg>`,

  moon: (size = 18, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
    </svg>`,

  bell: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>`,

  search: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>`,

  calendar: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>`,

  chevronDown: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`,

  externalLink: (size = 14, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>`,

  layers: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>`,

  cpu: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>`,

  sparkles: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path>
    </svg>`,

  gemini: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"/>
    </svg>`,

  github: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>`,

  server: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>`,

  shield: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>`,

  zap: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>`,

  copy: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`,

  x: (size = 18, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`,

  gitlab: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="m22.65 14.39-2.43-7.49a.43.43 0 0 0-.82 0l-2.44 7.49H7.04L4.6 6.9a.43.43 0 0 0-.82 0L1.35 14.39a.84.84 0 0 0 .3.94l10.35 7.52 10.35-7.52a.84.84 0 0 0 .3-.94z"/>
    </svg>`,

  bitbucket: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.66 3h18.68a.66.66 0 0 1 .66.74L19.88 20.3a1.32 1.32 0 0 1-1.31 1.13H5.43a1.32 1.32 0 0 1-1.31-1.13L1.99 3.74A.66.66 0 0 1 2.66 3zm11.75 12.17h-4.82L8.5 9.42h7z"/>
    </svg>`,

  perplexity: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="2" x2="12" y2="22"></line>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line>
    </svg>`,

  huggingface: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-3.5 7a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 8.5 9zm7 0a1.5 1.5 0 1 1-1.5 1.5 1.5 1.5 0 0 1 1.5-1.5zm-3.5 9.5a5.5 5.5 0 0 1-4.9-3 1 1 0 0 1 1.74-1A3.5 3.5 0 0 0 12 16a3.5 3.5 0 0 0 3.16-1.5 1 1 0 1 1 1.74 1 5.5 5.5 0 0 1-4.9 3z"/>
    </svg>`,

  midjourney: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 19.5c5-2 15-2 20 0"></path>
      <path d="M4 14c4-1 12-1 16 0"></path>
      <path d="M12 2v14"></path>
      <path d="M12 2c3 4 5 7 5 11"></path>
    </svg>`,

  aws: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.8 14.9c-2.3 1.7-5.5 2.6-8.4 2.6-4 0-7.7-1.5-10.4-4-.2-.2 0-.5.2-.4 3 1.6 6.6 2.5 10.3 2.5 2.5 0 5.3-.6 7.8-1.9.4-.2.7.2.5.2zm1.6-1.1c-.3-.4-1.9-.2-2.9-.1-.3 0-.4-.2-.1-.4 1.7-1.2 4.4-.9 4.7-.5.3.4-.1 3.1-1.7 4.5-.2.2-.4.1-.3-.2.3-.9.6-2.9.3-3.3z"/>
      <path d="M11.9 6.2c-1.3 0-2.4.5-3.1 1.4-.2.2-.1.5.2.5l1.2-.2c.2 0 .4-.1.5-.3.4-.5 1-1 1.7-1 1.1 0 1.7.6 1.7 1.6v.5c-.8 0-1.8.1-2.7.4-1.7.5-2.5 1.5-2.5 2.8 0 1.5 1 2.4 2.4 2.4 1.1 0 2-.5 2.5-1.3v1.1c0 .2.2.3.4.3h1.2c.2 0 .4-.1.4-.4V9c0-1.9-1.2-2.8-3.4-2.8zm.5 5.8c-.4.5-1.1.8-1.7.8-.8 0-1.3-.4-1.3-1.1 0-.9.6-1.4 1.8-1.5.4 0 .8 0 1.2.1v1.7z"/>
    </svg>`,

  cloudflare: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.3 10.1a5.6 5.6 0 0 0-10.7-1.6A4.5 4.5 0 0 0 3 13a4.5 4.5 0 0 0 4.5 4.5h11A4.5 4.5 0 0 0 23 13a4.4 4.4 0 0 0-4.7-2.9z"/>
    </svg>`,

  gcp: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    </svg>`,

  azure: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.05 2.25 4.2 17.55h5.4L15.3 6.9zM8.55 19.8 13.95 9l5.85 10.8H8.55z"/>
    </svg>`,

  vercel: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 2 22 22 22"></polygon>
    </svg>`,

  docker: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3h3v3h-3zm-4 0h3v3H9zm-4 4h3v3H5zm4 0h3v3H9zm4 0h3v3h-3zm4 0h3v3h-3zm-12 4h3v3H5zm4 0h3v3H9zm4 0h3v3h-3zm4 0h3v3h-3zm4 0h3v3h-3zM2.5 15C3 18.5 6 21 11 21c7 0 10.5-4 11-7H2.5z"/>
    </svg>`,

  npmjs: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 1.5v21h21V1.5H1.5zm16.5 16.5h-3V7.5h-3V18h-6V6h12v12z"/>
    </svg>`,

  mongodb: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.5c-.4 1.6-4.5 6-4.5 11 0 4.2 2.6 7.4 4.5 9 1.9-1.6 4.5-4.8 4.5-9 0-5-4.1-9.4-4.5-11zm0 17.5v-15c.3 1.2 3.5 4.8 3.5 8.5 0 3.2-1.9 5.6-3.5 6.5z"/>
    </svg>`,

  sentry: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.2 2.2a1 1 0 0 0-1.4 0L9.4 4.6a1 1 0 0 0 0 1.4l1.3 1.3A8 8 0 1 0 18 14h2.5A10.5 10.5 0 1 1 12 1.5l1.2.7z"/>
    </svg>`,

  stripe: (size = 16, className = "") => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C17.767.807 15.42 0 12.543 0 7.234 0 3.344 2.81 3.344 7.604c0 4.961 4.234 6.789 7.822 8.043 2.184.782 2.912 1.488 2.912 2.455 0 .978-.85 1.545-2.274 1.545-2.35 0-5.321-1.12-7.14-2.173L3.75 23.05c2.196 1.053 5.097 1.677 8.167 1.677 5.753 0 9.774-2.738 9.774-7.653 0-5.023-4.234-6.848-7.715-7.924z"/>
    </svg>`
};

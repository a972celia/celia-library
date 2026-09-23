export const COVER_W = 178;

export const faceFont: Record<string, string> = {
  serif: "font-display",
  sans: "font-sans",
  mono: "font-mono",
};

export const finishSheen: Record<string, string> = {
  cloth:
    "linear-gradient(90deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 26%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.28) 100%)",
  gloss:
    "linear-gradient(90deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.1) 22%, rgba(255,255,255,0.22) 44%, rgba(0,0,0,0.2) 78%, rgba(0,0,0,0.34) 100%)",
  matte:
    "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.24) 100%)",
};

export const textureImage =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23t)' opacity='0.5'/%3E%3C/svg%3E\")";

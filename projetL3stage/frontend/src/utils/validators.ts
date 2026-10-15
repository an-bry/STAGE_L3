// ============================================
// CONSTANTES MÉTIER — NjCam / SMART TICKET
// ============================================

// Prix
export const PRIX_MIN = 100;
export const PRIX_MAX = 10_000_000;

// Quantités
export const QUANTITE_MIN = 1;
export const QUANTITE_MAX = 999;
export const UTILISATEURS_MIN = 1;
export const UTILISATEURS_MAX = 10_000;
export const STOCK_MIN = 0;

// Textes
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;
export const DIAGNOSTIC_MIN = 10;
export const DIAGNOSTIC_MAX = 2000;
export const JUSTIFICATION_MIN = 10;
export const JUSTIFICATION_MAX = 500;
export const NOM_PIECE_MIN = 2;
export const NOM_PIECE_MAX = 100;
export const REFERENCE_MAX = 50;
export const COMMENTAIRE_MIN = 2;
export const COMMENTAIRE_MAX = 1000;
export const TEXTE_LONG_MAX = 2000;

// Temps
export const TEMPS_PASSE_MIN = 1;
export const TEMPS_PASSE_MAX = 1440; // 24h
export const DUREE_ESTIMEE_MIN = 15;
export const DUREE_ESTIMEE_MAX = 480; // 8h

// ============================================
// TYPES
// ============================================
export type ValidationResult = string | null;

// ============================================
// HELPERS
// ============================================
const vide = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

// ============================================
// VALIDATORS — TEXTE
// ============================================

export function validateDescription(value: string): ValidationResult {
  if (vide(value)) return 'La description est obligatoire.';
  const len = value.trim().length;
  if (len < DESCRIPTION_MIN) return `La description doit contenir au moins ${DESCRIPTION_MIN} caractères.`;
  if (len > DESCRIPTION_MAX) return `La description ne peut pas dépasser ${DESCRIPTION_MAX} caractères.`;
  return null;
}

export function validateDiagnostic(value: string): ValidationResult {
  if (vide(value)) return 'Le diagnostic est obligatoire.';
  const len = value.trim().length;
  if (len < DIAGNOSTIC_MIN) return `Le diagnostic doit contenir au moins ${DIAGNOSTIC_MIN} caractères.`;
  if (len > DIAGNOSTIC_MAX) return `Le diagnostic ne peut pas dépasser ${DIAGNOSTIC_MAX} caractères.`;
  return null;
}

export function validateJustification(value: string): ValidationResult {
  if (vide(value)) return 'La justification est obligatoire.';
  const len = value.trim().length;
  if (len < JUSTIFICATION_MIN) return `La justification doit contenir au moins ${JUSTIFICATION_MIN} caractères.`;
  if (len > JUSTIFICATION_MAX) return `La justification ne peut pas dépasser ${JUSTIFICATION_MAX} caractères.`;
  return null;
}

export function validateNomPiece(value: string): ValidationResult {
  if (vide(value)) return 'Le nom de la pièce est obligatoire.';
  const len = value.trim().length;
  if (len < NOM_PIECE_MIN) return `Le nom doit contenir au moins ${NOM_PIECE_MIN} caractères.`;
  if (len > NOM_PIECE_MAX) return `Le nom ne peut pas dépasser ${NOM_PIECE_MAX} caractères.`;
  return null;
}

export function validateCommentaire(value: string): ValidationResult {
  if (vide(value)) return 'Le commentaire est obligatoire.';
  const len = value.trim().length;
  if (len < COMMENTAIRE_MIN) return `Le commentaire doit contenir au moins ${COMMENTAIRE_MIN} caractères.`;
  if (len > COMMENTAIRE_MAX) return `Le commentaire ne peut pas dépasser ${COMMENTAIRE_MAX} caractères.`;
  return null;
}

export function validateTexteOptionnel(value: string, max = TEXTE_LONG_MAX): ValidationResult {
  if (vide(value)) return null; // optionnel
  if (value.length > max) return `Le texte ne peut pas dépasser ${max} caractères.`;
  return null;
}

// ============================================
// VALIDATORS — NOMBRES
// ============================================

export function validatePrix(value: number | string): ValidationResult {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n) || n === null || n === undefined) return 'Le prix est obligatoire.';
  if (n < PRIX_MIN) return `Le prix minimum est de ${PRIX_MIN.toLocaleString('fr-FR')} Ar.`;
  if (n > PRIX_MAX) return `Le prix maximum est de ${PRIX_MAX.toLocaleString('fr-FR')} Ar.`;
  if (!Number.isInteger(n)) return 'Le prix doit être un nombre entier.';
  return null;
}

export function validateQuantite(value: number | string): ValidationResult {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'La quantité est obligatoire.';
  if (n < QUANTITE_MIN) return `La quantité minimum est de ${QUANTITE_MIN}.`;
  if (n > QUANTITE_MAX) return `La quantité maximum est de ${QUANTITE_MAX}.`;
  if (!Number.isInteger(n)) return 'La quantité doit être un nombre entier.';
  return null;
}

export function validateQuantiteVsStock(value: number | string, stock: number): ValidationResult {
  const base = validateQuantite(value);
  if (base) return base;
  const n = Number(value);
  if (n > stock) return `Stock insuffisant (disponible : ${stock}).`;
  return null;
}

export function validateNombreUtilisateurs(value: number | string): ValidationResult {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return "Le nombre d'utilisateurs est obligatoire.";
  if (n < UTILISATEURS_MIN) return `Minimum ${UTILISATEURS_MIN} utilisateur.`;
  if (n > UTILISATEURS_MAX) return `Maximum ${UTILISATEURS_MAX} utilisateurs.`;
  if (!Number.isInteger(n)) return 'Le nombre doit être un entier.';
  return null;
}

export function validateTempsPasse(value: number | string): ValidationResult {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'Le temps passé est obligatoire.';
  if (n < TEMPS_PASSE_MIN) return `Minimum ${TEMPS_PASSE_MIN} minute.`;
  if (n > TEMPS_PASSE_MAX) return `Maximum ${TEMPS_PASSE_MAX} minutes (24h).`;
  if (!Number.isInteger(n)) return 'Le temps doit être un entier (minutes).';
  return null;
}

export function validateDureeEstimee(value: number | string): ValidationResult {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'La durée estimée est obligatoire.';
  if (n < DUREE_ESTIMEE_MIN) return `Minimum ${DUREE_ESTIMEE_MIN} minutes.`;
  if (n > DUREE_ESTIMEE_MAX) return `Maximum ${DUREE_ESTIMEE_MAX} minutes (8h).`;
  if (!Number.isInteger(n)) return 'La durée doit être un entier (minutes).';
  return null;
}

// ============================================
// VALIDATORS — DATES
// ============================================

export function validateDatePassee(value: string | Date | null | undefined): ValidationResult {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date invalide.';
  if (d.getTime() > Date.now()) return 'La date ne peut pas être dans le futur.';
  return null;
}

export function validateDateFuture(value: string | Date | null | undefined): ValidationResult {
  if (!value) return 'La date est obligatoire.';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date invalide.';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d.getTime() < today.getTime()) return 'La date ne peut pas être dans le passé.';
  return null;
}

export function validateHeureFuture(
  date: string | Date,
  heure: string,
): ValidationResult {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 'Date invalide.';
  if (!heure || !/^\d{2}:\d{2}/.test(heure)) return 'Heure invalide.';
  const [h, m] = heure.split(':').map(Number);
  const dt = new Date(d);
  dt.setHours(h, m, 0, 0);
  if (dt.getTime() < Date.now()) return "L'heure ne peut pas être dans le passé.";
  return null;
}

// ============================================
// VALIDATORS — FORMAT
// ============================================

export function validateEmail(value: string): ValidationResult {
  if (vide(value)) return "L'email est obligatoire.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) return 'Email invalide.';
  return null;
}

export function validateTelephone(value: string): ValidationResult {
  if (vide(value)) return null; // optionnel
  const cleaned = value.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,15}$/.test(cleaned)) return 'Numéro de téléphone invalide.';
  return null;
}

export function validateReference(value: string): ValidationResult {
  if (vide(value)) return null; // optionnel
  if (value.length > REFERENCE_MAX) return `La référence ne peut pas dépasser ${REFERENCE_MAX} caractères.`;
  return null;
}

// ============================================
// HELPERS UI
// ============================================

/** Retourne true si au moins une erreur dans l'objet. */
export function hasErrors(errors: Record<string, ValidationResult>): boolean {
  return Object.values(errors).some((e) => e !== null);
}

/** Nettoie les erreurs null (utile pour l'affichage). */
export function cleanErrors<T extends Record<string, ValidationResult>>(errors: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in errors) {
    if (errors[key] !== null) out[key] = errors[key];
  }
  return out;
}

/** Compteur de caractères formaté. */
export function charCount(value: string, min: number, max: number): string {
  const len = value.trim().length;
  return `${len} / ${max} caractères${len < min ? ` (min ${min})` : ''}`;
}
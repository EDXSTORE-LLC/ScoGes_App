import type { Locale } from "@/types/foundation";
import type { FieldKey, SchoolKind } from "./registry";
const common = {
  title: ["Scolarité", "School administration"],
  create: ["Créer", "Create"],
  edit: ["Modifier", "Edit"],
  save: ["Enregistrer", "Save"],
  saved: ["Modification enregistrée.", "Changes saved."],
  invalid: ["Vérifiez les champs indiqués.", "Check the indicated fields."],
  denied: [
    "Vous ne disposez pas de la permission requise.",
    "You do not have the required permission.",
  ],
  unavailable: [
    "Le service est temporairement indisponible. Réessayez.",
    "The service is temporarily unavailable. Please retry.",
  ],
  failed: [
    "La modification a échoué. Aucune modification partielle enregistrée.",
    "The change failed. No partial change was saved.",
  ],
  conflict: [
    "Ce code ou cette inscription existe déjà, ou une autre année est active.",
    "This code or enrollment already exists, or another year is active.",
  ],
  stale: [
    "Les données ont changé. Rechargez avant de réessayer.",
    "The details have changed. Reload before retrying.",
  ],
  reference: [
    "Référence invalide, archivée ou incompatible avec l’année, le niveau ou la filière.",
    "The reference is invalid, archived or incompatible with the year, level or program.",
  ],
  immutable: [
    "Le code et les identifiants historiques ne peuvent pas être modifiés.",
    "The code and historical identifiers cannot be changed.",
  ],
  transition: [
    "Cette modification n’est pas autorisée pour ce statut historique.",
    "This change is not allowed for this historical status.",
  ],
  empty: ["Aucun enregistrement.", "No records."],
  search: ["Rechercher par code ou nom", "Search by code or name"],
  filter: ["Filtrer", "Filter"],
  all: ["Tous", "All"],
  previous: ["Précédent", "Previous"],
  next: ["Suivant", "Next"],
  history: ["Historique des inscriptions", "Enrollment history"],
  none: ["Aucune sélection", "No selection"],
  imports: ["Imports CSV / XLSX", "CSV / XLSX imports"],
  preview: ["Prévisualiser sans enregistrer", "Preview without saving"],
  commit: ["Importer les lignes valides", "Import valid rows"],
  file: ["Fichier CSV ou XLSX", "CSV or XLSX file"],
  kind: ["Type de données", "Record type"],
  row: ["Ligne", "Row"],
  result: ["Résultat", "Result"],
  ready: ["Valide", "Valid"],
  invalidRow: ["Ligne invalide", "Invalid row"],
  duplicate: [
    "Conflit : code ou lien déjà présent",
    "Conflict: code or link already exists",
  ],
  inserted: ["Créé", "Created"],
  template: [
    "Colonnes du modèle (codes stables pour les références)",
    "Template columns (stable codes for references)",
  ],
  expired: [
    "Aperçu expiré ou invalide. Prévisualisez à nouveau.",
    "Preview expired or invalid. Preview again.",
  ],
  limits: [
    "Limites : 2 Mio, 500 lignes. Aperçu valable 15 minutes. Aucun envoi de notification.",
    "Limits: 2 MiB, 500 rows. Preview valid for 15 minutes. No notifications are sent.",
  ],
  summary: ["Résumé de l’import", "Import summary"],
  reload: ["Recharger", "Reload"],
  archiveHint: [
    "L’archivage conserve les liens et l’historique. Les codes sont immuables.",
    "Archiving preserves links and history. Codes are immutable.",
  ],
  referenceLimit: [
    "Les listes de références affichent jusqu’à 500 éléments. Utilisez la recherche sur la page du référentiel pour vérifier le code.",
    "Reference lists show up to 500 records. Use search on the reference page to verify the code.",
  ],
} as const;
const entities: Record<SchoolKind, readonly [string, string]> = {
  years: ["Années scolaires", "Academic years"],
  programs: ["Filières", "Programs"],
  levels: ["Niveaux", "Levels"],
  classes: ["Classes / groupes", "Classes / groups"],
  terms: ["Périodes / trimestres / semestres", "Terms / semesters"],
  students: ["Élèves", "Students"],
  guardians: ["Tuteurs / responsables", "Guardians / responsible persons"],
  links: ["Liens élèves–tuteurs", "Student–guardian relationships"],
  enrollments: ["Inscriptions", "Enrollments"],
};
const fields: Record<FieldKey, readonly [string, string]> = {
  code: ["Code interne", "Internal code"],
  name: ["Nom", "Name"],
  status: ["Statut", "Status"],
  starts_on: ["Date de début", "Start date"],
  ends_on: ["Date de fin", "End date"],
  year_id: ["Année scolaire", "Academic year"],
  level_id: ["Niveau", "Level"],
  program_id: ["Filière", "Program"],
  class_id: ["Classe / groupe", "Class / group"],
  first_name: ["Prénom", "Given name"],
  last_name: ["Nom de famille", "Family name"],
  email: ["Adresse e-mail", "Email address"],
  phone: ["Téléphone", "Phone"],
  preferred_language: ["Langue préférée", "Preferred language"],
  birth_date: ["Date de naissance", "Date of birth"],
  notify_email: [
    "Préférence e-mail (ne vaut pas consentement)",
    "Email preference (does not constitute consent)",
  ],
  notify_sms: [
    "Préférence SMS (ne vaut pas consentement)",
    "SMS preference (does not constitute consent)",
  ],
  student_id: ["Élève", "Student"],
  guardian_id: ["Tuteur / responsable", "Guardian / responsible person"],
  relationship: ["Type de relation", "Relationship type"],
  primary_contact: ["Contact principal", "Primary contact"],
  billing_contact: [
    "Contact de facturation (information uniquement)",
    "Billing contact (metadata only)",
  ],
  contact_priority: ["Priorité de contact", "Contact priority"],
};
const statuses: Record<string, readonly [string, string]> = {
  active: ["Actif", "Active"],
  archived: ["Archivé", "Archived"],
  planned: ["Prévue", "Planned"],
  closed: ["Clôturée", "Closed"],
  draft: ["Brouillon", "Draft"],
  completed: ["Terminée", "Completed"],
  withdrawn: ["Retirée", "Withdrawn"],
  cancelled: ["Annulée", "Cancelled"],
  fr: ["Français", "French"],
  en: ["Anglais", "English"],
};
const at = (l: Locale) => (l === "fr" ? 0 : 1);
export const schoolText = (l: Locale, k: keyof typeof common) =>
  common[k][at(l)];
export const entityText = (l: Locale, k: SchoolKind) => entities[k][at(l)];
export const fieldText = (l: Locale, k: FieldKey) => fields[k][at(l)];
export const statusText = (l: Locale, k: string) => statuses[k]?.[at(l)] ?? k;
export type SchoolState = { ok: boolean; message?: string; fields?: string[] };
export function schoolError(
  l: Locale,
  error: { code?: string; message?: string } | null,
) {
  const m = error?.message;
  const key =
    error?.code === "23505"
      ? "conflict"
      : m === "stale_write"
        ? "stale"
        : m === "permission_denied"
          ? "denied"
          : m === "invalid_reference" || m === "term_outside_year"
            ? "reference"
            : m?.startsWith("immutable_")
              ? "immutable"
              : [
                    "invalid_transition",
                    "terminal_enrollment",
                    "historical_year",
                    "historical_class",
                  ].includes(m ?? "")
                ? "transition"
                : "failed";
  return schoolText(l, key);
}

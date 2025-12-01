// Fichier centralisé pour les constantes partagées
export const POPULAR_GENRES = [
  "Fiction",
  "Non-fiction",
  "Science-fiction",
  "Fantasy",
  "Romance",
  "Thriller",
  "Mystère",
  "Biographie",
  "Histoire",
  "Science",
  "Philosophie",
  "Art",
  "Cuisine",
  "Voyage",
  "Développement personnel",
  "Business",
  "Technologie",
  "Santé",
  "Sport",
  "Jeunesse",
  "Comics & Graphic Novels",
] as const

export const CONDITION_LABELS = {
  mint: "Neuf",
  good: "Bon",
  fair: "Correct",
  poor: "Usé",
} as const

// Couleurs de badge mises à jour pour la boîte de dialogue des détails
export const CONDITION_COLORS = {
  mint: "bg-green-600 text-white border-green-500",
  good: "bg-blue-600 text-white border-blue-500",
  fair: "bg-orange-600 text-white border-orange-500",
  poor: "bg-red-600 text-white border-red-500",
} as const

export const CONDITION_BADGE_COLORS = {
  mint: "bg-green-500",
  good: "bg-blue-500",
  fair: "bg-orange-500",
  poor: "bg-red-500",
} as const

// Fonction utilitaire pour normaliser les dates
export const normalizePublishedDate = (dateString?: string): string | undefined => {
  if (!dateString) return undefined

  // Si c'est juste une année (ex: "2023")
  if (/^\d{4}$/.test(dateString)) {
    return `${dateString}-01-01`
  }

  // Si c'est année-mois (ex: "2023-03")
  if (/^\d{4}-\d{2}$/.test(dateString)) {
    return `${dateString}-01`
  }

  // Si c'est déjà au format complet (ex: "2023-03-15") ou avec un timestamp
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.split("T")[0]
  }

  // Essayer de parser d'autres formats
  try {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]
    }
  } catch (error) {
    console.warn("Could not parse date:", dateString)
  }

  return undefined
}

// Fonction utilitaire pour obtenir la date locale au format YYYY-MM-DD
export const getLocalISODate = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Fonction utilitaire pour formater les dates d'affichage
export const formatDate = (dateString?: string, options?: { short?: boolean }): string | null => {
  if (!dateString) return null
  try {
    const formatOptions: Intl.DateTimeFormatOptions = options?.short
      ? { year: "numeric", month: "short", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric" }

    return new Date(dateString).toLocaleDateString("fr-FR", formatOptions)
  } catch {
    return dateString
  }
}

// Nouvelle fonction pour formater la date et l'heure
export function formatDateTime(dateString?: string): string {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch (e) {
    return dateString
  }
}

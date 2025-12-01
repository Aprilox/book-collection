export interface Book {
  id: string
  title: string
  author: string
  genre?: string
  series?: string
  universe?: string
  volume?: number
  publisher?: string
  pageCount?: number
  publishedDate?: string
  condition: "mint" | "good" | "fair" | "poor"
  isRead: boolean
  rating?: number // 1-5 stars
  notes?: string
  readDate?: string // YYYY-MM-DD
  thumbnail?: string
  addedDate?: string // YYYY-MM-DD
  description?: string // Ajouté pour les descriptions des livres
  content?: string // Nouveau : contenu inclus dans le livre (comics, chapitres, etc.)
}
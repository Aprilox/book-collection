// Configuration des APIs externes
export const API_CONFIG = {
  // Comic Vine nécessite une clé API gratuite
  // Inscription sur : https://comicvine.gamespot.com/api/
  COMIC_VINE_API_KEY: process.env.COMIC_VINE_API_KEY || "",

  // MangaDex est gratuit sans clé
  MANGADEX_BASE_URL: "https://api.mangadex.org",

  // Open Library est gratuit sans clé
  OPENLIBRARY_BASE_URL: "https://openlibrary.org",

  // Google Books est gratuit sans clé (avec limitations)
  GOOGLE_BOOKS_BASE_URL: "https://www.googleapis.com/books/v1",
}

// Types pour les différentes sources
export interface SearchResult {
  id: string
  title: string
  authors: string[]
  description?: string
  thumbnail?: string
  publishedDate?: string
  categories?: string[]
  pageCount?: number
  publisher?: string
  isbn?: string[]
  source: "google" | "openlibrary" | "comicvine" | "mangadex"
}

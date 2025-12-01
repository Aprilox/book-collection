"use client"

import { useState } from "react"
import { Search, Loader2, Calendar, User, Building, Hash, BookOpen, Star, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import BookImage from "@/components/book-image"
import { toast } from "@/hooks/use-toast"

interface GoogleBook {
  id: string
  _internalId?: string // Add an optional internal ID for React keys
  volumeInfo: {
    title: string
    authors?: string[]
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    publishedDate?: string
    categories?: string[]
    pageCount?: number
    language?: string
    publisher?: string
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    averageRating?: number
    ratingsCount?: number
  }
  _customData?: {
    series?: string
    volume?: number
  }
}

interface EnhancedBookSearchProps {
  onBookSelect: (book: GoogleBook) => void
  onManualEntry: () => void
}

interface SearchSource {
  id: string
  name: string
  description: string
  icon: string
}

const SEARCH_SOURCES: SearchSource[] = [
  {
    id: "bedetheque",
    name: "Bedetheque",
    description: "BD, comics (import par URL)",
    icon: "🦸‍♂️",
  },
  {
    id: "google",
    name: "Google Books",
    description: "Livres généralistes, romans, essais",
    icon: "📚",
  },
  {
    id: "openlibrary",
    name: "Open Library",
    description: "Base de données libre, plus complète",
    icon: "🏛️",
  },
  {
    id: "comicvine",
    name: "Comic Vine",
    description: "Comics, BD, graphic novels",
    icon: "💥",
  },
  {
    id: "mangadx",
    name: "MangaDex",
    description: "Mangas (cherchez l'image ailleurs)",
    icon: "🎌",
  },
]

export default function EnhancedBookSearch({ onBookSelect, onManualEntry }: EnhancedBookSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [authorSearch, setAuthorSearch] = useState("")
  const [publisherSearch, setPublisherSearch] = useState("")
  const [yearSearch, setYearSearch] = useState("")
  const [isbnSearch, setIsbnSearch] = useState("")
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [bedethequeUrl, setBedethequeUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [activeSearchTab, setActiveSearchTab] = useState("simple")
  const [selectedSource, setSelectedSource] = useState<string>("bedetheque")

  const handleBedethequeImport = async () => {
    if (!bedethequeUrl.trim() || (!bedethequeUrl.includes("bedetheque.com") && !bedethequeUrl.includes("bdgest.com"))) {
      toast({
        title: "URL invalide",
        description: "Veuillez coller une URL valide depuis Bedetheque ou BDGest.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      const response = await fetch(`/api/scrape-bedetheque?url=${encodeURIComponent(bedethequeUrl)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Impossible de récupérer les données.")
      }
      const bookData = await response.json()
      toast({
        title: "✅ Importation réussie !",
        description: `"${bookData.volumeInfo.title}" a été importé.`,
      })
      onBookSelect(bookData)
    } catch (error) {
      console.error("Erreur lors de l'importation Bedetheque:", error)
      toast({
        title: "❌ Erreur d'importation",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Fonction pour extraire l'URL de l'image depuis la description MangaDx
  const extractImageUrlFromDescription = (description?: string): string | null => {
    if (!description) return null
    const match = description.match(/https:\/\/uploads\.mangadex\.org\/covers\/[^\s]+/)
    return match ? match[0] : null
  }

  // Fonction pour détecter si c'est un ISBN
  const isISBN = (term: string): boolean => {
    const cleanTerm = term.replace(/[-\s]/g, "")
    return /^(97[89])?\d{9}[\dX]$/i.test(cleanTerm)
  }

  // Fonction pour nettoyer l'ISBN
  const cleanISBN = (isbn: string): string => {
    return isbn.replace(/[-\s]/g, "")
  }

  // Recherche simple avec source sélectionnée
  const performSimpleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      let results: GoogleBook[] = []

      switch (selectedSource) {
        case "google":
          results = await searchGoogleBooks(searchTerm)
          break
        case "openlibrary":
          results = await searchOpenLibrary(searchTerm)
          break
        case "comicvine":
          results = await searchComicVine(searchTerm)
          break
        case "mangadx":
          results = await searchMangaDx(searchTerm)
          break
        default:
          results = await searchGoogleBooks(searchTerm)
      }

      const processedResults = removeDuplicates(results).map((item: GoogleBook) => ({
        ...item,
        _internalId: item.id + "-" + Math.random().toString(36).substr(2, 9),
      }))

      setSearchResults(processedResults)
    } catch (error) {
      console.error("Erreur lors de la recherche:", error)
      setSearchResults([])
      toast({
        title: "❌ Erreur de recherche",
        description: `Impossible de rechercher sur ${SEARCH_SOURCES.find((s) => s.id === selectedSource)?.name}`,
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Recherche avancée
  const performAdvancedSearch = async () => {
    const searchParts = []

    if (searchTerm.trim()) {
      searchParts.push(`intitle:"${searchTerm.trim()}"`)
    }
    if (authorSearch.trim()) {
      searchParts.push(`inauthor:"${authorSearch.trim()}"`)
    }
    if (publisherSearch.trim()) {
      searchParts.push(`inpublisher:"${publisherSearch.trim()}"`)
    }
    if (isbnSearch.trim()) {
      const cleanedISBN = cleanISBN(isbnSearch.trim())
      searchParts.push(`isbn:${cleanedISBN}`)
    }

    if (searchParts.length === 0) return

    setIsSearching(true)
    try {
      let query = searchParts.join("+")

      if (yearSearch.trim()) {
        query += `&publishedDate=${yearSearch.trim()}`
      }

      const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=25&langRestrict=fr,en&orderBy=relevance`

      console.log("Recherche avancée:", apiUrl)

      const response = await fetch(apiUrl)
      const data = await response.json()

      let results = data.items || []

      if (yearSearch.trim()) {
        results = results.filter((book: GoogleBook) => {
          if (!book.volumeInfo.publishedDate) return false
          const bookYear = book.volumeInfo.publishedDate.substring(0, 4)
          return bookYear === yearSearch.trim()
        })
      }

      // Deduplicate and assign internal IDs
      const processedResults = removeDuplicates(results).map((item: GoogleBook) => ({
        ...item,
        _internalId: item.id + "-" + Math.random().toString(36).substr(2, 9),
      }))

      setSearchResults(processedResults)
    } catch (error) {
      console.error("Erreur lors de la recherche avancée:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Fonction pour éliminer les doublons évidents
  const removeDuplicates = (books: GoogleBook[]): GoogleBook[] => {
    const seen = new Map<string, GoogleBook>()

    books.forEach((book) => {
      const key = `${book.volumeInfo.title.toLowerCase()}-${book.volumeInfo.authors?.[0]?.toLowerCase() || "unknown"}`

      if (!seen.has(key)) {
        seen.set(key, book)
      } else {
        // Garder celui avec le plus d'informations (thumbnail, description, etc.)
        const existing = seen.get(key)!
        const currentScore = getBookInfoScore(book)
        const existingScore = getBookInfoScore(existing)

        if (currentScore > existingScore) {
          seen.set(key, book)
        }
      }
    })

    return Array.from(seen.values())
  }

  // Fonction de recherche Google Books (existante)
  const searchGoogleBooks = async (query: string): Promise<GoogleBook[]> => {
    const searchQuery = query.trim()
    let apiUrl = ""

    if (isISBN(searchQuery)) {
      const cleanedISBN = cleanISBN(searchQuery)
      console.log("Recherche ISBN détectée:", cleanedISBN)

      const isbnQueries = [`isbn:${cleanedISBN}`, `isbn:${searchQuery}`, cleanedISBN, searchQuery]

      for (const isbnQuery of isbnQueries) {
        console.log("Tentative avec:", isbnQuery)
        apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(isbnQuery)}&maxResults=15`

        const response = await fetch(apiUrl)
        const data = await response.json()

        if (data.items && data.items.length > 0) {
          console.log("Résultats trouvés avec:", isbnQuery)
          return data.items
        }
      }

      console.log("Aucun résultat avec ISBN, recherche générale...")
      return []
    } else {
      apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20&langRestrict=fr,en`

      const response = await fetch(apiUrl)
      const data = await response.json()
      return data.items || []
    }
  }

  // Fonction de recherche Open Library
  const searchOpenLibrary = async (query: string): Promise<GoogleBook[]> => {
    try {
      // Utiliser plusieurs endpoints pour plus de résultats
      const searchQueries = [
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15&lang=fr,en`,
        `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=10`,
        `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}&limit=10`,
      ]

      let allResults: any[] = []

      for (const apiUrl of searchQueries) {
        try {
          const response = await fetch(apiUrl)
          if (response.ok) {
            const data = await response.json()
            if (data.docs && data.docs.length > 0) {
              allResults = [...allResults, ...data.docs]
            }
          }
        } catch (error) {
          console.warn("Erreur sur une requête Open Library:", error)
        }
      }

      // Dédupliquer par clé unique
      const uniqueResults = allResults.reduce((acc, doc) => {
        const key = doc.key || `${doc.title}_${doc.author_name?.[0] || "unknown"}`
        if (!acc.has(key)) {
          acc.set(key, doc)
        }
        return acc
      }, new Map())

      return Array.from(uniqueResults.values())
        .slice(0, 20)
        .map((doc: any) => ({
          id: `ol_${doc.key?.replace("/works/", "") || Math.random().toString(36)}`,
          volumeInfo: {
            title: doc.title || "Titre inconnu",
            authors: doc.author_name || ["Auteur inconnu"],
            description: doc.first_sentence?.[0] || doc.subtitle || undefined,
            imageLinks: doc.cover_i
              ? {
                  thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
                  smallThumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`,
                }
              : undefined,
            publishedDate: doc.first_publish_year?.toString() || doc.publish_year?.[0]?.toString() || undefined,
            categories: doc.subject?.slice(0, 3) || doc.subject_facet?.slice(0, 3) || undefined,
            pageCount: doc.number_of_pages_median || doc.number_of_pages || undefined,
            publisher: doc.publisher?.[0] || doc.publish_place?.[0] || undefined,
            language: doc.language?.[0] || undefined,
            industryIdentifiers: doc.isbn
              ? doc.isbn.slice(0, 2).map((isbn: string) => ({
                  type: isbn.length === 13 ? "ISBN_13" : "ISBN_10",
                  identifier: isbn,
                }))
              : undefined,
          },
        }))
    } catch (error) {
      console.error("Erreur Open Library:", error)
      return []
    }
  }

  // Fonction de recherche Comic Vine via notre API
  const searchComicVine = async (query: string): Promise<GoogleBook[]> => {
    try {
      const response = await fetch(`/api/search-comicvine?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        console.warn("Comic Vine error:", data.error)
        return []
      }

      return data.results || []
    } catch (error) {
      console.error("Erreur Comic Vine:", error)
      return []
    }
  }

  // Fonction de recherche MangaDx
  const searchMangaDx = async (query: string): Promise<GoogleBook[]> => {
    try {
      const res = await fetch(`/api/search-mangadx?q=${encodeURIComponent(query)}`)
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      return data.results || []
    } catch (err) {
      console.error("Erreur MangaDx:", err)
      return []
    }
  }

  // Fonction pour scorer la qualité des informations d'un livre
  const getBookInfoScore = (book: GoogleBook): number => {
    let score = 0
    if (book.volumeInfo.imageLinks?.thumbnail) score += 2
    if (book.volumeInfo.description) score += 2
    if (book.volumeInfo.publishedDate) score += 1
    if (book.volumeInfo.pageCount) score += 1
    if (book.volumeInfo.publisher) score += 1
    if (book.volumeInfo.categories?.length) score += 1
    if (book.volumeInfo.averageRating) score += 1
    return score
  }

  // Fonction pour formater la date de publication
  const formatPublishedDate = (dateString?: string): string => {
    if (!dateString) return "Date inconnue"

    // Si c'est juste une année
    if (/^\d{4}$/.test(dateString)) {
      return dateString
    }

    // Si c'est année-mois
    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-")
      const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
      return `${monthNames[Number.parseInt(month) - 1]} ${year}`
    }

    // Date complète
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const handleSearch = () => {
    if (activeSearchTab === "simple") {
      performSimpleSearch()
    } else {
      performAdvancedSearch()
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setAuthorSearch("")
    setPublisherSearch("")
    setYearSearch("")
    setIsbnSearch("")
    setSearchResults([])
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeSearchTab} onValueChange={setActiveSearchTab}>
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="simple" className="data-[state=active]:bg-blue-500 text-white">
            Recherche Simple
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-500 text-white">
            Recherche Avancée
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simple" className="space-y-4">
          {/* Sélecteur de source */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {SEARCH_SOURCES.map((source) => (
              <Button
                key={source.id}
                variant="outline"
                size="sm"
                onClick={() => setSelectedSource(source.id)}
                className={
                  selectedSource === source.id
                    ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                    : "border-slate-600 text-slate-300 hover:bg-slate-700 bg-slate-800"
                }
              >
                <span className="mr-2">{source.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-xs">{source.name}</div>
                </div>
              </Button>
            ))}
          </div>

          {/* Description de la source sélectionnée */}
          <div className="text-center p-2 bg-slate-700 rounded-lg">
            <p className="text-slate-300 text-sm">
              <span className="font-medium">{SEARCH_SOURCES.find((s) => s.id === selectedSource)?.name}</span>
              {" - "}
              {SEARCH_SOURCES.find((s) => s.id === selectedSource)?.description}
            </p>
            {selectedSource === "mangadx" && (
              <p className="text-orange-300 text-xs mt-1">
                ⚠️ Pour les mangas, vous pourrez voir l'image de référence puis chercher une image similaire sur Google
                Images ou d'autres sites.
              </p>
            )}
          </div>

          {selectedSource !== "bedetheque" && (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={`Rechercher sur ${SEARCH_SOURCES.find((s) => s.id === selectedSource)?.name}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchTerm.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Indication du type de recherche */}
              {searchTerm && (
                <div className="text-xs text-slate-400">
                  {selectedSource === "google" && isISBN(searchTerm) ? (
                    <span className="text-blue-400">🔍 Recherche par ISBN sur Google Books</span>
                  ) : (
                    <span>🔍 Recherche sur {SEARCH_SOURCES.find((s) => s.id === selectedSource)?.name}</span>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title-search">Titre</Label>
              <Input
                id="title-search"
                placeholder="Titre du livre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author-search">Auteur</Label>
              <Input
                id="author-search"
                placeholder="Nom de l'auteur..."
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher-search">Éditeur</Label>
              <Input
                id="publisher-search"
                placeholder="Nom de l'éditeur..."
                value={publisherSearch}
                onChange={(e) => setPublisherSearch(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-search">Année de publication</Label>
              <Input
                id="year-search"
                placeholder="ex: 2023"
                value={yearSearch}
                onChange={(e) => setYearSearch(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="isbn-search">ISBN</Label>
              <Input
                id="isbn-search"
                placeholder="ISBN avec ou sans tirets..."
                value={isbnSearch}
                onChange={(e) => setIsbnSearch(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSearch}
              disabled={
                isSearching ||
                (!searchTerm.trim() && !authorSearch.trim() && !publisherSearch.trim() && !isbnSearch.trim())
              }
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Rechercher
            </Button>
            <Button
              variant="outline"
              onClick={clearSearch}
              className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
            >
              Effacer
            </Button>
          </div>

          <div className="text-xs text-slate-400">
            💡 <strong>Astuce :</strong> Utilisez plusieurs critères pour des résultats plus précis. La recherche
            avancée élimine automatiquement les doublons évidents.
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={onManualEntry}
          className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
        >
          Ajouter manuellement
        </Button>
      </div>

      {selectedSource === "bedetheque" ? (
        <div className="space-y-4 pt-4">
          <div className="p-4 bg-slate-700 rounded-lg space-y-3">
            <h3 className="font-semibold text-white">Importer depuis Bedetheque / BDGest</h3>
            <p className="text-sm text-slate-300">
              1. Utilisez le site ci-dessous pour trouver la page de votre album.
            </p>
            <p className="text-sm text-slate-300">
              2. Copiez l'URL de la page de l'album (ex:{" "}
              <code className="text-xs bg-slate-800 p-1 rounded">
                https://www.bedetheque.com/BD-Batman-Le-Soir-Tome-1-Annee-un-238745.html
              </code>
              ).
            </p>
            <p className="text-sm text-slate-300">3. Collez l'URL ci-dessous et cliquez sur "Importer".</p>
            <div className="flex gap-2">
              <Input
                placeholder="Collez l'URL de la page de l'album ici..."
                value={bedethequeUrl}
                onChange={(e) => setBedethequeUrl(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
              <Button onClick={handleBedethequeImport} disabled={isImporting || !bedethequeUrl.trim()}>
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importer"}
              </Button>
            </div>
          </div>
          <div className="h-96 md:aspect-video w-full bg-slate-800 rounded-lg overflow-hidden">
            <iframe
              src="https://www.bedetheque.com/search/"
              className="w-full h-full border-0"
              title="Bedetheque Search"
              sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts"
            />
          </div>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Résultats de recherche :</h3>
            <Badge variant="outline" className="border-slate-500 text-slate-300">
              {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {searchResults.map((book) => {
              const imageUrl = extractImageUrlFromDescription(book.volumeInfo.description)
              const isMangaDx = book.id.startsWith("md_")

              return (
                <Card
                  key={book._internalId || book.id}
                  className="bg-slate-700 border-slate-600 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => onBookSelect(book)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-16 h-20 bg-slate-600 rounded flex-shrink-0 flex items-center justify-center">
                        {book.volumeInfo.imageLinks?.thumbnail ? (
                          <BookImage
                            src={book.volumeInfo.imageLinks.thumbnail}
                            alt={book.volumeInfo.title}
                            className="w-16 h-20 bg-slate-600 rounded flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-center">
                            <span className="text-2xl mb-1 block">{isMangaDx ? "🎌" : "📚"}</span>
                            <span className="text-xs text-slate-400">{isMangaDx ? "Manga" : "Pas d'image"}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2 text-white">{book.volumeInfo.title}</h4>
                          <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                            <User className="w-3 h-3" />
                            <span>{book.volumeInfo.authors?.[0] || "Auteur inconnu"}</span>
                          </div>
                        </div>

                        {/* Bouton pour voir le livre sur MangaDx */}
                        {isMangaDx && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                const mangaId = book.id.replace("md_", "")
                                window.open(`https://mangadx.org/title/${mangaId}`, "_blank")
                              }}
                              className="text-xs border-orange-500 text-orange-300 hover:bg-orange-500/20 bg-orange-500/10"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Voir sur MangaDex
                            </Button>
                            <span className="text-xs text-slate-400">
                              (puis cherchez une image similaire sur Google Images)
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {book.volumeInfo.publisher && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Building className="w-3 h-3" />
                              <span className="truncate">{book.volumeInfo.publisher}</span>
                            </div>
                          )}
                          {book.volumeInfo.publishedDate && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span>{formatPublishedDate(book.volumeInfo.publishedDate)}</span>
                            </div>
                          )}
                          {book.volumeInfo.pageCount && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <BookOpen className="w-3 h-3" />
                              <span>{book.volumeInfo.pageCount} pages</span>
                            </div>
                          )}
                          {book.volumeInfo.averageRating && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Star className="w-3 h-3" />
                              <span>
                                {book.volumeInfo.averageRating}/5 ({book.volumeInfo.ratingsCount || 0})
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {/* Afficher l'ISBN si disponible */}
                          {book.volumeInfo.industryIdentifiers && (
                            <div className="flex gap-1">
                              {book.volumeInfo.industryIdentifiers
                                .filter((id) => id.type.includes("ISBN"))
                                .slice(0, 1)
                                .map((isbn, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs border-blue-500 text-blue-300"
                                  >
                                    <Hash className="w-2 h-2 mr-1" />
                                    {isbn.identifier}
                                  </Badge>
                                ))}
                            </div>
                          )}
                          {book.volumeInfo.categories && (
                            <div className="flex gap-1">
                              {book.volumeInfo.categories.slice(0, 2).map((category, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs border-slate-500 text-slate-300"
                                >
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {isMangaDx && (
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-300">
                              🎌 MangaDex
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : searchTerm && !isSearching && searchResults.length === 0 && selectedSource !== "bedetheque" ? (
        <div className="text-center p-4 bg-slate-700 rounded-lg">
          <p className="text-slate-300 mb-2">Aucun résultat trouvé</p>
          <p className="text-slate-400 text-sm mb-3">
            {activeSearchTab === "simple"
              ? isISBN(searchTerm)
                ? "Cet ISBN n'a pas été trouvé dans Google Books. Le livre n'est peut-être pas référencé."
                : "Essayez avec des mots-clés différents ou utilisez la recherche avancée."
              : "Essayez de modifier vos critères de recherche ou utilisez moins de filtres."}
          </p>
          <Button
            variant="outline"
            onClick={onManualEntry}
            className="border-slate-600 text-white hover:bg-slate-700 bg-transparent"
          >
            Ajouter manuellement
          </Button>
        </div>
      ) : null}
    </div>
  )
}

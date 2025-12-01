"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Book } from "@/types/book"
import EnhancedBookSearch from "@/components/enhanced-book-search"
import BookImage from "@/components/book-image"
import SeriesCombobox from "@/components/series-combobox"
import { POPULAR_GENRES, normalizePublishedDate } from "@/lib/constants"

interface AddBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBook: (book: Book) => void
  availableSeries: string[]
  availableUniverses: string[]
  isPending: boolean
  getSeriesForUniverse: (universe?: string) => string[]
}

interface GoogleBook {
  id: string
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
  }
  _customData?: {
    series?: string
    volume?: number
    universe?: string
  }
}

export default function AddBookDialog({
  open,
  onOpenChange,
  onAddBook,
  availableSeries,
  availableUniverses,
  isPending,
  getSeriesForUniverse,
}: AddBookDialogProps) {
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [bookData, setBookData] = useState<Partial<Book>>({
    title: "",
    author: "",
    genre: "Fiction",
    series: "",
    universe: "",
    volume: undefined,
    condition: "good",
    isRead: false,
    rating: undefined,
    notes: "",
    readDate: undefined,
    publishedDate: undefined,
    thumbnail: "",
    content: "",
  })

  const selectBook = (book: GoogleBook) => {
    setSelectedBook(book)
    const primaryCategory = book.volumeInfo.categories?.[0] || ""
    const betterThumbnail =
      book.volumeInfo.imageLinks?.thumbnail?.replace("&zoom=1", "&zoom=0") ||
      book.volumeInfo.imageLinks?.smallThumbnail?.replace("&zoom=1", "&zoom=0")

    const normalizedDate = normalizePublishedDate(book.volumeInfo.publishedDate)
    const genreToSet = POPULAR_GENRES.includes(primaryCategory as any) ? primaryCategory : "Fiction"

    // Check for custom data from scraper (e.g., Bedetheque)
    const customData = book._customData

    setBookData({
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors?.[0] || "Auteur inconnu",
      genre: genreToSet,
      publisher: book.volumeInfo.publisher,
      pageCount: book.volumeInfo.pageCount,
      publishedDate: normalizedDate,
      thumbnail: betterThumbnail,
      condition: "good",
      isRead: false,
      rating: undefined,
      notes: "",
      readDate: undefined,
      series: customData?.series || "",
      universe: customData?.universe || "",
      volume: customData?.volume,
      description: book.volumeInfo.description,
      content: "",
    })
  }

  useEffect(() => {
    if (bookData.universe !== undefined) {
      const availableSeriesForUniverse = getSeriesForUniverse(bookData.universe)
      if (bookData.series && !availableSeriesForUniverse.includes(bookData.series)) {
        setBookData((prev) => ({ ...prev, series: "" }))
      }
    }
  }, [bookData.universe, getSeriesForUniverse])

  const handleAddBook = async () => {
    if (!bookData.title?.trim() || !bookData.author?.trim() || isPending) return

    const newBook: Book = {
      id: "",
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      genre: bookData.genre,
      series: bookData.series && bookData.series.trim() !== "" ? bookData.series.trim() : undefined,
      universe: bookData.universe && bookData.universe.trim() !== "" ? bookData.universe.trim() : undefined,
      volume: bookData.volume,
      publisher: bookData.publisher?.trim() || undefined,
      pageCount: bookData.pageCount,
      publishedDate: bookData.publishedDate,
      condition: bookData.condition || "good",
      isRead: bookData.isRead || false,
      rating: bookData.rating,
      notes: bookData.notes?.trim() || undefined,
      readDate: bookData.readDate,
      thumbnail: bookData.thumbnail && bookData.thumbnail.trim() !== "" ? bookData.thumbnail.trim() : undefined,
      addedDate: undefined,
      description: bookData.description?.trim() || undefined,
      content: bookData.content?.trim() || undefined,
    }

    await onAddBook(newBook)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setSelectedBook(null)
    setIsManualEntry(false)
    setBookData({
      title: "",
      author: "",
      genre: "Fiction",
      series: "",
      universe: "",
      volume: undefined,
      condition: "good",
      isRead: false,
      rating: undefined,
      notes: "",
      readDate: undefined,
      publishedDate: undefined,
      thumbnail: "",
      description: "",
      content: "",
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-50">Ajouter un livre à ma bibliothèque</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedBook && !isManualEntry && (
            <EnhancedBookSearch onBookSelect={selectBook} onManualEntry={() => setIsManualEntry(true)} />
          )}

          {(selectedBook || isManualEntry) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBook(null)
                    setIsManualEntry(false)
                    resetForm()
                  }}
                  className="border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
                >
                  ← Retour
                </Button>
                <h3 className="font-semibold text-slate-50">{selectedBook ? "Livre sélectionné" : "Ajout manuel"}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-200">
                    Titre *
                  </Label>
                  <Input
                    id="title"
                    value={bookData.title || ""}
                    onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author" className="text-slate-200">
                    Auteur *
                  </Label>
                  <Input
                    id="author"
                    value={bookData.author || ""}
                    onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-slate-200">
                  URL de l'image (optionnel)
                </Label>
                <Input
                  id="thumbnail"
                  value={bookData.thumbnail || ""}
                  onChange={(e) => setBookData({ ...bookData, thumbnail: e.target.value })}
                  placeholder="Collez l'URL de l'image de couverture ici"
                  className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                />
                {bookData.thumbnail && bookData.thumbnail.trim() !== "" && (
                  <div className="mt-2">
                    <p className="text-sm text-slate-300 mb-2">Aperçu de l'image :</p>
                    <BookImage
                      src={bookData.thumbnail}
                      alt="Aperçu de la couverture"
                      className="max-w-[120px] h-auto rounded-md border border-slate-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre" className="text-slate-200">
                    Genre
                  </Label>
                  <Select
                    value={bookData.genre || "Fiction"}
                    onValueChange={(value) => setBookData({ ...bookData, genre: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400">
                      <SelectValue placeholder="Sélectionner un genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-500 max-h-60 text-slate-100">
                      {POPULAR_GENRES.map((genre) => (
                        <SelectItem
                          key={genre}
                          value={genre}
                          className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100"
                        >
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher" className="text-slate-200">
                    Éditeur
                  </Label>
                  <Input
                    id="publisher"
                    value={bookData.publisher || ""}
                    onChange={(e) => setBookData({ ...bookData, publisher: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="universe" className="text-slate-200">
                  Univers (optionnel)
                </Label>
                <SeriesCombobox
                  series={availableUniverses}
                  selectedSeries={bookData.universe}
                  onSeriesChange={(value) => setBookData({ ...bookData, universe: value })}
                  placeholder="Sélectionner ou créer un univers..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="series" className="text-slate-200">
                  Série (optionnel)
                </Label>
                <SeriesCombobox
                  series={getSeriesForUniverse(bookData.universe)}
                  selectedSeries={bookData.series}
                  onSeriesChange={(value) => setBookData({ ...bookData, series: value })}
                  placeholder="Sélectionner ou créer une série..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume" className="text-slate-200">
                    Tome/Numéro
                  </Label>
                  <Input
                    id="volume"
                    type="number"
                    min="1"
                    value={bookData.volume || ""}
                    onChange={(e) => setBookData({ ...bookData, volume: Number.parseInt(e.target.value) || undefined })}
                    placeholder="1, 2, 3..."
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition" className="text-slate-200">
                    État
                  </Label>
                  <Select
                    value={bookData.condition}
                    onValueChange={(value) => setBookData({ ...bookData, condition: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
                      <SelectItem value="mint" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                        Neuf
                      </SelectItem>
                      <SelectItem value="good" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                        Bon
                      </SelectItem>
                      <SelectItem value="fair" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                        Correct
                      </SelectItem>
                      <SelectItem value="poor" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                        Usé
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageCount" className="text-slate-200">
                    Nombre de pages
                  </Label>
                  <Input
                    id="pageCount"
                    type="number"
                    min="1"
                    value={bookData.pageCount || ""}
                    onChange={(e) =>
                      setBookData({ ...bookData, pageCount: Number.parseInt(e.target.value) || undefined })
                    }
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedDate" className="text-slate-200">
                    Date de publication
                  </Label>
                  <Input
                    id="publishedDate"
                    type="date"
                    value={bookData.publishedDate || ""}
                    onChange={(e) => setBookData({ ...bookData, publishedDate: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating" className="text-slate-200">
                    Note (1-5)
                  </Label>
                  <Select
                    value={bookData.rating?.toString() || "0"}
                    onValueChange={(value) =>
                      setBookData({ ...bookData, rating: value && value !== "0" ? Number.parseInt(value) : undefined })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400">
                      <SelectValue placeholder="Aucune note" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
                      <SelectItem value="0" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                        Aucune note
                      </SelectItem>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem
                          key={rating}
                          value={rating.toString()}
                          className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100"
                        >
                          {rating} étoile{rating > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="readDate" className="text-slate-200">
                    Date de lecture
                  </Label>
                  <Input
                    id="readDate"
                    type="date"
                    value={bookData.readDate || ""}
                    onChange={(e) => setBookData({ ...bookData, readDate: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">
                  Description du livre
                </Label>
                <Textarea
                  id="description"
                  value={bookData.description || ""}
                  onChange={(e) => setBookData({ ...bookData, description: e.target.value })}
                  placeholder="Résumé, synopsis, description du contenu..."
                  className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-200">
                  Contenu inclus
                </Label>
                <Textarea
                  id="content"
                  value={bookData.content || ""}
                  onChange={(e) => setBookData({ ...bookData, content: e.target.value })}
                  placeholder="Ex: Batman #1-12, Detective Comics #27-30, Action Comics #1..."
                  className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                  rows={3}
                />
                <p className="text-xs text-slate-400">
                  💡 Listez les comics, chapitres ou numéros inclus dans ce livre. Cela vous aidera à éviter les
                  doublons lors de vos recherches.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-200">
                  Notes personnelles
                </Label>
                <Textarea
                  id="notes"
                  value={bookData.notes || ""}
                  onChange={(e) => setBookData({ ...bookData, notes: e.target.value })}
                  placeholder="Vos impressions, commentaires, citations favorites..."
                  className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRead"
                  checked={bookData.isRead}
                  onCheckedChange={(checked) => setBookData({ ...bookData, isRead: checked as boolean })}
                />
                <Label htmlFor="isRead" className="text-slate-200">
                  J'ai déjà lu ce livre
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddBook}
                  disabled={isPending || !bookData.title?.trim() || !bookData.author?.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white hover:text-slate-50"
                >
                  {isPending ? (
                    "Ajout en cours..."
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter à ma bibliothèque
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

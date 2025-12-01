"use client"

import { useState, useEffect } from "react"
import {
  MoreVertical,
  Edit,
  Eye,
  EyeOff,
  Star,
  Calendar,
  User,
  BookOpen,
  Hash,
  Trash2,
  Check,
  X,
  Globe,
  Library,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Book } from "@/types/book"
import BookImage from "@/components/book-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import BookDetailsDialog from "@/components/book-details-dialog"
import SeriesCombobox from "@/components/series-combobox"
import { POPULAR_GENRES, CONDITION_LABELS, CONDITION_COLORS, getLocalISODate, formatDate } from "@/lib/constants"

interface BookCardProps {
  book: Book
  onUpdate: (book: Book) => void
  onDelete: (id: string) => void
  availableSeries: string[]
  availableUniverses: string[]
  isPending?: boolean
  getSeriesForUniverse: (universe?: string) => string[]
}

export default function BookCard({
  book,
  onUpdate,
  onDelete,
  availableSeries,
  availableUniverses,
  isPending = false,
  getSeriesForUniverse,
}: BookCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [editedBook, setEditedBook] = useState<Book>({ ...book })
  const [ratingBook, setRatingBook] = useState<Book | null>(null)
  const [tempRating, setTempRating] = useState<number>(0)
  const [showRemoveRatingDialog, setShowRemoveRatingDialog] = useState(false)

  // Reset series when universe changes in edit mode
  useEffect(() => {
    if (editedBook.universe !== undefined) {
      const availableSeriesForUniverse = getSeriesForUniverse(editedBook.universe)
      if (editedBook.series && !availableSeriesForUniverse.includes(editedBook.series)) {
        setEditedBook((prev) => ({ ...prev, series: "" }))
      }
    }
  }, [editedBook.universe, getSeriesForUniverse])

  const toggleReadStatus = () => {
    if (book.isRead && book.rating) {
      // Si le livre est lu et a une note, demander si on doit retirer la note
      setShowRemoveRatingDialog(true)
    } else {
      // Sinon, procéder normalement
      const updatedBook = {
        ...book,
        isRead: !book.isRead,
        readDate: !book.isRead ? getLocalISODate(new Date()) : undefined,
      }
      onUpdate(updatedBook)

      // Si on vient de marquer comme lu, proposer de noter (même s'il y a déjà une note)
      if (!book.isRead) {
        setRatingBook(updatedBook)
        setTempRating(updatedBook.rating || 0) // Pré-remplir avec la note existante ou 0
      }
    }
  }

  const handleRemoveRatingConfirm = (removeRating: boolean) => {
    const updatedBook = {
      ...book,
      isRead: false,
      readDate: undefined,
      rating: removeRating ? undefined : book.rating,
    }
    onUpdate(updatedBook)
    setShowRemoveRatingDialog(false)
  }

  const handleSaveRating = async () => {
    if (!ratingBook || tempRating === 0) return

    const updatedBook = { ...ratingBook, rating: tempRating }
    onUpdate(updatedBook)
    setRatingBook(null)
    setTempRating(0)
  }

  const handleSkipRating = () => {
    setRatingBook(null)
    setTempRating(0)
  }

  const getConditionLabel = (condition?: string) => {
    return CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS] || condition
  }

  const getConditionColor = (condition?: string) => {
    return (
      CONDITION_COLORS[condition as keyof typeof CONDITION_COLORS] ||
      "bg-slate-500/20 text-slate-200 border-slate-500/30"
    )
  }

  const handleSave = () => {
    const bookToSave = {
      ...editedBook,
      title: editedBook.title.trim(),
      author: editedBook.author.trim(),
      series: editedBook.series && editedBook.series.trim() !== "" ? editedBook.series.trim() : undefined,
      universe: editedBook.universe && editedBook.universe.trim() !== "" ? editedBook.universe.trim() : undefined,
      thumbnail: editedBook.thumbnail && editedBook.thumbnail.trim() !== "" ? editedBook.thumbnail.trim() : undefined,
      notes: editedBook.notes && editedBook.notes.trim() !== "" ? editedBook.notes.trim() : undefined,
      publisher: editedBook.publisher && editedBook.publisher.trim() !== "" ? editedBook.publisher.trim() : undefined,
      readDate: editedBook.isRead ? editedBook.readDate : undefined,
      description:
        editedBook.description && editedBook.description.trim() !== "" ? editedBook.description.trim() : undefined,
      content: editedBook.content && editedBook.content.trim() !== "" ? editedBook.content.trim() : undefined,
    }
    onUpdate(bookToSave)
    setIsEditOpen(false)
  }

  const handleDeleteClick = () => {
    setIsMenuOpen(false)
    setShowDeleteConfirmation(true)
  }

  const confirmDelete = () => {
    onDelete(book.id)
    setShowDeleteConfirmation(false)
  }

  const cancelDelete = () => {
    setShowDeleteConfirmation(false)
  }

  // Fonction pour tronquer le texte
  const truncateText = (text: string, maxLength = 40): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <Card className="bg-slate-800 border-slate-600 hover:border-slate-500 transition-colors group">
      <CardContent className="p-4 flex flex-col">
        <div className="flex gap-4 flex-1 cursor-pointer" onClick={() => setIsDetailsDialogOpen(true)}>
          <div className="flex-shrink-0">
            <BookImage src={book.thumbnail} alt={book.title} className="w-20 h-28" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-50 text-lg line-clamp-2 leading-tight">{book.title}</h3>
                <div className="flex items-center gap-1 text-slate-300 mt-1">
                  <User className="w-3 h-3" />
                  <span className="text-sm">{book.author}</span>
                </div>
              </div>

              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isPending || showDeleteConfirmation}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleReadStatus()
                    }}
                    className="text-slate-200 hover:text-slate-50 hover:bg-slate-700 focus:bg-slate-700 focus:text-slate-50"
                  >
                    {book.isRead ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Marquer comme non lu
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Marquer comme lu
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditedBook({ ...book })
                      setIsEditOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="text-slate-200 hover:text-slate-50 hover:bg-slate-700 focus:bg-slate-700 focus:text-slate-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-600" />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick()
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-2">
              {book.genre && (
                <Badge variant="outline" className="text-xs border-slate-500 text-slate-200">
                  {book.genre}
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs ${getConditionColor(book.condition)}`}>
                {getConditionLabel(book.condition)}
              </Badge>
              {book.isRead && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-200">
                  <Eye className="w-2 h-2 mr-1" />
                  Lu
                </Badge>
              )}
              {book.universe && (
                <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-200">
                  <Globe className="w-2 h-2 mr-1" />
                  {book.universe}
                </Badge>
              )}
              {book.series && (
                <Badge variant="outline" className="text-xs border-indigo-500 text-indigo-200">
                  <Library className="w-2 h-2 mr-1" />
                  {book.series} {book.volume && `#${book.volume}`}
                </Badge>
              )}
              {book.volume && !book.series && (
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-200">
                  Tome {book.volume}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              {book.publisher && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span className="truncate">{book.publisher}</span>
                </div>
              )}
              {book.publishedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(book.publishedDate, { short: true })}</span>
                </div>
              )}
              {book.pageCount && (
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span>{book.pageCount} pages</span>
                </div>
              )}
              {book.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{book.rating}/5</span>
                </div>
              )}
            </div>

            {book.notes && <div className="text-xs text-slate-300 line-clamp-2 italic">"{book.notes}"</div>}
          </div>
        </div>

        {showDeleteConfirmation && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4 p-2 bg-red-900/20 border border-red-700 rounded-md w-full justify-center">
            <Button
              size="sm"
              onClick={confirmDelete}
              className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Check className="w-3 h-3 mr-1" />
              Confirmer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelDelete}
              className="w-full sm:flex-1 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
            >
              <X className="w-3 h-3 mr-1" />
              Annuler
            </Button>
          </div>
        )}

        {/* Dialog de notation après lecture */}
        <Dialog open={!!ratingBook} onOpenChange={() => setRatingBook(null)}>
          <DialogContent className="bg-slate-800 border-slate-600 text-slate-50">
            <DialogHeader>
              <DialogTitle className="text-slate-50 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Noter votre lecture
              </DialogTitle>
            </DialogHeader>
            {ratingBook && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-50 mb-2 px-4" title={ratingBook.title}>
                    "{truncateText(ratingBook.title, 60)}"
                  </h3>
                  <p className="text-slate-300 text-sm">Vous venez de terminer ce livre ! Souhaitez-vous le noter ?</p>
                </div>

                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setTempRating(rating)}
                      className={`p-2 rounded-full transition-colors ${
                        tempRating >= rating
                          ? "text-yellow-400 hover:text-yellow-300"
                          : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Star className={`w-8 h-8 ${tempRating >= rating ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>

                {tempRating > 0 && (
                  <div className="text-center text-slate-300">
                    {tempRating === 1 && "Décevant"}
                    {tempRating === 2 && "Moyen"}
                    {tempRating === 3 && "Correct"}
                    {tempRating === 4 && "Très bien"}
                    {tempRating === 5 && "Excellent !"}
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleSkipRating}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Passer
                  </Button>
                  <Button
                    onClick={handleSaveRating}
                    disabled={tempRating === 0}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    Noter {tempRating > 0 && `${tempRating}/5`}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation pour retirer la note */}
        <Dialog open={showRemoveRatingDialog} onOpenChange={setShowRemoveRatingDialog}>
          <DialogContent className="bg-slate-800 border-slate-600 text-slate-50">
            <DialogHeader>
              <DialogTitle className="text-slate-50 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Retirer la note ?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-50 mb-2 px-4" title={book.title}>
                  "{truncateText(book.title, 60)}"
                </h3>
                <p className="text-slate-300 text-sm">
                  Ce livre a une note de {book.rating}/5 étoiles. Voulez-vous la conserver ou la supprimer ?
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => handleRemoveRatingConfirm(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Conserver la note
                </Button>
                <Button
                  onClick={() => handleRemoveRatingConfirm(true)}
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Supprimer la note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'édition */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-50">Modifier le livre</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-slate-200">
                    Titre *
                  </Label>
                  <Input
                    id="edit-title"
                    value={editedBook.title}
                    onChange={(e) => setEditedBook({ ...editedBook, title: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-author" className="text-slate-200">
                    Auteur *
                  </Label>
                  <Input
                    id="edit-author"
                    value={editedBook.author}
                    onChange={(e) => setEditedBook({ ...editedBook, author: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-thumbnail" className="text-slate-200">
                  URL de l'image (optionnel)
                </Label>
                <Input
                  id="edit-thumbnail"
                  value={editedBook.thumbnail || ""}
                  onChange={(e) => setEditedBook({ ...editedBook, thumbnail: e.target.value })}
                  placeholder="Collez l'URL de l'image de couverture ici"
                  className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                />
                {editedBook.thumbnail && editedBook.thumbnail.trim() !== "" && (
                  <div className="mt-2">
                    <p className="text-sm text-slate-300 mb-2">Aperçu de l'image :</p>
                    <BookImage
                      src={editedBook.thumbnail}
                      alt="Aperçu de la couverture"
                      className="max-w-[120px] h-auto rounded-md border border-slate-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-genre" className="text-slate-200">
                    Genre
                  </Label>
                  <Select
                    value={editedBook.genre || "Fiction"}
                    onValueChange={(value) => setEditedBook({ ...editedBook, genre: value })}
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
                  <Label htmlFor="edit-publisher" className="text-slate-200">
                    Éditeur
                  </Label>
                  <Input
                    id="edit-publisher"
                    value={editedBook.publisher || ""}
                    onChange={(e) => setEditedBook({ ...editedBook, publisher: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-universe" className="text-slate-200">
                  Univers
                </Label>
                <SeriesCombobox
                  series={availableUniverses}
                  selectedSeries={editedBook.universe}
                  onSeriesChange={(value) => setEditedBook({ ...editedBook, universe: value })}
                  placeholder="Sélectionner ou créer un univers..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-series" className="text-slate-200">
                  Série
                </Label>
                <SeriesCombobox
                  series={getSeriesForUniverse(editedBook.universe)}
                  selectedSeries={editedBook.series}
                  onSeriesChange={(value) => setEditedBook({ ...editedBook, series: value })}
                  placeholder="Sélectionner ou créer une série..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-volume" className="text-slate-200">
                    Tome/Numéro
                  </Label>
                  <Input
                    id="edit-volume"
                    type="number"
                    min="1"
                    value={editedBook.volume || ""}
                    onChange={(e) =>
                      setEditedBook({ ...editedBook, volume: Number.parseInt(e.target.value) || undefined })
                    }
                    placeholder="1, 2, 3..."
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-condition" className="text-slate-200">
                    État
                  </Label>
                  <Select
                    value={editedBook.condition}
                    onValueChange={(value) => setEditedBook({ ...editedBook, condition: value })}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-pageCount" className="text-slate-200">
                    Nombre de pages
                  </Label>
                  <Input
                    id="edit-pageCount"
                    type="number"
                    min="1"
                    value={editedBook.pageCount || ""}
                    onChange={(e) =>
                      setEditedBook({ ...editedBook, pageCount: Number.parseInt(e.target.value) || undefined })
                    }
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-publishedDate" className="text-slate-200">
                    Date de publication
                  </Label>
                  <Input
                    id="edit-publishedDate"
                    type="date"
                    value={editedBook.publishedDate || ""}
                    onChange={(e) => setEditedBook({ ...editedBook, publishedDate: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rating" className="text-slate-200">
                    Note (1-5)
                  </Label>
                  <Select
                    value={editedBook.rating?.toString() || "0"}
                    onValueChange={(value) =>
                      setEditedBook({
                        ...editedBook,
                        rating: value && value !== "0" ? Number.parseInt(value) : undefined,
                      })
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
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isRead"
                  checked={editedBook.isRead}
                  onCheckedChange={(checked) => {
                    setEditedBook({
                      ...editedBook,
                      isRead: checked as boolean,
                      readDate: checked ? editedBook.readDate || getLocalISODate(new Date()) : undefined,
                    })
                  }}
                />
                <Label htmlFor="edit-isRead" className="text-slate-200">
                  Livre lu
                </Label>
              </div>

              {editedBook.isRead && (
                <div className="space-y-2">
                  <Label htmlFor="edit-readDate" className="text-slate-200">
                    Date de lecture
                  </Label>
                  <Input
                    id="edit-readDate"
                    type="date"
                    value={editedBook.readDate || ""}
                    onChange={(e) => setEditedBook({ ...editedBook, readDate: e.target.value })}
                    className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-slate-200">
                  Description du livre
                </Label>
                <Textarea
                  id="edit-description"
                  value={editedBook.description || ""}
                  onChange={(e) => setEditedBook({ ...editedBook, description: e.target.value })}
                  placeholder="Résumé, synopsis, description du contenu..."
                  className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content" className="text-slate-200">
                  Contenu inclus
                </Label>
                <Textarea
                  id="edit-content"
                  value={editedBook.content || ""}
                  onChange={(e) => setEditedBook({ ...editedBook, content: e.target.value })}
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
                <Label htmlFor="edit-notes" className="text-slate-200">
                  Notes personnelles
                </Label>
                <Textarea
                  id="edit-notes"
                  value={editedBook.notes || ""}
                  onChange={(e) => setEditedBook({ ...editedBook, notes: e.target.value })}
                  className="bg-slate-700 border-slate-500 text-slate-100 hover:border-slate-400 focus:border-slate-400 placeholder:text-slate-400"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white hover:text-slate-50">
                  Sauvegarder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <BookDetailsDialog book={book} open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} />
      </CardContent>
    </Card>
  )
}

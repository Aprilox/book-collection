"use client"

import { useState } from "react"
import {
  Plus,
  FolderPlus,
  GripVertical,
  Trash2,
  Edit2,
  BookOpen,
  User,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Star,
  TrendingUp,
  Check,
  Eye,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import BookImage from "@/components/book-image"
import BookDetailsDialog from "@/components/book-details-dialog"
import type { Book } from "@/types/book"
import type { ReadingFolder, ReadingOrderBook } from "@/types/reading-order"
import { formatDate } from "@/lib/constants"

interface ReadingOrderPanelProps {
  books: Book[]
  readingFolders: ReadingFolder[]
  onCreateFolder: (folder: Omit<ReadingFolder, "id" | "createdDate">) => Promise<ReadingFolder>
  onUpdateFolder: (folder: ReadingFolder) => Promise<ReadingFolder>
  onDeleteFolder: (folderId: string) => Promise<void>
  onAddBookToFolder: (folderId: string, bookId: string, notes?: string) => Promise<void>
  onRemoveBookFromFolder: (folderId: string, bookId: string) => Promise<void>
  onReorderBooks: (folderId: string, books: ReadingOrderBook[]) => Promise<void>
  onUpdateBook: (book: Book) => Promise<void>
}

interface FolderStats {
  totalBooks: number
  readBooks: number
  unreadBooks: number
  readingProgress: number
  totalPages: number
  readPages: number
  averageRating: number
  ratedBooks: number
  createdDate: string
  lastBookAdded?: string
}

export default function ReadingOrderPanel({
  books,
  readingFolders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onAddBookToFolder,
  onRemoveBookFromFolder,
  onReorderBooks,
  onUpdateBook,
}: ReadingOrderPanelProps) {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<ReadingFolder | null>(null)
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null)
  const [editingFolder, setEditingFolder] = useState<ReadingFolder | null>(null)
  const [statsFolder, setStatsFolder] = useState<ReadingFolder | null>(null)
  const [ratingBook, setRatingBook] = useState<Book | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderDescription, setNewFolderDescription] = useState("")
  const [selectedBookId, setSelectedBookId] = useState("")
  const [bookNotes, setBookNotes] = useState("")
  const [tempRating, setTempRating] = useState<number>(0)
  const [showRemoveRatingDialog, setShowRemoveRatingDialog] = useState(false)
  const [bookToUnread, setBookToUnread] = useState<Book | null>(null)
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null)
  const [removingBook, setRemovingBook] = useState<string | null>(null)
  const [bookSearchTerm, setBookSearchTerm] = useState("")
  const [selectedUniverseFilter, setSelectedUniverseFilter] = useState<string>("all")
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>("all")
  const [reorderMode, setReorderMode] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [tempOrder, setTempOrder] = useState<string>("")

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "❌ Erreur",
        description: "Le nom du dossier est requis",
        variant: "destructive",
      })
      return
    }

    try {
      await onCreateFolder({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
        books: [],
      })
      setNewFolderName("")
      setNewFolderDescription("")
      setIsCreateFolderOpen(false)
      toast({
        title: "✅ Dossier créé",
        description: `Le dossier "${newFolderName}" a été créé.`,
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de créer le dossier",
        variant: "destructive",
      })
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editingFolder.name.trim()) return

    try {
      await onUpdateFolder(editingFolder)
      setEditingFolder(null)
      toast({
        title: "✅ Dossier modifié",
        description: `Le dossier "${editingFolder.name}" a été mis à jour.`,
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de modifier le dossier",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFolder = async (folder: ReadingFolder) => {
    try {
      await onDeleteFolder(folder.id)
      if (expandedFolder === folder.id) {
        setExpandedFolder(null)
      }
      setDeletingFolder(null)
      toast({
        title: "🗑️ Dossier supprimé",
        description: `Le dossier "${folder.name}" a été supprimé.`,
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de supprimer le dossier",
        variant: "destructive",
      })
    }
  }

  const handleAddBookToFolder = async () => {
    if (!selectedFolder || !selectedBookId) return

    if (selectedFolder.books.some((b) => b.bookId === selectedBookId)) {
      toast({
        title: "❌ Erreur",
        description: "Ce livre est déjà dans ce dossier",
        variant: "destructive",
      })
      return
    }

    try {
      await onAddBookToFolder(selectedFolder.id, selectedBookId, bookNotes.trim() || undefined)
      setSelectedBookId("")
      setBookNotes("")
      setBookSearchTerm("")
      setSelectedUniverseFilter("all")
      setSelectedSeriesFilter("all")
      setIsAddBookOpen(false)
      toast({
        title: "✅ Livre ajouté",
        description: "Le livre a été ajouté au dossier de lecture.",
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'ajouter le livre",
        variant: "destructive",
      })
    }
  }

  const handleRemoveBook = async (folder: ReadingFolder, bookId: string) => {
    try {
      await onRemoveBookFromFolder(folder.id, bookId)
      setRemovingBook(null)
      toast({
        title: "🗑️ Livre retiré",
        description: "Le livre a été retiré du dossier de lecture.",
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de retirer le livre",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsRead = async (book: Book) => {
    if (book.isRead && book.rating) {
      setBookToUnread(book)
      setShowRemoveRatingDialog(true)
    } else {
      try {
        const updatedBook = { ...book, isRead: !book.isRead }
        if (!book.isRead) {
          updatedBook.readDate = new Date().toISOString().split("T")[0]
        } else {
          updatedBook.readDate = undefined
        }

        await onUpdateBook(updatedBook)

        toast({
          title: book.isRead ? "📖 Marqué comme non lu" : "✅ Marqué comme lu",
          description: `"${book.title.length > 30 ? book.title.substring(0, 30) + "..." : book.title}" a été mis à jour.`,
        })

        if (!book.isRead) {
          setRatingBook(updatedBook)
          setTempRating(updatedBook.rating || 0)
        }
      } catch (error) {
        toast({
          title: "❌ Erreur",
          description: "Impossible de mettre à jour le statut de lecture",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemoveRatingConfirm = async (removeRating: boolean) => {
    if (!bookToUnread) return

    try {
      const updatedBook = {
        ...bookToUnread,
        isRead: false,
        readDate: undefined,
        rating: removeRating ? undefined : bookToUnread.rating,
      }

      await onUpdateBook(updatedBook)
      setShowRemoveRatingDialog(false)
      setBookToUnread(null)

      toast({
        title: "📖 Marqué comme non lu",
        description: `"${bookToUnread.title.length > 30 ? bookToUnread.title.substring(0, 30) + "..." : bookToUnread.title}" a été mis à jour.`,
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de mettre à jour le statut de lecture",
        variant: "destructive",
      })
    }
  }

  const handleSaveRating = async () => {
    if (!ratingBook || tempRating === 0 || !onUpdateBook) return

    try {
      await onUpdateBook({ ...ratingBook, rating: tempRating })
      setRatingBook(null)
      setTempRating(0)
      toast({
        title: "⭐ Note ajoutée",
        description: `"${ratingBook.title.length > 30 ? ratingBook.title.substring(0, 30) + "..." : ratingBook.title}" a été noté ${tempRating}/5 étoiles.`,
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de sauvegarder la note",
        variant: "destructive",
      })
    }
  }

  const handleSkipRating = () => {
    setRatingBook(null)
    setTempRating(0)
  }

  const handleDirectOrderChange = async (folder: ReadingFolder, bookId: string, newOrder: number) => {
    if (newOrder < 1 || newOrder > folder.books.length) {
      toast({
        title: "❌ Erreur",
        description: `L'ordre doit être entre 1 et ${folder.books.length}`,
        variant: "destructive",
      })
      return
    }

    const currentBooks = [...folder.books].sort((a, b) => a.order - b.order)
    const bookIndex = currentBooks.findIndex((b) => b.bookId === bookId)

    if (bookIndex === -1) return

    const [movedBook] = currentBooks.splice(bookIndex, 1)
    currentBooks.splice(newOrder - 1, 0, movedBook)

    const reorderedBooks = currentBooks.map((book, index) => ({
      ...book,
      order: index + 1,
    }))

    try {
      await onReorderBooks(folder.id, reorderedBooks)
      toast({
        title: "✅ Ordre mis à jour",
        description: "L'ordre de lecture a été modifié.",
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de modifier l'ordre",
        variant: "destructive",
      })
    }
  }

  const handleOrderEdit = (bookId: string, currentOrder: number) => {
    setEditingOrder(bookId)
    setTempOrder(currentOrder.toString())
  }

  const handleOrderSave = async (folder: ReadingFolder, bookId: string) => {
    const newOrder = Number.parseInt(tempOrder)
    if (isNaN(newOrder)) {
      setEditingOrder(null)
      return
    }

    await handleDirectOrderChange(folder, bookId, newOrder)
    setEditingOrder(null)
    setTempOrder("")
  }

  const handleOrderCancel = () => {
    setEditingOrder(null)
    setTempOrder("")
  }

  const handleMoveBook = async (folder: ReadingFolder, bookId: string, direction: "up" | "down") => {
    const currentBooks = [...folder.books].sort((a, b) => a.order - b.order)
    const bookIndex = currentBooks.findIndex((b) => b.bookId === bookId)

    if (bookIndex === -1) return

    let newIndex: number
    if (direction === "up" && bookIndex > 0) {
      newIndex = bookIndex - 1
    } else if (direction === "down" && bookIndex < currentBooks.length - 1) {
      newIndex = bookIndex + 1
    } else {
      return
    }

    const newBooks = [...currentBooks]
    const [movedBook] = newBooks.splice(bookIndex, 1)
    newBooks.splice(newIndex, 0, movedBook)

    const reorderedBooks = newBooks.map((book, index) => ({
      ...book,
      order: index + 1,
    }))

    try {
      await onReorderBooks(folder.id, reorderedBooks)
      toast({
        title: "✅ Ordre mis à jour",
        description: "L'ordre de lecture a été modifié.",
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de modifier l'ordre",
        variant: "destructive",
      })
    }
  }

  const handleBookClick = (book: Book) => {
    setSelectedBookForDetails(book)
  }

  const getBookById = (bookId: string): Book | undefined => {
    return books.find((book) => book.id === bookId)
  }

  const truncateText = (text: string, maxLength = 40): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const calculateFolderStats = (folder: ReadingFolder): FolderStats => {
    const folderBooks = folder.books.map((rb) => getBookById(rb.bookId)).filter(Boolean) as Book[]

    const totalBooks = folderBooks.length
    const readBooks = folderBooks.filter((book) => book.isRead).length
    const unreadBooks = totalBooks - readBooks
    const readingProgress = totalBooks > 0 ? (readBooks / totalBooks) * 100 : 0

    const totalPages = folderBooks.reduce((sum, book) => sum + (book.pageCount || 0), 0)
    const readPages = folderBooks.filter((book) => book.isRead).reduce((sum, book) => sum + (book.pageCount || 0), 0)

    const ratedBooks = folderBooks.filter((book) => book.rating)
    const averageRating =
      ratedBooks.length > 0 ? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / ratedBooks.length : 0

    const lastBookAdded =
      folder.books.length > 0
        ? folder.books.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())[0]?.addedDate
        : undefined

    return {
      totalBooks,
      readBooks,
      unreadBooks,
      readingProgress,
      totalPages,
      readPages,
      averageRating,
      ratedBooks: ratedBooks.length,
      createdDate: folder.createdDate,
      lastBookAdded,
    }
  }

  const getFilteredAvailableBooks = () => {
    let filteredBooks = books.filter((book) => {
      if (!selectedFolder) return true
      return !selectedFolder.books.some((b) => b.bookId === book.id)
    })

    if (bookSearchTerm.trim()) {
      filteredBooks = filteredBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
          book.series?.toLowerCase().includes(bookSearchTerm.toLowerCase()),
      )
    }

    if (selectedUniverseFilter !== "all") {
      if (selectedUniverseFilter === "none") {
        filteredBooks = filteredBooks.filter((book) => !book.universe || book.universe.trim() === "")
      } else {
        filteredBooks = filteredBooks.filter((book) => book.universe === selectedUniverseFilter)
      }
    }

    if (selectedSeriesFilter !== "all") {
      if (selectedSeriesFilter === "none") {
        filteredBooks = filteredBooks.filter((book) => !book.series || book.series.trim() === "")
      } else {
        filteredBooks = filteredBooks.filter((book) => book.series === selectedSeriesFilter)
      }
    }

    return filteredBooks
  }

  const availableUniverses = Array.from(new Set(books.filter((book) => book.universe).map((book) => book.universe!)))
  const availableSeries = Array.from(new Set(books.filter((book) => book.series).map((book) => book.series!)))

  const getSeriesForUniverse = (universe?: string): string[] => {
    return Array.from(
      new Set(
        books
          .filter((book) => {
            if (!book.series) return false
            if (!universe || universe.trim() === "") {
              return !book.universe || book.universe.trim() === ""
            } else {
              return book.universe === universe
            }
          })
          .map((book) => book.series!),
      ),
    )
  }

  const handleUniverseFilterChange = (value: string) => {
    setSelectedUniverseFilter(value)
    setSelectedSeriesFilter("all")
  }

  const filteredAvailableBooks = getFilteredAvailableBooks()
  const seriesForSelectedUniverse = getSeriesForUniverse(
    selectedUniverseFilter === "all" ? undefined : selectedUniverseFilter === "none" ? "" : selectedUniverseFilter,
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header avec bouton de création */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-50">Ordre de lecture</h2>
          <p className="text-sm sm:text-base text-slate-300">
            Organisez vos livres par dossiers et définissez votre ordre de lecture
          </p>
        </div>
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 w-full sm:w-auto">
              <FolderPlus className="w-4 h-4 mr-2" />
              Nouveau dossier
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-50">Créer un nouveau dossier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name" className="text-slate-200">
                  Nom du dossier
                </Label>
                <Input
                  id="folder-name"
                  placeholder="ex: Saga Marvel, Série policière..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-description" className="text-slate-200">
                  Description (optionnel)
                </Label>
                <Textarea
                  id="folder-description"
                  placeholder="Description du dossier de lecture..."
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                  rows={3}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 order-2 sm:order-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  className="bg-slate-700 hover:bg-slate-600 text-white order-1 sm:order-2"
                >
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des dossiers */}
      {readingFolders.length === 0 ? (
        <Card className="bg-slate-800 border-slate-600">
          <CardContent className="p-6 sm:p-8 text-center">
            <FolderPlus className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-50 mb-2">Aucun dossier de lecture</h3>
            <p className="text-sm sm:text-base text-slate-300 mb-4">
              Créez votre premier dossier pour organiser vos lectures !
            </p>
            <Button
              onClick={() => setIsCreateFolderOpen(true)}
              className="bg-slate-700 hover:bg-slate-600 text-white w-full sm:w-auto"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Créer mon premier dossier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {readingFolders.map((folder) => (
            <Card key={folder.id} className="bg-slate-800 border-slate-600">
              <CardHeader className="pb-3">
                {/* Layout mobile */}
                <div className="block sm:hidden">
                  <div className="space-y-3">
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedFolder(expandedFolder === folder.id ? null : folder.id)}
                    >
                      <CardTitle className="text-slate-50 flex items-center gap-2 hover:text-blue-400 transition-colors text-sm">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform flex-shrink-0 ${expandedFolder === folder.id ? "rotate-90" : ""}`}
                        />
                        <span className="truncate">📁 {folder.name}</span>
                        <Badge variant="outline" className="border-slate-500 text-slate-300 flex-shrink-0 text-xs">
                          {folder.books.length} livre{folder.books.length > 1 ? "s" : ""}
                        </Badge>
                      </CardTitle>
                      {folder.description && (
                        <p className="text-slate-300 text-xs mt-1 ml-6 truncate">{folder.description}</p>
                      )}
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setStatsFolder(folder)
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 px-2 py-1"
                        title="Statistiques"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFolder(folder)
                          setIsAddBookOpen(true)
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 px-2 py-1"
                        title="Ajouter un livre"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingFolder({ ...folder })
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 px-2 py-1"
                        title="Modifier le dossier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      {folder.books.length > 1 && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReorderMode(reorderMode === folder.id ? null : folder.id)
                          }}
                          className={`border-slate-600 px-2 py-1 ${
                            reorderMode === folder.id
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-slate-700 hover:bg-slate-600 text-white"
                          }`}
                          title="Mode réorganisation"
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                      )}

                      {deletingFolder === folder.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFolder(folder)
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600 px-2 py-1"
                            title="Confirmer la suppression"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingFolder(null)
                            }}
                            className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500 px-2 py-1"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingFolder(folder.id)
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600 px-2 py-1"
                          title="Supprimer le dossier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Layout desktop */}
                <div className="hidden sm:block">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => setExpandedFolder(expandedFolder === folder.id ? null : folder.id)}
                    >
                      <CardTitle className="text-slate-50 flex items-center gap-2 hover:text-blue-400 transition-colors text-base">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform flex-shrink-0 ${expandedFolder === folder.id ? "rotate-90" : ""}`}
                        />
                        <span className="truncate">📁 {folder.name}</span>
                        <Badge variant="outline" className="border-slate-500 text-slate-300 flex-shrink-0 text-xs">
                          {folder.books.length} livre{folder.books.length > 1 ? "s" : ""}
                        </Badge>
                      </CardTitle>
                      {folder.description && (
                        <p className="text-slate-300 text-sm mt-1 ml-6 truncate">{folder.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setStatsFolder(folder)
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                        title="Statistiques"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Stats
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFolder(folder)
                          setIsAddBookOpen(true)
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                        title="Ajouter un livre"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingFolder({ ...folder })
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                        title="Modifier le dossier"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>

                      {folder.books.length > 1 && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReorderMode(reorderMode === folder.id ? null : folder.id)
                          }}
                          className={`border-slate-600 ${
                            reorderMode === folder.id
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-slate-700 hover:bg-slate-600 text-white"
                          }`}
                          title="Mode réorganisation"
                        >
                          <GripVertical className="w-4 h-4 mr-1" />
                          Réorganiser
                        </Button>
                      )}

                      {deletingFolder === folder.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFolder(folder)
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                            title="Confirmer la suppression"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingFolder(null)
                            }}
                            className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500"
                            title="Annuler"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingFolder(folder.id)
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                          title="Supprimer le dossier"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Aperçu compact */}
              {expandedFolder !== folder.id && folder.books.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {folder.books
                      .sort((a, b) => a.order - b.order)
                      .slice(0, 6)
                      .map((readingBook) => {
                        const book = getBookById(readingBook.bookId)
                        if (!book) return null

                        return (
                          <div
                            key={readingBook.bookId}
                            className="flex-shrink-0 relative cursor-pointer hover:scale-105 transition-transform"
                            title={book.title}
                            onClick={() => handleBookClick(book)}
                          >
                            <div className="w-8 h-12 sm:w-12 sm:h-16 bg-slate-600 rounded flex-shrink-0">
                              {book.thumbnail ? (
                                <BookImage
                                  src={book.thumbnail}
                                  alt={book.title}
                                  className="w-8 h-12 sm:w-12 sm:h-16 rounded object-cover"
                                />
                              ) : (
                                <div className="w-8 h-12 sm:w-12 sm:h-16 bg-slate-600 rounded flex items-center justify-center">
                                  <BookOpen className="w-2 h-2 sm:w-4 sm:h-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="absolute -top-1 -left-1 w-3 h-3 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {readingBook.order}
                            </div>
                            {book.isRead && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-1 h-1 sm:w-2 sm:h-2 text-white" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    {folder.books.length > 6 && (
                      <div className="flex-shrink-0 w-8 h-12 sm:w-12 sm:h-16 bg-slate-700 rounded flex items-center justify-center text-slate-400 text-xs">
                        +{folder.books.length - 6}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}

              {/* Vue détaillée */}
              {expandedFolder === folder.id && (
                <CardContent className="pt-0">
                  {folder.books.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-slate-400">
                      <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" />
                      <p className="text-sm sm:text-base">Aucun livre dans ce dossier</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFolder(folder)
                          setIsAddBookOpen(true)
                        }}
                        className="mt-2 bg-slate-700 hover:bg-slate-600 text-white border-slate-600 w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter un livre
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Message d'aide pour le mode réorganisation mobile */}
                      {reorderMode === folder.id && (
                        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-600 rounded-lg sm:hidden">
                          <div className="flex items-center gap-2 text-blue-300 text-sm">
                            <ArrowUp className="w-4 h-4" />
                            <span>Utilisez les flèches pour réorganiser l'ordre de lecture</span>
                          </div>
                          <div className="mt-1 text-blue-300 text-xs">
                            Cliquez sur le numéro pour éditer directement l'ordre
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setReorderMode(null)}
                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Terminer la réorganisation
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2 sm:space-y-3">
                        {folder.books
                          .sort((a, b) => a.order - b.order)
                          .map((readingBook, index) => {
                            const book = getBookById(readingBook.bookId)
                            if (!book) return null

                            const isFirst = index === 0
                            const isLast = index === folder.books.length - 1

                            return (
                              <div
                                key={readingBook.bookId}
                                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-700 rounded-lg transition-colors ${
                                  reorderMode !== folder.id ? "hover:bg-slate-600 cursor-pointer" : ""
                                }`}
                                onClick={(e) => {
                                  const target = e.target as HTMLElement
                                  if (target.closest("button") || target.closest("input")) {
                                    return
                                  }

                                  if (reorderMode !== folder.id) {
                                    handleBookClick(book)
                                  }
                                }}
                              >
                                {/* Boutons de réorganisation mobile */}
                                <div className="flex flex-col gap-1">
                                  {reorderMode === folder.id ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMoveBook(folder, readingBook.bookId, "up")
                                        }}
                                        disabled={isFirst}
                                        className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500 px-1 py-1 h-6 w-6 disabled:opacity-30"
                                        title="Monter"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMoveBook(folder, readingBook.bookId, "down")
                                        }}
                                        disabled={isLast}
                                        className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500 px-1 py-1 h-6 w-6 disabled:opacity-30"
                                        title="Descendre"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <div className="w-6 h-12 flex items-center justify-center sm:hidden">
                                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {readingBook.order}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Édition directe du numéro pour mobile */}
                                <div className="sm:hidden flex items-center justify-center">
                                  {editingOrder === readingBook.bookId ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        max={folder.books.length}
                                        value={tempOrder}
                                        onChange={(e) => setTempOrder(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleOrderSave(folder, readingBook.bookId)
                                          } else if (e.key === "Escape") {
                                            handleOrderCancel()
                                          }
                                        }}
                                        className="w-10 h-6 bg-slate-600 border border-slate-500 rounded text-white text-center text-xs focus:outline-none focus:border-blue-500"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOrderSave(folder, readingBook.bookId)
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-1 py-1 h-5 w-5"
                                        title="Confirmer"
                                      >
                                        <Check className="w-2 h-2" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOrderCancel()
                                        }}
                                        className="bg-slate-600 hover:bg-slate-500 text-white px-1 py-1 h-5 w-5"
                                        title="Annuler"
                                      >
                                        <X className="w-2 h-2" />
                                      </Button>
                                    </div>
                                  ) : (
                                    reorderMode === folder.id && (
                                      <div
                                        className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-blue-600 mt-1"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOrderEdit(readingBook.bookId, readingBook.order)
                                        }}
                                        title="Cliquer pour éditer l'ordre"
                                      >
                                        {readingBook.order}
                                      </div>
                                    )
                                  )}
                                </div>

                                {/* Numéro d'ordre pour desktop */}
                                <div className="hidden sm:flex items-center gap-2">
                                  {editingOrder === readingBook.bookId ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        max={folder.books.length}
                                        value={tempOrder}
                                        onChange={(e) => setTempOrder(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleOrderSave(folder, readingBook.bookId)
                                          } else if (e.key === "Escape") {
                                            handleOrderCancel()
                                          }
                                        }}
                                        className="w-12 h-8 bg-slate-600 border border-slate-500 rounded text-white text-center text-sm focus:outline-none focus:border-blue-500"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOrderSave(folder, readingBook.bookId)
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-1 py-1 h-6 w-6"
                                        title="Confirmer"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOrderCancel()
                                        }}
                                        className="bg-slate-600 hover:bg-slate-500 text-white px-1 py-1 h-6 w-6"
                                        title="Annuler"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                                        reorderMode === folder.id ? "cursor-pointer hover:bg-blue-600" : ""
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (reorderMode === folder.id) {
                                          handleOrderEdit(readingBook.bookId, readingBook.order)
                                        }
                                      }}
                                      title={reorderMode === folder.id ? "Cliquer pour éditer l'ordre" : undefined}
                                    >
                                      {readingBook.order}
                                    </div>
                                  )}
                                </div>

                                <div className="w-10 h-14 sm:w-12 sm:h-16 bg-slate-600 rounded flex-shrink-0 relative">
                                  {book.thumbnail ? (
                                    <BookImage
                                      src={book.thumbnail}
                                      alt={book.title}
                                      className="w-10 h-14 sm:w-12 sm:h-16 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-14 sm:w-12 sm:h-16 bg-slate-600 rounded flex items-center justify-center">
                                      <BookOpen className="w-3 h-3 sm:w-6 sm:h-6 text-slate-400" />
                                    </div>
                                  )}
                                  {book.isRead && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                                      <Check className="w-1 h-1 sm:w-2 sm:h-2 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-50 text-xs sm:text-base" title={book.title}>
                                    <span className="block sm:hidden">{truncateText(book.title, 20)}</span>
                                    <span className="hidden sm:block lg:hidden">{truncateText(book.title, 35)}</span>
                                    <span className="hidden lg:block xl:hidden">{truncateText(book.title, 50)}</span>
                                    <span className="hidden xl:block">{truncateText(book.title, 70)}</span>
                                  </h4>
                                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                                    <User className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                                    <span className="truncate" title={book.author}>
                                      <span className="block sm:hidden">{truncateText(book.author, 12)}</span>
                                      <span className="hidden sm:block lg:hidden">{truncateText(book.author, 20)}</span>
                                      <span className="hidden lg:block">{truncateText(book.author, 30)}</span>
                                    </span>
                                  </div>
                                  {readingBook.notes && (
                                    <p className="text-slate-300 text-xs mt-1 truncate" title={readingBook.notes}>
                                      {truncateText(readingBook.notes, 40)}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1 mt-1">
                                    {book.isRead ? (
                                      <Badge className="bg-green-600 text-white text-xs">Lu</Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-slate-500 text-slate-400 text-xs">
                                        Non lu
                                      </Badge>
                                    )}
                                    {book.rating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-400 fill-current" />
                                        <span className="text-xs text-slate-400">{book.rating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Boutons d'action des livres */}
                                {!(reorderMode === folder.id) && (
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleMarkAsRead(book)
                                      }}
                                      className={
                                        book.isRead
                                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600 px-1.5 py-1 sm:px-2 sm:py-1 min-w-0"
                                          : "bg-slate-600 hover:bg-slate-500 text-white border-slate-500 px-1.5 py-1 sm:px-2 sm:py-1 min-w-0"
                                      }
                                      title={book.isRead ? "Marquer comme non lu" : "Marquer comme lu"}
                                    >
                                      <Eye className={`w-3 h-3 sm:w-4 sm:h-4 ${book.isRead ? "" : "opacity-50"}`} />
                                    </Button>

                                    {removingBook === readingBook.bookId ? (
                                      <div className="flex flex-col gap-1 sm:flex-row sm:gap-1">
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveBook(folder, readingBook.bookId)
                                          }}
                                          className="bg-red-600 hover:bg-red-700 text-white border-red-600 px-2 py-1 min-w-0"
                                          title="Confirmer la suppression"
                                        >
                                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setRemovingBook(null)
                                          }}
                                          className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500 px-2 py-1 min-w-0"
                                          title="Annuler"
                                        >
                                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setRemovingBook(readingBook.bookId)
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 px-1.5 py-1 sm:px-2 sm:py-1 min-w-0"
                                        title="Retirer du dossier"
                                      >
                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de notation après lecture */}
      <Dialog open={!!ratingBook} onOpenChange={() => setRatingBook(null)}>
        <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-50 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Noter votre lecture
            </DialogTitle>
          </DialogHeader>
          {ratingBook && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-slate-50 mb-2 px-4" title={ratingBook.title}>
                  "{truncateText(ratingBook.title, 60)}"
                </h3>
                <p className="text-slate-300 text-sm">Vous venez de terminer ce livre ! Souhaitez-vous le noter ?</p>
              </div>

              <div className="flex justify-center space-x-1 sm:space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setTempRating(rating)}
                    className={`p-1 sm:p-2 rounded-full transition-colors ${
                      tempRating >= rating
                        ? "text-yellow-400 hover:text-yellow-300"
                        : "text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${tempRating >= rating ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>

              {tempRating > 0 && (
                <div className="text-center text-slate-300 text-sm">
                  {tempRating === 1 && "Décevant"}
                  {tempRating === 2 && "Moyen"}
                  {tempRating === 3 && "Correct"}
                  {tempRating === 4 && "Très bien"}
                  {tempRating === 5 && "Excellent !"}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={handleSkipRating}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 order-2 sm:order-1"
                >
                  Passer
                </Button>
                <Button
                  onClick={handleSaveRating}
                  disabled={tempRating === 0}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-slate-800 disabled:text-slate-500 order-1 sm:order-2"
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
        <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-50 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Retirer la note ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              {bookToUnread && (
                <>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-50 mb-2 px-4" title={bookToUnread.title}>
                    "{truncateText(bookToUnread.title, 60)}"
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Ce livre a une note de {bookToUnread.rating}/5 étoiles. Voulez-vous la conserver ou la supprimer ?
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => handleRemoveRatingConfirm(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white order-1"
              >
                Conserver la note
              </Button>
              <Button
                onClick={() => handleRemoveRatingConfirm(true)}
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 order-2"
              >
                Supprimer la note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog des statistiques de dossier */}
      <Dialog open={!!statsFolder} onOpenChange={() => setStatsFolder(null)}>
        <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-50 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistiques - {statsFolder?.name}
            </DialogTitle>
          </DialogHeader>
          {statsFolder && (
            <div className="space-y-4 sm:space-y-6">
              {(() => {
                const stats = calculateFolderStats(statsFolder)
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="bg-slate-700 border-slate-600">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-blue-400 mb-2" />
                          <div className="text-xl sm:text-2xl font-bold text-white">{stats.totalBooks}</div>
                          <div className="text-xs text-slate-400">Livres total</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-700 border-slate-600">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-green-400 mb-2" />
                          <div className="text-xl sm:text-2xl font-bold text-white">{stats.readBooks}</div>
                          <div className="text-xs text-slate-400">Livres lus</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-700 border-slate-600 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-3 sm:p-4 text-center">
                          <Star className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-yellow-400 mb-2" />
                          <div className="text-xl sm:text-2xl font-bold text-white">
                            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
                          </div>
                          <div className="text-xs text-slate-400">Note moyenne</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-slate-50 text-base sm:text-lg">Progression de lecture</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Livres lus</span>
                            <span className="text-slate-300">
                              {stats.readBooks} / {stats.totalBooks}
                            </span>
                          </div>
                          <Progress value={stats.readingProgress} className="h-2" />
                          <div className="text-center text-sm text-slate-400">
                            {stats.readingProgress.toFixed(1)}% complété
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="bg-slate-600 p-3 rounded">
                            <div className="text-slate-300">Pages lues</div>
                            <div className="text-white font-semibold">{stats.readPages.toLocaleString()}</div>
                          </div>
                          <div className="bg-slate-600 p-3 rounded">
                            <div className="text-slate-300">Pages totales</div>
                            <div className="text-white font-semibold">{stats.totalPages.toLocaleString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-slate-50 text-base sm:text-lg flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                          Informations du dossier
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="text-slate-300">Date de création</div>
                            <div className="text-white">{formatDate(stats.createdDate)}</div>
                          </div>
                          {stats.lastBookAdded && (
                            <div className="space-y-2">
                              <div className="text-slate-300">Dernier livre ajouté</div>
                              <div className="text-white">{formatDate(stats.lastBookAdded)}</div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="text-slate-300">Livres restants</div>
                            <div className="text-white">
                              {stats.unreadBooks} livre{stats.unreadBooks > 1 ? "s" : ""}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-slate-300">Livres notés</div>
                            <div className="text-white">
                              {stats.ratedBooks} / {stats.totalBooks} livre{stats.totalBooks > 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajout de livre avec filtres et images */}
      <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
        <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-50 text-base sm:text-lg">
              Ajouter un livre à "{selectedFolder?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4 p-3 sm:p-4 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-slate-300" />
                <span className="text-slate-300 font-medium text-sm sm:text-base">Filtres de recherche</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200 text-sm">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Titre, auteur, série..."
                      value={bookSearchTerm}
                      onChange={(e) => setBookSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-600 border-slate-500 text-slate-100 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200 text-sm">Univers</Label>
                  <Select value={selectedUniverseFilter} onValueChange={handleUniverseFilterChange}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-100 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
                      <SelectItem value="all" className="hover:bg-slate-600 focus:bg-slate-600 text-sm">
                        Tous les univers
                      </SelectItem>
                      <SelectItem value="none" className="hover:bg-slate-600 focus:bg-slate-600 text-sm">
                        Sans univers
                      </SelectItem>
                      {availableUniverses.map((universe) => (
                        <SelectItem
                          key={universe}
                          value={universe}
                          className="hover:bg-slate-600 focus:bg-slate-600 text-sm"
                        >
                          {universe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label className="text-slate-200 text-sm">Série</Label>
                  <Select value={selectedSeriesFilter} onValueChange={setSelectedSeriesFilter}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-slate-100 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
                      <SelectItem value="all" className="hover:bg-slate-600 focus:bg-slate-600 text-sm">
                        Toutes les séries
                      </SelectItem>
                      <SelectItem value="none" className="hover:bg-slate-600 focus:bg-slate-600 text-sm">
                        Sans série
                      </SelectItem>
                      {seriesForSelectedUniverse.map((series) => (
                        <SelectItem
                          key={series}
                          value={series}
                          className="hover:bg-slate-600 focus:bg-slate-600 text-sm"
                        >
                          {series}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-400">
                {filteredAvailableBooks.length} livre{filteredAvailableBooks.length > 1 ? "s" : ""} disponible
                {filteredAvailableBooks.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200 text-sm">Sélectionner un livre</Label>
              <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 h-auto min-h-[4rem] py-3">
                  <SelectValue placeholder="Choisir un livre de votre collection...">
                    {selectedBookId &&
                      (() => {
                        const selectedBook = filteredAvailableBooks.find((book) => book.id === selectedBookId)
                        if (!selectedBook) return "Choisir un livre de votre collection..."

                        return (
                          <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
                            <div className="w-6 h-8 sm:w-8 sm:h-10 bg-slate-600 rounded flex-shrink-0">
                              {selectedBook.thumbnail ? (
                                <BookImage
                                  src={selectedBook.thumbnail}
                                  alt={selectedBook.title}
                                  className="w-6 h-8 sm:w-8 sm:h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-6 h-8 sm:w-8 sm:h-10 bg-slate-600 rounded flex items-center justify-center">
                                  <BookOpen className="w-2 h-2 sm:w-3 sm:h-3 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden text-left">
                              <div className="space-y-0.5">
                                <div
                                  className="font-medium text-xs sm:text-sm leading-tight truncate text-slate-50"
                                  title={selectedBook.title}
                                >
                                  {selectedBook.title.length > 40
                                    ? selectedBook.title.substring(0, 40) + "..."
                                    : selectedBook.title}
                                </div>
                                <div className="text-slate-400 text-xs truncate" title={selectedBook.author}>
                                  {selectedBook.author}
                                </div>
                                {selectedBook.volume && (
                                  <div
                                    className="text-orange-400 text-xs truncate"
                                    title={`Tome ${selectedBook.volume}`}
                                  >
                                    Tome #{selectedBook.volume}
                                  </div>
                                )}
                                {selectedBook.series && (
                                  <div className="text-slate-500 text-xs truncate" title={selectedBook.series}>
                                    (
                                    {selectedBook.series.length > 25
                                      ? selectedBook.series.substring(0, 25) + "..."
                                      : selectedBook.series}
                                    )
                                  </div>
                                )}
                                {selectedBook.universe && (
                                  <div className="text-blue-400 text-xs truncate" title={selectedBook.universe}>
                                    [
                                    {selectedBook.universe.length > 20
                                      ? selectedBook.universe.substring(0, 20) + "..."
                                      : selectedBook.universe}
                                    ]
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-slate-100 max-h-60">
                  {filteredAvailableBooks.map((book) => (
                    <SelectItem
                      key={book.id}
                      value={book.id}
                      className="hover:bg-slate-600 focus:bg-slate-600 py-4 h-auto min-h-[4rem]"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                        <div className="w-6 h-8 sm:w-8 sm:h-10 bg-slate-600 rounded flex-shrink-0">
                          {book.thumbnail ? (
                            <BookImage
                              src={book.thumbnail}
                              alt={book.title}
                              className="w-6 h-8 sm:w-8 sm:h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-6 h-8 sm:w-8 sm:h-10 bg-slate-600 rounded flex items-center justify-center">
                              <BookOpen className="w-2 h-2 sm:w-3 sm:h-3 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="space-y-1">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="font-medium text-xs sm:text-sm min-w-0 leading-tight" title={book.title}>
                                <span className="block sm:hidden line-clamp-2">
                                  {book.title.length > 25 ? book.title.substring(0, 25) + "..." : book.title}
                                </span>
                                <span className="hidden sm:block line-clamp-2">
                                  {book.title.length > 40 ? book.title.substring(0, 40) + "..." : book.title}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-slate-400 text-xs truncate" title={book.author}>
                                {book.author.length > 20 ? book.author.substring(0, 20) + "..." : book.author}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {book.volume && (
                                <span className="text-orange-400 text-xs truncate" title={`Tome ${book.volume}`}>
                                  Tome #{book.volume}
                                </span>
                              )}
                              {book.series && (
                                <span className="text-slate-500 text-xs truncate" title={book.series}>
                                  ({book.series.length > 25 ? book.series.substring(0, 25) + "..." : book.series})
                                </span>
                              )}
                              {book.universe && (
                                <span className="text-blue-400 text-xs truncate" title={book.universe}>
                                  [{book.universe.length > 20 ? book.universe.substring(0, 20) + "..." : book.universe}]
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filteredAvailableBooks.length === 0 && (
                <div className="text-center py-4 text-slate-400 bg-slate-700 rounded-lg">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                  <p className="text-sm">Aucun livre disponible avec ces filtres</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-notes" className="text-slate-200 text-sm">
                Notes de lecture (optionnel)
              </Label>
              <Textarea
                id="book-notes"
                placeholder="Notes sur ce livre dans votre ordre de lecture..."
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100 text-sm"
                rows={3}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddBookOpen(false)}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 order-2 sm:order-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddBookToFolder}
                disabled={!selectedBookId}
                className="bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-500 order-1 sm:order-2"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de dossier */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Modifier le dossier</DialogTitle>
          </DialogHeader>
          {editingFolder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-folder-name" className="text-slate-200">
                  Nom du dossier
                </Label>
                <Input
                  id="edit-folder-name"
                  value={editingFolder.name}
                  onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-folder-description" className="text-slate-200">
                  Description
                </Label>
                <Textarea
                  id="edit-folder-description"
                  value={editingFolder.description || ""}
                  onChange={(e) => setEditingFolder({ ...editingFolder, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                  rows={3}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditingFolder(null)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 order-2 sm:order-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpdateFolder}
                  className="bg-slate-700 hover:bg-slate-600 text-white order-1 sm:order-2"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog des détails du livre */}
      <BookDetailsDialog
        book={selectedBookForDetails}
        open={!!selectedBookForDetails}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBookForDetails(null)
          }
        }}
      />
    </div>
  )
}

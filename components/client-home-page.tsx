"use client"

import { useState, useEffect } from "react"
import { Plus, Search, BarChart3, Book, Library, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import BookCard from "@/components/book-card"
import AddBookDialog from "@/components/add-book-dialog"
import StatsPanel from "@/components/stats-panel"
import ReadingOrderPanel from "@/components/reading-order-panel"
import type { Book as BookType } from "@/types/book"
import type { ReadingFolder } from "@/types/reading-order"
import SortControls, { type SortOption } from "@/components/sort-controls"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

interface ClientHomePageProps {
  initialBooks: BookType[]
  initialWishlist: BookType[]
  initialReadingFolders: ReadingFolder[]
  actions: {
    addBook: (book: BookType) => Promise<BookType>
    updateBook: (book: BookType) => Promise<BookType>
    deleteBook: (bookId: string) => Promise<void>
    addToWishlist: (book: BookType) => Promise<BookType>
    removeFromWishlist: (bookId: string) => Promise<void>
    moveToCollection: (book: BookType) => Promise<BookType>
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
    logout: () => Promise<void>
    createReadingFolder: (folder: Omit<ReadingFolder, "id" | "createdDate">) => Promise<ReadingFolder>
    updateReadingFolder: (folder: ReadingFolder) => Promise<ReadingFolder>
    deleteReadingFolder: (folderId: string) => Promise<void>
    addBookToReadingFolder: (folderId: string, bookId: string, notes?: string) => Promise<void>
    removeBookFromReadingFolder: (folderId: string, bookId: string) => Promise<void>
    reorderBooksInFolder: (folderId: string, books: any[]) => Promise<void>
  }
}

export default function ClientHomePage({
  initialBooks,
  initialWishlist,
  initialReadingFolders,
  actions,
}: ClientHomePageProps) {
  const [books, setBooks] = useState<BookType[]>(initialBooks)
  const [readingFolders, setReadingFolders] = useState<ReadingFolder[]>(initialReadingFolders)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("collection")
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>("all")
  const [selectedUniverseFilter, setSelectedUniverseFilter] = useState<string>("all")
  const [sortOption, setSortOption] = useState<SortOption>({ field: "addedDate", direction: "desc" })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setBooks(initialBooks)
  }, [initialBooks])

  useEffect(() => {
    setReadingFolders(initialReadingFolders)
  }, [initialReadingFolders])

  useEffect(() => {
    setSelectedSeriesFilter("all")
  }, [selectedUniverseFilter])

  const handleAddBook = async (book: BookType) => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const newBook = await actions.addBook(book)
      setBooks((prev) => [...prev, newBook])
      toast({
        title: "✅ Livre ajouté",
        description: `"${newBook.title}" a été ajouté à votre bibliothèque.`,
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter le livre",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBook = async (updatedBook: BookType) => {
    try {
      await actions.updateBook(updatedBook)
      setBooks((prev) => prev.map((book) => (book.id === updatedBook.id ? updatedBook : book)))
      toast({
        title: "✅ Livre modifié",
        description: `"${updatedBook.title}" a été mis à jour.`,
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de modifier le livre",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    try {
      await actions.deleteBook(bookId)
      setBooks((prev) => prev.filter((book) => book.id !== bookId))
      // Remove book from reading folders
      setReadingFolders((prev) =>
        prev.map((folder) => ({
          ...folder,
          books: folder.books.filter((book) => book.bookId !== bookId),
        })),
      )
      toast({
        title: "🗑️ Livre supprimé",
        description: "Le livre a été supprimé de votre bibliothèque.",
      })
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de supprimer le livre",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await actions.logout()
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      })
    }
  }

  // Reading folder handlers
  const handleCreateReadingFolder = async (folder: Omit<ReadingFolder, "id" | "createdDate">) => {
    const newFolder = await actions.createReadingFolder(folder)
    setReadingFolders((prev) => [...prev, newFolder])
    return newFolder
  }

  const handleUpdateReadingFolder = async (folder: ReadingFolder) => {
    const updatedFolder = await actions.updateReadingFolder(folder)
    setReadingFolders((prev) => prev.map((f) => (f.id === folder.id ? updatedFolder : f)))
    return updatedFolder
  }

  const handleDeleteReadingFolder = async (folderId: string) => {
    await actions.deleteReadingFolder(folderId)
    setReadingFolders((prev) => prev.filter((f) => f.id !== folderId))
  }

  const handleAddBookToReadingFolder = async (folderId: string, bookId: string, notes?: string) => {
    await actions.addBookToReadingFolder(folderId, bookId, notes)
    // Refresh reading folders to get updated data
    const folder = readingFolders.find((f) => f.id === folderId)
    if (folder) {
      const newOrder = Math.max(0, ...folder.books.map((book) => book.order)) + 1
      const newBook = {
        bookId,
        order: newOrder,
        addedDate: new Date().toISOString(),
        notes: notes?.trim() || undefined,
      }
      setReadingFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, books: [...f.books, newBook] } : f)))
    }
  }

  const handleRemoveBookFromReadingFolder = async (folderId: string, bookId: string) => {
    await actions.removeBookFromReadingFolder(folderId, bookId)
    setReadingFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? {
              ...f,
              books: f.books
                .filter((book) => book.bookId !== bookId)
                .sort((a, b) => a.order - b.order)
                .map((book, index) => ({ ...book, order: index + 1 })),
            }
          : f,
      ),
    )
  }

  const handleReorderBooksInFolder = async (folderId: string, books: any[]) => {
    await actions.reorderBooksInFolder(folderId, books)
    setReadingFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, books } : f)))
  }

  const sortBooks = (books: BookType[], sortOption: SortOption): BookType[] => {
    return [...books].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortOption.field) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "author":
          aValue = a.author.toLowerCase()
          bValue = b.author.toLowerCase()
          break
        case "publishedDate":
          aValue = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
          bValue = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
          break
        case "addedDate":
          aValue = a.addedDate ? new Date(a.addedDate).getTime() : 0
          bValue = b.addedDate ? new Date(b.addedDate).getTime() : 0
          break
        case "rating":
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case "pageCount":
          aValue = a.pageCount || 0
          bValue = b.pageCount || 0
          break
        case "condition":
          const conditionOrder = { mint: 4, good: 3, fair: 2, poor: 1 }
          aValue = conditionOrder[a.condition] || 0
          bValue = conditionOrder[b.condition] || 0
          break
        case "volume":
          aValue = a.volume || 999999
          bValue = b.volume || 999999
          break
        case "universe":
          aValue = a.universe?.toLowerCase() || ""
          bValue = b.universe?.toLowerCase() || ""
          break
        default:
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
      }

      if (aValue < bValue) return sortOption.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortOption.direction === "asc" ? 1 : -1
      return 0
    })
  }

  const getSeriesForUniverse = (universe?: string): string[] => {
    return Array.from(
      new Set(
        books
          .filter((book) => {
            // Only include books that have a series
            if (!book.series) return false

            if (!universe || universe.trim() === "") {
              // If no universe specified, show only series without universe
              return !book.universe || book.universe.trim() === ""
            } else {
              // If universe specified, show only series from that universe
              return book.universe === universe
            }
          })
          .map((book) => book.series!),
      ),
    )
  }

  const filteredBooks = sortBooks(
    books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.series?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.genre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.content?.toLowerCase().includes(searchTerm.toLowerCase()) // Recherche dans le contenu

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "read" && book.isRead) ||
        (filterStatus === "unread" && !book.isRead) ||
        filterStatus === book.condition

      const matchesGenre = !sortOption.genreFilter || book.genre === sortOption.genreFilter

      const matchesSeries =
        selectedSeriesFilter === "all" ||
        (selectedSeriesFilter === "none" && (!book.series || book.series.trim() === "")) ||
        (book.series && book.series.toLowerCase() === selectedSeriesFilter.toLowerCase())

      const matchesUniverse =
        selectedUniverseFilter === "all" ||
        (selectedUniverseFilter === "none" && (!book.universe || book.universe.trim() === "")) ||
        (book.universe && book.universe.toLowerCase() === selectedUniverseFilter.toLowerCase())

      return matchesSearch && matchesFilter && matchesGenre && matchesSeries && matchesUniverse
    }),
    sortOption,
  )

  const availableSeries = Array.from(
    new Set(
      books
        .filter((book) => {
          // Only include books that have a series
          if (!book.series) return false

          // Filter based on selected universe
          if (selectedUniverseFilter === "all") {
            // Show all series regardless of universe
            return true
          } else if (selectedUniverseFilter === "none") {
            // Show only series that don't have an universe
            return !book.universe || book.universe.trim() === ""
          } else {
            // Show only series that belong to the selected universe
            return book.universe && book.universe.toLowerCase() === selectedUniverseFilter.toLowerCase()
          }
        })
        .map((book) => book.series!),
    ),
  )

  const availableUniverses = Array.from(new Set(books.filter((book) => book.universe).map((book) => book.universe!)))

  const genres = Array.from(new Set(books.filter((book) => book.genre).map((book) => book.genre)))

  // Vérifier si des filtres sont appliqués
  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterStatus !== "all" ||
    selectedSeriesFilter !== "all" ||
    selectedUniverseFilter !== "all" ||
    sortOption.genreFilter

  // Texte pour l'onglet collection avec compteur
  const getCollectionTabText = () => {
    if (hasActiveFilters && filteredBooks.length !== books.length) {
      return `Ma Collection (${books.length}) - ${filteredBooks.length} résultat${filteredBooks.length > 1 ? "s" : ""}`
    }
    return `Ma Collection (${books.length})`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Library className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">Ma Bibliothèque Personnelle</h1>
          </div>
          <p className="text-slate-200 max-w-xl mx-auto text-center">
            Gérez votre collection de livres personnelle. Suivez vos lectures, organisez vos genres favoris et découvrez
            de nouveaux titres.
          </p>
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold hover:text-slate-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un livre
          </Button>
        </div>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-slate-800 border border-slate-600 p-2 rounded-lg mb-6">
            <TabsTrigger
              value="collection"
              className="bg-slate-700 border border-slate-600 text-slate-200 hover:text-slate-50 hover:bg-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:border-blue-500 rounded-md py-3 px-4 text-sm"
            >
              <Book className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{getCollectionTabText()}</span>
            </TabsTrigger>
            <TabsTrigger
              value="reading-order"
              className="bg-slate-700 border border-slate-600 text-slate-200 hover:text-slate-50 hover:bg-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:border-blue-500 rounded-md py-3 px-4"
            >
              <BookMarked className="w-4 h-4 mr-2" />
              Ordre de lecture ({readingFolders.length})
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="bg-slate-700 border border-slate-600 text-slate-200 hover:text-slate-50 hover:bg-slate-600 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:border-blue-500 rounded-md py-3 px-4"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-6 flex flex-col gap-6">
            {/* Barre de recherche et filtres */}
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input
                      placeholder="Rechercher par titre, auteur, série, genre ou contenu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-300 hover:border-slate-400 focus:border-slate-400"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {/* Filtres de statut */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterStatus("all")}
                        className={
                          filterStatus === "all"
                            ? "bg-blue-500 text-white hover:bg-blue-600 hover:text-slate-50 border-blue-500"
                            : "border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
                        }
                      >
                        Tous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterStatus("read")}
                        className={
                          filterStatus === "read"
                            ? "bg-green-600 text-white hover:bg-green-700 hover:text-slate-50 border-green-600"
                            : "border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
                        }
                      >
                        Lus
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterStatus("unread")}
                        className={
                          filterStatus === "unread"
                            ? "bg-red-600 text-white hover:bg-red-700 hover:text-slate-50 border-red-600"
                            : "border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
                        }
                      >
                        Non lus
                      </Button>
                    </div>

                    {/* Contrôles de tri et filtre par série */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      {availableUniverses.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-200 whitespace-nowrap text-sm font-medium">Univers :</Label>
                          <Select value={selectedUniverseFilter} onValueChange={setSelectedUniverseFilter}>
                            <SelectTrigger className="w-48 bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
                              <SelectItem value="all" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                                Tous les univers
                              </SelectItem>
                              <SelectItem value="none" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                                Sans univers
                              </SelectItem>
                              {availableUniverses.map((universeName) => (
                                <SelectItem
                                  key={universeName}
                                  value={universeName}
                                  className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100"
                                >
                                  {universeName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {availableSeries.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-200 whitespace-nowrap text-sm font-medium">Série :</Label>
                          <Select value={selectedSeriesFilter} onValueChange={setSelectedSeriesFilter}>
                            <SelectTrigger className="w-48 bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
                              <SelectItem value="all" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                                Toutes les séries
                              </SelectItem>
                              <SelectItem value="none" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                                Sans série
                              </SelectItem>
                              {availableSeries.map((seriesName) => (
                                <SelectItem
                                  key={seriesName}
                                  value={seriesName}
                                  className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100"
                                >
                                  {seriesName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <SortControls sortOption={sortOption} onSortChange={setSortOption} availableGenres={genres} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grille des livres */}
            {filteredBooks.length === 0 ? (
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-8 text-center">
                  <Book className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-50 mb-2">
                    {books.length === 0 ? "Aucun livre dans votre bibliothèque" : "Aucun livre trouvé"}
                  </h3>
                  <p className="text-slate-300 mb-4">
                    {books.length === 0
                      ? "Commencez par ajouter votre premier livre !"
                      : "Essayez de modifier vos critères de recherche."}
                  </p>
                  {books.length === 0 && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white hover:text-slate-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter mon premier livre
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onUpdate={handleUpdateBook}
                    onDelete={handleDeleteBook}
                    availableSeries={availableSeries}
                    availableUniverses={availableUniverses}
                    getSeriesForUniverse={getSeriesForUniverse}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reading-order" className="mt-6">
            <ReadingOrderPanel
              books={books}
              readingFolders={readingFolders}
              onCreateFolder={handleCreateReadingFolder}
              onUpdateFolder={handleUpdateReadingFolder}
              onDeleteFolder={handleDeleteReadingFolder}
              onAddBookToFolder={handleAddBookToReadingFolder}
              onRemoveBookFromFolder={handleRemoveBookFromReadingFolder}
              onReorderBooks={handleReorderBooksInFolder}
              onUpdateBook={handleUpdateBook}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <StatsPanel books={books} />
          </TabsContent>
        </Tabs>

        {/* Dialog d'ajout de livre */}
        <AddBookDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddBook={handleAddBook}
          availableSeries={availableSeries}
          availableUniverses={availableUniverses}
          isPending={isLoading}
          getSeriesForUniverse={getSeriesForUniverse}
        />
      </div>
    </div>
  )
}

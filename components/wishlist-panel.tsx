"use client"

import { useState } from "react"
import { Search, Plus, Heart, ShoppingCart, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Book } from "@/types/book"
import BookImage from "@/components/book-image"

interface WishlistPanelProps {
  wishlist: Book[]
  onAddToWishlist: (book: Book) => void
  onRemoveFromWishlist: (bookId: string) => void
  onMoveToCollection: (book: Book) => void
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
  }
}

export default function WishlistPanel({
  wishlist,
  onAddToWishlist,
  onRemoveFromWishlist,
  onMoveToCollection,
}: WishlistPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const searchBooks = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=10&langRestrict=fr,en`,
      )
      const data = await response.json()
      setSearchResults(data.items || [])
    } catch (error) {
      console.error("Erreur lors de la recherche:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const addToWishlist = (book: GoogleBook) => {
    const betterThumbnail =
      book.volumeInfo.imageLinks?.thumbnail?.replace("&zoom=1", "&zoom=0") ||
      book.volumeInfo.imageLinks?.smallThumbnail?.replace("&zoom=1", "&zoom=0")

    const wishlistBook: Book = {
      id: "",
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors?.[0] || "Auteur inconnu",
      genre: book.volumeInfo.categories?.[0],
      thumbnail: betterThumbnail,
      condition: "good",
      isRead: false,
      addedDate: new Date().toISOString().split("T")[0],
    }

    onAddToWishlist(wishlistBook)
    setIsAddDialogOpen(false)
    setSearchTerm("")
    setSearchResults([])
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Ma Liste de Souhaits</h2>
          <p className="text-slate-400">Livres que vous souhaitez acquérir</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter à la liste
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter à la liste de souhaits</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Recherche */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un livre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchBooks()}
                    className="pl-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <Button
                  onClick={searchBooks}
                  disabled={isSearching || !searchTerm.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Résultats */}
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.map((book) => (
                    <Card key={book.id} className="bg-slate-700 border-slate-600">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <BookImage
                            src={book.volumeInfo.imageLinks?.thumbnail}
                            alt={book.volumeInfo.title}
                            className="w-12 h-16 bg-slate-600 rounded flex-shrink-0"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{book.volumeInfo.title}</h4>
                            <p className="text-slate-400 text-xs">{book.volumeInfo.authors?.[0] || "Auteur inconnu"}</p>
                            {book.volumeInfo.publishedDate && (
                              <p className="text-slate-500 text-xs">{book.volumeInfo.publishedDate}</p>
                            )}
                            {book.volumeInfo.categories && (
                              <Badge variant="outline" className="text-xs border-slate-500 text-slate-300 mt-1">
                                {book.volumeInfo.categories[0]}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToWishlist(book)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste de la wishlist */}
      {wishlist.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Heart className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Votre liste de souhaits est vide</h3>
            <p className="text-slate-400 mb-4">
              Ajoutez des livres que vous souhaitez acquérir pour votre bibliothèque !
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter mon premier souhait
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((book) => (
            <Card key={book.id} className="bg-slate-800 border-slate-700 hover:border-blue-400 transition-colors">
              <CardHeader className="pb-3">
                <BookImage
                  src={book.thumbnail}
                  alt={book.title}
                  className="aspect-[3/4] bg-slate-700 rounded-lg mb-3"
                  loading="lazy"
                />

                <div className="space-y-2">
                  <h3 className="font-semibold text-white line-clamp-2 text-sm">{book.title}</h3>
                  <p className="text-slate-400 text-xs">{book.author}</p>
                  <div className="flex flex-wrap gap-1">
                    {book.genre && (
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                        {book.genre}
                      </Badge>
                    )}
                    {book.series && (
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                        {book.series} {book.volume && `#${book.volume}`}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onMoveToCollection(book)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Acquis
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveFromWishlist(book.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {book.addedDate && (
                  <p className="text-xs text-slate-500">
                    Ajouté le {new Date(book.addedDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

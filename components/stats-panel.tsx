"use client"

import { useState } from "react"
import { Book, BarChart3, Calendar, Star, BookOpen, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Book as BookType } from "@/types/book"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import BookImage from "@/components/book-image"
import { CONDITION_LABELS, CONDITION_BADGE_COLORS, formatDate } from "@/lib/constants"

interface StatsPanelProps {
  books: BookType[]
}

export default function StatsPanel({ books }: StatsPanelProps) {
  const totalBooks = books.length
  const readBooks = books.filter((book) => book.isRead).length
  const unreadBooks = totalBooks - readBooks
  const readingProgress = totalBooks > 0 ? (readBooks / totalBooks) * 100 : 0

  // Statistiques par condition
  const conditionStats = {
    mint: books.filter((book) => book.condition === "mint").length,
    good: books.filter((book) => book.condition === "good").length,
    fair: books.filter((book) => book.condition === "fair").length,
    poor: books.filter((book) => book.condition === "poor").length,
  }

  // Genres les plus populaires
  const genreCount = books.reduce(
    (acc, book) => {
      if (book.genre) {
        acc[book.genre] = (acc[book.genre] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const topGenres = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Auteurs les plus lus
  const authorCount = books.reduce(
    (acc, book) => {
      acc[book.author] = (acc[book.author] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topAuthors = Object.entries(authorCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Note moyenne
  const ratedBooks = books.filter((book) => book.rating)
  const averageRating =
    ratedBooks.length > 0 ? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / ratedBooks.length : 0

  // Pages totales lues
  const totalPagesRead = books
    .filter((book) => book.isRead && book.pageCount)
    .reduce((sum, book) => sum + (book.pageCount || 0), 0)

  // Livres ajoutés récemment
  const recentBooks = books
    .filter((book) => book.addedDate)
    .sort((a, b) => new Date(b.addedDate!).getTime() - new Date(a.addedDate!).getTime())
    .slice(0, 3)

  // Système de détection automatique des univers
  const analyzeUniverses = (books: BookType[]) => {
    const universes: Record<string, { total: number; books: BookType[] }> = {}
    const assignedBooks = new Set<string>()

    // 1. PRIORITÉ 1 : Groupement par série
    books.forEach((book) => {
      if (book.series && book.series.trim() && !assignedBooks.has(book.id)) {
        const seriesName = book.series.trim()
        if (!universes[seriesName]) {
          universes[seriesName] = { total: 0, books: [] }
        }
        universes[seriesName].total++
        universes[seriesName].books.push(book)
        assignedBooks.add(book.id)
      }
    })

    // 2. PRIORITÉ 2 : Groupement par auteur (pour les auteurs avec 2+ livres non assignés)
    const remainingBooks = books.filter((book) => !assignedBooks.has(book.id))
    const authorGroups = remainingBooks.reduce(
      (acc, book) => {
        const author = book.author.trim()
        if (!acc[author]) acc[author] = []
        acc[author].push(book)
        return acc
      },
      {} as Record<string, BookType[]>,
    )

    Object.entries(authorGroups).forEach(([author, authorBooks]) => {
      if (authorBooks.length >= 2) {
        const universeName = `Univers ${author}`
        universes[universeName] = { total: authorBooks.length, books: authorBooks }
        authorBooks.forEach((book) => assignedBooks.add(book.id))
      }
    })

    // 3. PRIORITÉ 3 : Groupement par genre (pour les genres avec 2+ livres non assignés)
    const remainingAfterAuthor = books.filter((book) => !assignedBooks.has(book.id))
    const genreGroups = remainingAfterAuthor.reduce(
      (acc, book) => {
        if (book.genre && book.genre.trim()) {
          const genre = book.genre.trim()
          if (!acc[genre]) acc[genre] = []
          acc[genre].push(book)
        }
        return acc
      },
      {} as Record<string, BookType[]>,
    )

    Object.entries(genreGroups).forEach(([genre, genreBooks]) => {
      if (genreBooks.length >= 2) {
        const universeName = `Dossier ${genre}`
        universes[universeName] = { total: genreBooks.length, books: genreBooks }
        genreBooks.forEach((book) => assignedBooks.add(book.id))
      }
    })

    // 4. PRIORITÉ 4 : Groupement par éditeur (pour les éditeurs avec 2+ livres non assignés)
    const remainingAfterGenre = books.filter((book) => !assignedBooks.has(book.id))
    const publisherGroups = remainingAfterGenre.reduce(
      (acc, book) => {
        if (book.publisher && book.publisher.trim()) {
          const publisher = book.publisher.trim()
          if (!acc[publisher]) acc[publisher] = []
          acc[publisher].push(book)
        }
        return acc
      },
      {} as Record<string, BookType[]>,
    )

    Object.entries(publisherGroups).forEach(([publisher, publisherBooks]) => {
      if (publisherBooks.length >= 2) {
        const universeName = `Éditions ${publisher}`
        universes[universeName] = { total: publisherBooks.length, books: publisherBooks }
        publisherBooks.forEach((book) => assignedBooks.add(book.id))
      }
    })

    // 5. PRIORITÉ 5 : Détection de mots-clés récurrents
    const finalRemainingBooks = books.filter((book) => !assignedBooks.has(book.id))
    if (finalRemainingBooks.length >= 2) {
      const wordFrequency = analyzeWordFrequency(finalRemainingBooks)
      const significantWords = Object.entries(wordFrequency)
        .filter(([word, data]) => data.count >= 2 && word.length > 3)
        .sort(([, a], [, b]) => b.count - a.count)

      if (significantWords.length > 0) {
        const [topWord, topData] = significantWords[0]
        const universeName = `Thème ${topWord.charAt(0).toUpperCase() + topWord.slice(1)}`
        universes[universeName] = { total: topData.books.length, books: topData.books }
        topData.books.forEach((book) => assignedBooks.add(book.id))
      }
    }

    return universes
  }

  // Analyser la fréquence des mots dans les titres
  const analyzeWordFrequency = (books: BookType[]) => {
    const wordCount: Record<string, { count: number; books: BookType[] }> = {}
    const stopWords = [
      "the",
      "and",
      "of",
      "in",
      "to",
      "for",
      "with",
      "by",
      "from",
      "une",
      "des",
      "les",
      "dans",
      "pour",
      "avec",
      "par",
      "tome",
      "volume",
      "vol",
    ]

    books.forEach((book) => {
      const words = book.title
        .toLowerCase()
        .replace(/[:\-–—,.!?#0-9]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.includes(word))

      words.forEach((word) => {
        if (!wordCount[word]) {
          wordCount[word] = { count: 0, books: [] }
        }
        if (!wordCount[word].books.find((b) => b.id === book.id)) {
          wordCount[word].count++
          wordCount[word].books.push(book)
        }
      })
    })

    return wordCount
  }

  const universeStats = analyzeUniverses(books)
  const sortedUniverses = Object.entries(universeStats).sort(([, a], [, b]) => b.total - a.total)

  // Composant pour filtrer par condition
  const ConditionFilter = ({ books }: { books: BookType[] }) => {
    const [selectedCondition, setSelectedCondition] = useState<string>("all")

    const getConditionColor = (condition: string) => {
      const colorMap = {
        mint: "bg-green-500",
        good: "bg-blue-500",
        fair: "bg-orange-500",
        poor: "bg-red-500",
      }
      return colorMap[condition as keyof typeof colorMap] || "bg-gray-500"
    }

    const filteredBooks =
      selectedCondition === "all" ? books : books.filter((book) => book.condition === selectedCondition)

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCondition("all")}
            className={
              selectedCondition === "all"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "border-slate-600 text-white hover:bg-slate-700 bg-transparent"
            }
          >
            Tous ({books.length})
          </Button>
          {Object.entries(conditionStats).map(([condition, count]) => (
            <Button
              key={condition}
              variant="outline"
              size="sm"
              onClick={() => setSelectedCondition(condition)}
              className={
                selectedCondition === condition
                  ? `${getConditionColor(condition)} text-white hover:opacity-80`
                  : "border-slate-600 text-white hover:bg-slate-700 bg-transparent"
              }
            >
              <div className={`w-2 h-2 ${getConditionColor(condition)} rounded-full mr-2`}></div>
              {CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS]} ({count})
            </Button>
          ))}
        </div>

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {filteredBooks
              .sort((a, b) => {
                if (a.addedDate && b.addedDate) {
                  return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
                }
                return a.title.localeCompare(b.title)
              })
              .map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <BookImage
                    src={book.thumbnail}
                    alt={book.title}
                    className="w-10 h-12 bg-slate-600 rounded flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm line-clamp-1">{book.title}</h4>
                    <p className="text-slate-400 text-xs">{book.author}</p>
                    {book.genre && <p className="text-slate-500 text-xs">{book.genre}</p>}
                    {book.addedDate && <p className="text-slate-500 text-xs">Ajouté le {formatDate(book.addedDate)}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {book.isRead && <Badge className="bg-green-600 text-white text-xs">Lu</Badge>}
                    <Badge className={`${getConditionColor(book.condition)} text-white text-xs`}>
                      {CONDITION_LABELS[book.condition as keyof typeof CONDITION_LABELS]}
                    </Badge>
                    {book.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-yellow-400 text-xs">{book.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-slate-700 rounded-lg">
            <p className="text-slate-400">Aucun livre trouvé pour cette condition</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Livres</CardTitle>
            <Book className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalBooks}</div>
            <p className="text-xs text-slate-400">dans votre bibliothèque</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Livres Lus</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{readBooks}</div>
            <p className="text-xs text-slate-400">{readingProgress.toFixed(1)}% de votre collection</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Pages Lues</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalPagesRead.toLocaleString()}</div>
            <p className="text-xs text-slate-400">pages au total</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</div>
            <p className="text-xs text-slate-400">
              {ratedBooks.length} livre{ratedBooks.length > 1 ? "s" : ""} noté{ratedBooks.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets pour les différentes analyses */}
      <Tabs defaultValue="genres" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-slate-800 border-slate-700 p-2">
          <TabsTrigger
            value="genres"
            className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-200 hover:text-slate-50 whitespace-normal text-center"
          >
            Genres & Auteurs
          </TabsTrigger>
          <TabsTrigger
            value="universes"
            className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-200 hover:text-slate-50 whitespace-normal text-center"
          >
            Séries & Univers
          </TabsTrigger>
          <TabsTrigger
            value="condition"
            className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-slate-200 hover:text-slate-50 whitespace-normal text-center"
          >
            État & Récents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genres" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genres populaires */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Genres Favoris</CardTitle>
                <CardDescription className="text-slate-400">Vos genres les plus collectionnés</CardDescription>
              </CardHeader>
              <CardContent>
                {topGenres.length > 0 ? (
                  <div className="space-y-3">
                    {topGenres.map(([genre, count], index) => (
                      <div key={genre} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-semibold">#{index + 1}</span>
                          <span className="text-slate-300">{genre}</span>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {count} livre{count > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Aucun genre défini dans votre collection</p>
                )}
              </CardContent>
            </Card>

            {/* Auteurs populaires */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Auteurs Favoris
                </CardTitle>
                <CardDescription className="text-slate-400">Vos auteurs les plus lus</CardDescription>
              </CardHeader>
              <CardContent>
                {topAuthors.length > 0 ? (
                  <div className="space-y-3">
                    {topAuthors.map(([author, count], index) => (
                      <div key={author} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-semibold">#{index + 1}</span>
                          <span className="text-slate-300 line-clamp-1">{author}</span>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {count} livre{count > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Aucun auteur dans votre collection</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="universes" className="space-y-6">
          {Object.keys(universeStats).length > 0 ? (
            <div className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">📚 Séries & Univers</CardTitle>
                  <CardDescription className="text-slate-400">
                    Vos livres organisés automatiquement par série, auteur ou thème
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {sortedUniverses.map(([universeName, universeData]) => (
                      <AccordionItem key={universeName} value={universeName} className="border-slate-700">
                        <AccordionTrigger className="text-white hover:text-blue-400">
                          <div className="flex items-center justify-between w-full mr-4">
                            <span className="font-semibold">{universeName}</span>
                            <Badge className="bg-blue-600 text-white">
                              {universeData.total} livre{universeData.total > 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            {/* Statistiques de l'univers */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-lg font-bold text-white">{universeData.total}</div>
                                <div className="text-xs text-slate-400">Total livres</div>
                              </div>
                              <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-lg font-bold text-green-400">
                                  {universeData.books.filter((book) => book.isRead).length}
                                </div>
                                <div className="text-xs text-slate-400">Lus</div>
                              </div>
                              <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-lg font-bold text-purple-400">
                                  {universeData.books
                                    .filter((book) => book.pageCount)
                                    .reduce((sum, book) => sum + (book.pageCount || 0), 0)
                                    .toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-400">Pages</div>
                              </div>
                              <div className="bg-slate-700 p-3 rounded-lg text-center">
                                <div className="text-lg font-bold text-yellow-400">
                                  {universeData.books.filter((book) => book.rating).length > 0
                                    ? (
                                        universeData.books
                                          .filter((book) => book.rating)
                                          .reduce((sum, book) => sum + (book.rating || 0), 0) /
                                        universeData.books.filter((book) => book.rating).length
                                      ).toFixed(1)
                                    : "—"}
                                </div>
                                <div className="text-xs text-slate-400">Note moy.</div>
                              </div>
                            </div>

                            {/* Liste des livres de cet univers */}
                            <div>
                              <h4 className="text-sm font-semibold text-slate-300 mb-3">Livres de ce dossier :</h4>
                              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                {universeData.books
                                  .sort((a, b) => {
                                    if (a.volume && b.volume) return a.volume - b.volume
                                    return a.title.localeCompare(b.title)
                                  })
                                  .map((book) => (
                                    <div
                                      key={book.id}
                                      className="flex items-center gap-3 p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                                    >
                                      <BookImage
                                        src={book.thumbnail}
                                        alt={book.title}
                                        className="w-8 h-10 bg-slate-600 rounded flex-shrink-0"
                                        loading="lazy"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-white text-xs line-clamp-1">
                                          {book.volume && `#${book.volume} - `}
                                          {book.title}
                                        </h5>
                                        <p className="text-slate-400 text-xs">{book.author}</p>
                                        {book.publishedDate && (
                                          <p className="text-slate-500 text-xs">{book.publishedDate}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {book.isRead && <Badge className="bg-green-600 text-white text-xs">Lu</Badge>}
                                        {book.rating && (
                                          <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <span className="text-yellow-400 text-xs">{book.rating}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2">Aucune série ou univers détecté</h3>
                <p className="text-slate-400 mb-4">
                  Ajoutez des livres avec des séries ou plusieurs livres du même auteur pour voir apparaître vos univers
                  !
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="condition" className="space-y-6">
          {/* État des livres avec filtres */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">État de la Collection</CardTitle>
              <CardDescription className="text-slate-400">Répartition par condition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(conditionStats).map(([condition, count]) => (
                  <div key={condition} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 ${CONDITION_BADGE_COLORS[condition as keyof typeof CONDITION_BADGE_COLORS]} rounded-full`}
                      ></div>
                      <span className="text-slate-300 text-sm">
                        {CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS]}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filtres par condition */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Filtrer par État</CardTitle>
              <CardDescription className="text-slate-400">
                Voir tous les livres d'une condition spécifique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConditionFilter books={books} />
            </CardContent>
          </Card>

          {/* Ajouts récents */}
          {recentBooks.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  Ajouts Récents
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Derniers livres ajoutés à votre bibliothèque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentBooks.map((book) => (
                    <div key={book.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <BookImage
                        src={book.thumbnail}
                        alt={book.title}
                        className="w-10 h-12 bg-slate-600 rounded flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm line-clamp-1">{book.title}</h4>
                        <p className="text-slate-400 text-xs">{book.author}</p>
                        {book.genre && <p className="text-slate-500 text-xs">{book.genre}</p>}
                        <p className="text-slate-500 text-xs">Ajouté le {formatDate(book.addedDate!)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {book.isRead && <Badge className="bg-green-600 text-white">Lu</Badge>}
                        <Badge
                          className={`${CONDITION_BADGE_COLORS[book.condition as keyof typeof CONDITION_BADGE_COLORS]} text-white text-xs`}
                        >
                          {CONDITION_LABELS[book.condition as keyof typeof CONDITION_LABELS]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

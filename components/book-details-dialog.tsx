"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import BookImage from "@/components/book-image"
import type { Book } from "@/types/book"
import { User, BookOpen, Calendar, Hash, Star, Eye, CalendarPlus, Globe, Library, FileText } from "lucide-react"
import { CONDITION_LABELS, CONDITION_COLORS, formatDate, formatDateTime } from "@/lib/constants"

interface BookDetailsDialogProps {
  book: Book | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BookDetailsDialog({ book, open, onOpenChange }: BookDetailsDialogProps) {
  if (!book) return null

  const getConditionLabel = (condition?: string) => {
    return CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS] || condition
  }

  const getConditionColor = (condition?: string) => {
    return (
      CONDITION_COLORS[condition as keyof typeof CONDITION_COLORS] ||
      "bg-slate-500/20 text-slate-200 border-slate-500/30"
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-600 text-slate-50 max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-50">{book.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <div className="flex-shrink-0 w-full md:w-1/3 flex justify-center items-start">
            <BookImage
              src={book.thumbnail}
              alt={book.title}
              className="w-48 h-64 md:w-full md:h-auto max-h-96 object-contain"
            />
          </div>

          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-semibold text-slate-100">{book.title}</h2>
            <p className="text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{book.author}</span>
            </p>

            {book.description && (
              <div className="text-slate-400 text-sm leading-relaxed max-h-40 overflow-y-auto pr-2">
                <p>{book.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {book.genre && (
                <Badge variant="outline" className="text-sm border-slate-500 text-slate-200">
                  {book.genre}
                </Badge>
              )}
              <Badge variant="outline" className={`text-sm ${getConditionColor(book.condition)}`}>
                {getConditionLabel(book.condition)}
              </Badge>
              {book.isRead && (
                <Badge variant="outline" className="text-sm border-green-500 text-green-200">
                  <Eye className="w-3 h-3 mr-1" />
                  Lu
                </Badge>
              )}
              {book.universe && (
                <Badge variant="outline" className="text-sm border-cyan-500 text-cyan-200">
                  <Globe className="w-3 h-3 mr-1" />
                  {book.universe}
                </Badge>
              )}
              {book.series && (
                <Badge variant="outline" className="text-sm border-indigo-500 text-indigo-200">
                  <Library className="w-3 h-3 mr-1" />
                  {book.series} {book.volume && `#${book.volume}`}
                </Badge>
              )}
              {book.volume && !book.series && (
                <Badge variant="outline" className="text-sm border-orange-500 text-orange-200">
                  Tome {book.volume}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              {book.universe && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Univers: {book.universe}</span>
                </div>
              )}
              {book.series && (
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-indigo-400" />
                  <span>Série: {book.series}</span>
                </div>
              )}
              {book.publisher && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Éditeur: {book.publisher}</span>
                </div>
              )}
              {book.publishedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Publié le: {formatDate(book.publishedDate)}</span>
                </div>
              )}
              {book.pageCount && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span>{book.pageCount} pages</span>
                </div>
              )}
              {book.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>Note: {book.rating}/5</span>
                </div>
              )}
              {book.isRead && book.readDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Lu le: {formatDate(book.readDate)}</span>
                </div>
              )}
              {book.addedDate && (
                <div className="flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  <span>Ajouté le: {formatDateTime(book.addedDate)}</span>
                </div>
              )}
            </div>

            {book.content && (
              <div className="text-sm text-slate-300 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <p className="font-semibold">Contenu inclus :</p>
                </div>
                <div className="bg-slate-700 p-3 rounded-md max-h-32 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{book.content}</p>
                </div>
              </div>
            )}

            {book.notes && (
              <div className="text-sm text-slate-300 italic mt-4">
                <p className="font-semibold">Notes personnelles :</p>
                <p>"{book.notes}"</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

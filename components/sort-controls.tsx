"use client"

import { ArrowUp, ArrowDown, Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export interface SortOption {
  field:
    | "title"
    | "author"
    | "publishedDate"
    | "addedDate"
    | "rating"
    | "pageCount"
    | "condition"
    | "genre"
    | "volume"
    | "universe"
  direction: "asc" | "desc"
  genreFilter?: string
}

interface SortControlsProps {
  sortOption: SortOption
  onSortChange: (sortOption: SortOption) => void
  availableGenres: string[]
}

export default function SortControls({ sortOption, onSortChange, availableGenres }: SortControlsProps) {
  const handleFieldChange = (field: string) => {
    onSortChange({
      ...sortOption,
      field: field as SortOption["field"],
    })
  }

  const toggleDirection = () => {
    onSortChange({
      ...sortOption,
      direction: sortOption.direction === "asc" ? "desc" : "asc",
    })
  }

  const getSortLabel = (field: string) => {
    switch (field) {
      case "title":
        return "Titre"
      case "author":
        return "Auteur"
      case "publishedDate":
        return "Date de publication"
      case "addedDate":
        return "Date d'ajout"
      case "rating":
        return "Note"
      case "pageCount":
        return "Nombre de pages"
      case "condition":
        return "État"
      case "genre":
        return "Genre"
      case "volume":
        return "Tome/Numéro"
      case "universe":
        return "Univers"
      default:
        return "Titre"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-slate-200 whitespace-nowrap text-sm font-medium">Trier par :</Label>
      <Select value={sortOption.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-full sm:w-40 bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
          <SelectItem value="title" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Titre
          </SelectItem>
          <SelectItem value="author" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Auteur
          </SelectItem>
          <SelectItem value="volume" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Tome/Numéro
          </SelectItem>
          <SelectItem value="publishedDate" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Date de publication
          </SelectItem>
          <SelectItem value="addedDate" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Date d'ajout
          </SelectItem>
          <SelectItem value="rating" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Note
          </SelectItem>
          <SelectItem value="pageCount" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Nb de pages
          </SelectItem>
          <SelectItem value="condition" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            État
          </SelectItem>
          <SelectItem value="genre" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            Genre
          </SelectItem>
          <SelectItem value="universe" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Univers</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {sortOption.field === "genre" && availableGenres.length > 0 && (
        <Select
          value={sortOption.genreFilter || "all"}
          onValueChange={(value) =>
            onSortChange({
              ...sortOption,
              genreFilter: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-40 bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-500 text-slate-100">
            <SelectItem value="all" className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
              Tous les genres
            </SelectItem>
            {availableGenres.map((genre) => (
              <SelectItem key={genre} value={genre} className="hover:bg-slate-600 focus:bg-slate-600 text-slate-100">
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={toggleDirection}
        className="border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400 bg-slate-700 hover:text-slate-50"
        title={`${getSortLabel(sortOption.field)} ${sortOption.direction === "asc" ? "croissant" : "décroissant"}`}
      >
        {sortOption.direction === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
      </Button>
    </div>
  )
}

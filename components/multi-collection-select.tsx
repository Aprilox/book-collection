"use client"

import { useState } from "react"
import { Check, X, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Collection } from "@/components/collections-manager"

interface MultiCollectionSelectProps {
  collections: Collection[]
  selectedCollections: string[]
  onSelectionChange: (selectedCollections: string[]) => void
  placeholder?: string
}

export default function MultiCollectionSelect({
  collections,
  selectedCollections,
  onSelectionChange,
  placeholder = "Sélectionner des dossiers...",
}: MultiCollectionSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const toggleCollection = (collectionId: string) => {
    console.log("Toggling collection:", collectionId, "Current selection:", selectedCollections)
    const newSelection = selectedCollections.includes(collectionId)
      ? selectedCollections.filter((id) => id !== collectionId)
      : [...selectedCollections, collectionId]

    console.log("New selection:", newSelection)
    onSelectionChange(newSelection)
  }

  const removeCollection = (collectionId: string) => {
    onSelectionChange(selectedCollections.filter((id) => id !== collectionId))
  }

  const getSelectedCollections = () => {
    return collections.filter((collection) => selectedCollections.includes(collection.id))
  }

  // Filtrer les collections selon le terme de recherche
  const filteredCollections = collections.filter(
    (collection) =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.description && collection.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            {selectedCollections.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              <span className="text-white">
                {selectedCollections.length} dossier{selectedCollections.length > 1 ? "s" : ""} sélectionné
                {selectedCollections.length > 1 ? "s" : ""}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-slate-800 border-slate-600" align="start">
          <div className="bg-slate-800 border-0">
            {/* Barre de recherche */}
            <div className="flex items-center border-b border-slate-700 px-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                placeholder="Rechercher un dossier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              />
            </div>

            {/* Liste des dossiers */}
            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              {filteredCollections.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  {collections.length === 0 ? "Aucun dossier créé" : "Aucun dossier trouvé."}
                </div>
              ) : (
                <div className="p-1">
                  {filteredCollections.map((collection) => {
                    const isSelected = selectedCollections.includes(collection.id)
                    return (
                      <div
                        key={collection.id}
                        onClick={() => {
                          console.log("Clicking on collection:", collection.id)
                          toggleCollection(collection.id)
                        }}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-700 focus:bg-slate-700 text-white"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-3 h-3 rounded-full ${collection.color} flex-shrink-0`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{collection.name}</span>
                            {collection.description && (
                              <span className="text-xs text-slate-400">{collection.description}</span>
                            )}
                          </div>
                        </div>
                        <Check
                          className={`ml-auto h-4 w-4 flex-shrink-0 ${
                            isSelected ? "opacity-100 text-blue-400" : "opacity-0"
                          }`}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Affichage des dossiers sélectionnés */}
      {selectedCollections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getSelectedCollections().map((collection) => (
            <Badge key={collection.id} className={`${collection.color} text-white flex items-center gap-1 px-2 py-1`}>
              <div className={`w-2 h-2 rounded-full bg-white/30`} />
              <span className="text-xs">{collection.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-white/20 ml-1"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeCollection(collection.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

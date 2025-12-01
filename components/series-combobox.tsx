"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SeriesComboboxProps {
  series: string[] // Liste de toutes les séries existantes
  selectedSeries?: string | null // La série actuellement sélectionnée (peut être null ou undefined)
  onSeriesChange: (series: string | null) => void // Callback pour notifier le changement de série
  placeholder?: string
}

export default function SeriesCombobox({
  series,
  selectedSeries,
  onSeriesChange,
  placeholder = "Sélectionner ou créer une série...",
}: SeriesComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(selectedSeries || "") // Texte tapé dans l'input

  // Synchroniser l'inputValue avec selectedSeries lorsque selectedSeries change de l'extérieur
  React.useEffect(() => {
    setInputValue(selectedSeries || "")
  }, [selectedSeries])

  // Fonction pour gérer la sélection d'un élément ou la création d'une nouvelle série
  const handleSelect = (currentValue: string) => {
    onSeriesChange(currentValue) // Notifier le parent du changement
    setInputValue(currentValue) // Mettre à jour l'input
    setOpen(false) // Fermer le popover
  }

  // Filtrer les séries basées sur l'inputValue
  const filteredSeries = series.filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()))

  // Vérifier si l'inputValue correspond exactement à une série existante (insensible à la casse)
  const isExistingSeries = series.some((s) => s.toLowerCase() === inputValue.toLowerCase())

  // Déterminer si l'option "Créer" doit être affichée
  const showCreateOption = inputValue && !isExistingSeries

  // Déterminer si le message "Aucune série disponible" doit être affiché
  // Il s'affiche seulement si aucune série n'est filtrée ET qu'il n'y a pas d'option de création
  const showEmptyMessage = filteredSeries.length === 0 && !showCreateOption

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600 hover:border-slate-400"
        >
          {selectedSeries // Afficher la série sélectionnée
            ? selectedSeries
            : inputValue // Ou le texte tapé si aucune sélection
              ? inputValue
              : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-700 border-slate-500 text-slate-100">
        <Command className="bg-slate-700">
          <CommandInput
            placeholder="Rechercher ou créer une série..."
            value={inputValue} // Lier l'input à inputValue
            onValueChange={(value) => {
              setInputValue(value)
              // Si l'utilisateur vide l'input, on désélectionne la série
              if (value === "") {
                onSeriesChange(null)
              }
            }}
            className="bg-slate-700 border-slate-500 text-slate-100 placeholder:text-slate-300"
          />
          <CommandList>
            {showEmptyMessage && (
              <CommandEmpty className="py-6 text-center text-sm text-slate-400">Aucune série disponible.</CommandEmpty>
            )}

            <CommandGroup>
              {/* Afficher les séries filtrées */}
              {filteredSeries.map((s) => (
                <CommandItem
                  key={s}
                  value={s}
                  onSelect={() => handleSelect(s)}
                  className="data-[state=selected]:bg-blue-500 data-[state=selected]:text-white hover:bg-slate-600 focus:bg-slate-600 text-slate-100"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedSeries?.toLowerCase() === s.toLowerCase() ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {s}
                </CommandItem>
              ))}

              {/* Option pour créer une nouvelle série si l'inputValue n'est pas dans les séries existantes */}
              {showCreateOption && (
                <CommandItem
                  value={inputValue} // La valeur de l'item est l'inputValue
                  onSelect={() => handleSelect(inputValue)} // Sélectionne l'inputValue comme nouvelle série
                  className="data-[state=selected]:bg-blue-500 data-[state=selected]:text-white hover:bg-slate-600 focus:bg-slate-600 text-blue-400"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Créer "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

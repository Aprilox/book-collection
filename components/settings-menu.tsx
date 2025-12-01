"use client"

import { useState } from "react"
import { Settings, Key, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface SettingsMenuProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  onUpdateApiKeys: (apiKeys: { comicVine?: string }) => Promise<{ success: boolean; error?: string }>
}

export default function SettingsMenu({ onChangePassword, onUpdateApiKeys }: SettingsMenuProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isApiKeysDialogOpen, setIsApiKeysDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [comicVineApiKey, setComicVineApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "❌ Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "❌ Erreur",
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await onChangePassword(currentPassword, newPassword)
      if (result.success) {
        toast({
          title: "✅ Succès",
          description: "Mot de passe modifié avec succès",
        })
        setIsPasswordDialogOpen(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({
          title: "❌ Erreur",
          description: result.error || "Erreur lors de la modification du mot de passe",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la modification du mot de passe",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiKeysUpdate = async () => {
    setIsLoading(true)
    try {
      const result = await onUpdateApiKeys({ comicVine: comicVineApiKey })
      if (result.success) {
        toast({
          title: "✅ Succès",
          description: "Clés API mises à jour avec succès",
        })
        setIsApiKeysDialogOpen(false)
      } else {
        toast({
          title: "❌ Erreur",
          description: result.error || "Erreur lors de la mise à jour des clés API",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la mise à jour des clés API",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMigrateImages = async () => {
    setIsLoading(true)
    toast({
      title: "🚀 Migration en cours...",
      description: "Téléchargement des images en cours, veuillez patienter...",
    })

    try {
      const response = await fetch("/api/migrate-images", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Migration terminée",
          description: result.message,
        })
      } else {
        toast({
          title: "❌ Erreur de migration",
          description: result.message || "Erreur lors de la migration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la migration des images",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanupImages = async () => {
    setIsLoading(true)
    toast({
      title: "🧹 Nettoyage en cours...",
      description: "Suppression des images non utilisées...",
    })

    try {
      const response = await fetch("/api/cleanup-images", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Nettoyage terminé",
          description: result.message,
        })
      } else {
        toast({
          title: "❌ Erreur de nettoyage",
          description: result.message || "Erreur lors du nettoyage",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors du nettoyage des images",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-slate-700 border-slate-500 text-slate-100">
          <DropdownMenuItem
            onClick={() => setIsPasswordDialogOpen(true)}
            className="hover:bg-slate-600 focus:bg-slate-600"
          >
            <Key className="w-4 h-4 mr-2" />
            Changer le mot de passe
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsApiKeysDialogOpen(true)}
            className="hover:bg-slate-600 focus:bg-slate-600"
          >
            <Settings className="w-4 h-4 mr-2" />
            Clés API
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-500" />
          <DropdownMenuItem
            onClick={handleMigrateImages}
            disabled={isLoading}
            className="hover:bg-slate-600 focus:bg-slate-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Migrer les images
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCleanupImages}
            disabled={isLoading}
            className="hover:bg-slate-600 focus:bg-slate-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Nettoyer les images
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog pour changer le mot de passe */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-600 text-slate-100">
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription className="text-slate-300">
              Entrez votre mot de passe actuel et choisissez un nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-700 border-slate-500 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-700 border-slate-500 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700 border-slate-500 text-slate-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              className="bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour les clés API */}
      <Dialog open={isApiKeysDialogOpen} onOpenChange={setIsApiKeysDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-600 text-slate-100">
          <DialogHeader>
            <DialogTitle>Configuration des clés API</DialogTitle>
            <DialogDescription className="text-slate-300">
              Configurez vos clés API pour accéder aux services externes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comic-vine-key">Clé API Comic Vine</Label>
              <Input
                id="comic-vine-key"
                type="text"
                value={comicVineApiKey}
                onChange={(e) => setComicVineApiKey(e.target.value)}
                placeholder="Entrez votre clé API Comic Vine"
                className="bg-slate-700 border-slate-500 text-slate-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApiKeysDialogOpen(false)}
              className="bg-slate-700 border-slate-500 text-slate-100 hover:bg-slate-600"
            >
              Annuler
            </Button>
            <Button
              onClick={handleApiKeysUpdate}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Library, Loader2, Eye, EyeOff, Shield, Clock, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("password", password)

      const result = await login(formData)

      if (result.success) {
        window.location.href = "/"
      } else {
        setError(result.error || "Erreur de connexion")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour déterminer le type d'erreur et l'icône appropriée
  const getErrorInfo = (errorMessage: string) => {
    if (errorMessage.includes("verrouillé")) {
      return {
        icon: <Shield className="w-4 h-4" />,
        type: "locked",
        className: "bg-red-900/50 border-red-600 text-red-300",
      }
    } else if (errorMessage.includes("Attendez")) {
      return {
        icon: <Clock className="w-4 h-4" />,
        type: "delay",
        className: "bg-orange-900/50 border-orange-600 text-orange-300",
      }
    } else {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        type: "error",
        className: "bg-red-900/50 border-red-600 text-red-300",
      }
    }
  }

  const errorInfo = error ? getErrorInfo(error) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Library className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold">Ma Bibliothèque</CardTitle>
          </div>
          <p className="text-slate-400">Connectez-vous pour accéder à votre collection</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                  placeholder="Entrez votre mot de passe"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className={`p-3 border rounded-md flex items-start gap-2 ${errorInfo?.className}`}>
                {errorInfo?.icon}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {errorInfo?.type === "locked" && "Compte verrouillé"}
                    {errorInfo?.type === "delay" && "Limitation de débit"}
                    {errorInfo?.type === "error" && "Erreur de connexion"}
                  </p>
                  <p className="text-sm mt-1">{error}</p>
                  {errorInfo?.type === "locked" && (
                    <p className="text-xs mt-2 opacity-75">
                      Votre compte a été temporairement verrouillé après plusieurs tentatives échouées.
                    </p>
                  )}
                  {errorInfo?.type === "delay" && (
                    <p className="text-xs mt-2 opacity-75">Protection contre les tentatives répétées activée.</p>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

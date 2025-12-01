"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface BookImageProps {
  src?: string
  alt: string
  className?: string
  loading?: "lazy" | "eager"
}

export default function BookImage({ src, alt, className = "", loading = "lazy" }: BookImageProps) {
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | undefined>(src)

  // Fonction pour déterminer si on a besoin du proxy (pour les images externes non téléchargées)
  const needsProxy = (url?: string) => {
    if (!url) return false
    if (url.startsWith("/book-covers/")) return false // Image locale
    return url.includes("books.google.com/books/content") || url.includes("books.googleusercontent.com")
  }

  // Nettoyer et optimiser l'URL de l'image
  const getOptimizedImageUrl = (url?: string) => {
    if (!url || url.trim() === "") return undefined

    // Si c'est une image locale, utiliser la route API
    if (url.startsWith("/book-covers/")) {
      const filename = url.replace("/book-covers/", "")
      return `/api/images/${filename}`
    }

    // Force HTTPS pour les images externes
    let cleanUrl = url.replace(/^http:/, "https:")

    // Optimise les URLs Google Books
    if (cleanUrl.includes("books.google")) {
      cleanUrl = cleanUrl.replace("&zoom=1", "&zoom=0")
      cleanUrl = cleanUrl.replace("zoom=1", "zoom=0")
    }

    // Si l'URL nécessite un proxy, l'utiliser
    if (needsProxy(cleanUrl)) {
      return `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`
    }

    return cleanUrl
  }

  // Mettre à jour l'URL de l'image quand src change
  useEffect(() => {
    setImageSrc(src)
    setHasError(false)
  }, [src])

  const imageUrl = getOptimizedImageUrl(imageSrc)

  const handleError = () => {
    setHasError(true)
  }

  if (!imageUrl || hasError) {
    return (
      <div className={`${className} bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center`}>
        <div className="text-center p-4">
          <span className="text-4xl mb-2 block">📚</span>
          <span className="text-xs text-slate-400">Image non disponible</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-slate-700 rounded-lg overflow-hidden relative`}>
      <Image
        src={imageUrl || "/placeholder.svg"}
        alt={alt}
        width={400}
        height={600}
        loading={loading}
        onError={handleError}
        className="w-full h-full object-contain"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  )
}

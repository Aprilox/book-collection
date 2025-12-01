import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

export async function downloadAndStoreImageDirect(imageUrl: string, oldImagePath?: string): Promise<string | null> {
  try {
    // Créer le dossier s'il n'existe pas
    const bookCoversDir = path.join(process.cwd(), "public", "book-covers")
    await fs.mkdir(bookCoversDir, { recursive: true })

    // Créer un AbortController pour le timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 secondes

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        Referer: "https://www.bedetheque.com/",
        "Cache-Control": "no-cache",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Vérifier le content-type
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error(`Invalid content type: ${contentType}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Vérifier que le fichier n'est pas vide
    if (buffer.length === 0) {
      throw new Error("Downloaded file is empty")
    }

    // Générer un nom de fichier unique
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex")
    const extension = path.extname(new URL(imageUrl).pathname) || ".jpg"
    const filename = `${hash}${extension}`
    const filepath = path.join(bookCoversDir, filename)

    // Écrire le fichier
    await fs.writeFile(filepath, buffer)

    // Vérifier que le fichier a bien été écrit
    const stats = await fs.stat(filepath)
    if (stats.size === 0) {
      throw new Error("Written file is empty")
    }

    // Supprimer l'ancienne image si elle existe et est différente
    if (oldImagePath && oldImagePath.startsWith("/book-covers/") && oldImagePath !== `/book-covers/${filename}`) {
      try {
        const oldFilePath = path.join(process.cwd(), "public", oldImagePath)
        await fs.unlink(oldFilePath)
      } catch (error) {
        // Ignorer les erreurs de suppression
      }
    }

    return `/book-covers/${filename}`
  } catch (error) {
    console.error("Error downloading image:", error)
    return null
  }
}

export async function cleanupUnusedImages(usedImages: string[]): Promise<void> {
  try {
    const bookCoversDir = path.join(process.cwd(), "public", "book-covers")
    const files = await fs.readdir(bookCoversDir)

    for (const file of files) {
      if (file === ".gitkeep") continue

      const imagePath = `/book-covers/${file}`
      if (!usedImages.includes(imagePath)) {
        try {
          await fs.unlink(path.join(bookCoversDir, file))
          console.log(`Deleted unused image: ${file}`)
        } catch (error) {
          console.warn(`Failed to delete image: ${file}`, error)
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up images:", error)
  }
}

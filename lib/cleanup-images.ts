import { promises as fs } from "fs"
import path from "path"
import { getBooks } from "@/lib/db"

const COVERS_DIR = path.join(process.cwd(), "public", "book-covers")

export async function cleanupUnusedImages(): Promise<{ removed: number; kept: number }> {
  try {
    // Get all books to find used images
    const books = await getBooks()
    const usedImages = new Set<string>()

    books.forEach((book) => {
      if (book.thumbnail?.startsWith("/book-covers/")) {
        const filename = path.basename(book.thumbnail)
        usedImages.add(filename)
      }
    })

    // Get all files in covers directory
    let allFiles: string[] = []
    try {
      allFiles = await fs.readdir(COVERS_DIR)
    } catch (error) {
      console.warn("Dossier book-covers non trouvé")
      return { removed: 0, kept: 0 }
    }

    // Filter out non-image files
    const imageFiles = allFiles.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
    })

    let removedCount = 0
    let keptCount = 0

    // Remove unused images
    for (const file of imageFiles) {
      if (usedImages.has(file)) {
        keptCount++
      } else {
        try {
          await fs.unlink(path.join(COVERS_DIR, file))
          removedCount++
          console.log(`Image non utilisée supprimée: ${file}`)
        } catch (error) {
          console.warn(`Impossible de supprimer ${file}:`, error)
        }
      }
    }

    return { removed: removedCount, kept: keptCount }
  } catch (error) {
    console.error("Erreur lors du nettoyage des images:", error)
    return { removed: 0, kept: 0 }
  }
}

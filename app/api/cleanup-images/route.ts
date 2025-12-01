import { type NextRequest, NextResponse } from "next/server"
import { getBooks } from "@/lib/db"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const books = await getBooks()

    // Get all used image paths
    const usedImages = books
      .map((book) => book.thumbnail)
      .filter((thumbnail): thumbnail is string => Boolean(thumbnail && thumbnail.startsWith("/book-covers/")))

    console.log(`🧹 Nettoyage des images non utilisées...`)
    console.log(`📊 Images utilisées: ${usedImages.length}`)

    // Cleanup unused images
    const result = await cleanupUnusedImages(usedImages)

    const response = {
      success: true,
      message: `Nettoyage terminé: ${result.deleted} images supprimées${result.errors.length > 0 ? ` (${result.errors.length} erreurs)` : ""}`,
      details: {
        deleted: result.deleted,
        errors: result.errors.length,
        errorDetails: result.errors.slice(0, 5), // Limit error details
      },
    }

    console.log("🎉 Nettoyage terminé:", response.message)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du nettoyage des images",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

async function cleanupUnusedImages(usedImages: string[]): Promise<{ deleted: number; errors: string[] }> {
  const coversDir = path.join(process.cwd(), "public", "book-covers")
  const errors: string[] = []
  let deleted = 0

  try {
    const files = await fs.readdir(coversDir)

    for (const file of files) {
      if (file === ".gitkeep") continue

      const imagePath = `/book-covers/${file}`
      if (!usedImages.includes(imagePath)) {
        try {
          await fs.unlink(path.join(coversDir, file))
          deleted++
          console.log(`Deleted unused image: ${file}`)
        } catch (error) {
          const errorMsg = `Impossible de supprimer ${file}: ${error}`
          errors.push(errorMsg)
          console.warn(errorMsg)
        }
      }
    }
  } catch (error) {
    const errorMsg = `Erreur lors de la lecture du dossier: ${error}`
    errors.push(errorMsg)
    console.error(errorMsg)
  }

  return { deleted, errors }
}

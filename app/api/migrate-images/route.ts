import { type NextRequest, NextResponse } from "next/server"
import { getBooks, updateBook } from "@/lib/db"
import { downloadAndStoreImageDirect } from "@/lib/image-utils"

export async function POST(request: NextRequest) {
  try {
    const books = await getBooks()
    let migratedCount = 0
    let errorCount = 0
    const errors: string[] = []

    console.log(`🚀 Début de la migration de ${books.length} livres...`)

    for (const book of books) {
      if (!book.thumbnail || book.thumbnail.startsWith("/book-covers/")) {
        console.log(`⚠️ Pas de changement pour: ${book.title}`)
        continue
      }

      console.log(`📥 Migration de l'image pour: ${book.title}`)

      try {
        const localPath = await downloadAndStoreImageDirect(book.thumbnail)

        if (localPath && localPath !== book.thumbnail) {
          // Update book with new local path
          const updatedBook = { ...book, thumbnail: localPath }
          await updateBook(updatedBook)
          migratedCount++
          console.log(`✅ Image migrée: ${book.title} -> ${localPath}`)
        }
      } catch (error) {
        errorCount++
        const errorMsg = `Erreur pour "${book.title}": ${error}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    const result = {
      success: true,
      message: `Migration terminée: ${migratedCount} images migrées${errorCount > 0 ? ` (${errorCount} erreurs)` : ""}`,
      details: {
        total: books.length,
        migrated: migratedCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 5), // Limit error details
      },
    }

    console.log("🎉 Migration terminée:", result.message)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Erreur lors de la migration:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la migration des images",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

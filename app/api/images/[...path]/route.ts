import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params
    const imagePath = resolvedParams.path.join("/")
    const fullPath = path.join(process.cwd(), "public", "book-covers", imagePath)

    // Vérifier que le fichier existe
    try {
      await fs.access(fullPath)
    } catch {
      return new NextResponse("Image not found", { status: 404 })
    }

    // Lire le fichier
    const imageBuffer = await fs.readFile(fullPath)

    // Déterminer le type MIME
    const ext = path.extname(imagePath).toLowerCase()
    let contentType = "image/jpeg"

    switch (ext) {
      case ".png":
        contentType = "image/png"
        break
      case ".gif":
        contentType = "image/gif"
        break
      case ".webp":
        contentType = "image/webp"
        break
      case ".svg":
        contentType = "image/svg+xml"
        break
    }

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error serving image:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

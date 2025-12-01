import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

const BOOK_COVERS_DIR = path.join(process.cwd(), "public", "book-covers")

// Ensure the book covers directory exists
async function ensureBookCoversDir() {
  try {
    await fs.access(BOOK_COVERS_DIR)
  } catch {
    await fs.mkdir(BOOK_COVERS_DIR, { recursive: true })
  }
}

function getImageHash(url: string): string {
  return crypto.createHash("md5").update(url).digest("hex")
}

function getFileExtension(url: string, contentType?: string): string {
  // Try to get extension from content type first
  if (contentType) {
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg"
    if (contentType.includes("png")) return ".png"
    if (contentType.includes("webp")) return ".webp"
    if (contentType.includes("gif")) return ".gif"
  }

  // Fallback to URL extension
  try {
    const urlPath = new URL(url).pathname
    const ext = path.extname(urlPath).toLowerCase()
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      return ext === ".jpeg" ? ".jpg" : ext
    }
  } catch {
    // Invalid URL, ignore
  }

  return ".jpg" // Default fallback
}

async function deleteOldImage(oldImagePath?: string) {
  if (!oldImagePath || !oldImagePath.startsWith("/book-covers/")) return

  try {
    const fullPath = path.join(process.cwd(), "public", oldImagePath)
    await fs.unlink(fullPath)
    console.log("Ancienne image supprimée:", oldImagePath)
  } catch (error) {
    console.warn("Impossible de supprimer l'ancienne image:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, oldImagePath } = await request.json()

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "URL d'image requise" }, { status: 400 })
    }

    // If it's already a local path, return it
    if (imageUrl.startsWith("/book-covers/")) {
      return NextResponse.json({ localPath: imageUrl })
    }

    await ensureBookCoversDir()

    // Generate filename based on URL hash
    const hash = getImageHash(imageUrl)

    // Download the image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookCollection/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    const extension = getFileExtension(imageUrl, contentType || undefined)
    const filename = `${hash}${extension}`
    const localPath = `/book-covers/${filename}`
    const fullPath = path.join(BOOK_COVERS_DIR, filename)

    // Check if file already exists
    try {
      await fs.access(fullPath)
      // File exists, delete old image if different and return existing path
      if (oldImagePath && oldImagePath !== localPath) {
        await deleteOldImage(oldImagePath)
      }
      return NextResponse.json({ localPath })
    } catch {
      // File doesn't exist, proceed with download
    }

    // Save the image
    const buffer = await response.arrayBuffer()
    await fs.writeFile(fullPath, Buffer.from(buffer))

    // Delete old image if it exists and is different
    if (oldImagePath && oldImagePath !== localPath) {
      await deleteOldImage(oldImagePath)
    }

    console.log("Image téléchargée:", localPath)
    return NextResponse.json({ localPath })
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image:", error)
    return NextResponse.json(
      { error: `Impossible de télécharger l'image: ${error instanceof Error ? error.message : "Erreur inconnue"}` },
      { status: 500 },
    )
  }
}

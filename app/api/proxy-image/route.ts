import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const imageUrl = searchParams.get("url")

  if (!imageUrl) {
    return new NextResponse("URL parameter is required", { status: 400 })
  }

  try {
    // Valider que l'URL est autorisée
    const allowedDomains = [
      "books.google.com",
      "books.googleusercontent.com",
      "covers.openlibrary.org",
      "images.amazon.com",
      "uploads.mangadex.org", // CORRECTION : mangadex.org (avec un 'e')
    ]

    const url = new URL(imageUrl)
    const isAllowed = allowedDomains.some((domain) => url.hostname.includes(domain))

    if (!isAllowed) {
      return new NextResponse("Domain not allowed", { status: 403 })
    }

    // Récupérer l'image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookManager/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache 24h
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Error proxying image:", error)
    return new NextResponse("Failed to fetch image", { status: 500 })
  }
}

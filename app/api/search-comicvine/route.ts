import { type NextRequest, NextResponse } from "next/server"
import { getApiKeys } from "@/lib/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
  }

  try {
    // Récupérer la clé API depuis la base de données
    const apiKeys = await getApiKeys()
    const apiKey = apiKeys.comicVine

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error: "Comic Vine API key not configured",
          message: "Veuillez configurer votre clé API Comic Vine dans les paramètres",
        },
        { status: 500 },
      )
    }

    const apiUrl = `https://comicvine.gamespot.com/api/search/?api_key=${apiKey}&format=json&query=${encodeURIComponent(query)}&resources=volume&limit=20`

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "BookManager/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Comic Vine API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.error !== "OK") {
      if (data.error === "Invalid API Key") {
        return NextResponse.json(
          {
            error: "Invalid Comic Vine API key",
            message: "Votre clé API Comic Vine n'est pas valide. Vérifiez-la dans les paramètres.",
          },
          { status: 401 },
        )
      }
      throw new Error(`Comic Vine error: ${data.error}`)
    }

    const results = (data.results || []).map((volume: any) => ({
      id: `cv_${volume.id}`,
      volumeInfo: {
        title: volume.name || "Titre inconnu",
        authors: volume.publisher?.name ? [volume.publisher.name] : ["Éditeur inconnu"],
        description: volume.description?.replace(/<[^>]*>/g, "").substring(0, 500) || undefined,
        imageLinks: volume.image?.medium_url
          ? {
              thumbnail: volume.image.medium_url,
              smallThumbnail: volume.image.small_url || volume.image.thumb_url,
            }
          : undefined,
        publishedDate: volume.start_year?.toString() || undefined,
        categories: ["Comics", "Graphic Novel"],
        pageCount: volume.count_of_issues || undefined,
        publisher: volume.publisher?.name || undefined,
        industryIdentifiers: undefined,
      },
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Comic Vine API error:", error)
    return NextResponse.json({ error: "Failed to search Comic Vine" }, { status: 500 })
  }
}

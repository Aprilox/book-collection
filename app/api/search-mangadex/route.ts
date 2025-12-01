import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxy server-side vers l'API MangaDex afin d'éviter les erreurs CORS côté client.
 * GET /api/search-mangadex?q=<query>
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
  }

  try {
    const apiUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(
      query,
    )}&limit=20&availableTranslatedLanguage[]=fr&availableTranslatedLanguage[]=en&includes[]=cover_art&includes[]=author&includes[]=artist`

    const res = await fetch(apiUrl, {
      // Ajout d'un User-Agent recommandé par MangaDex
      headers: { "User-Agent": "BatmanCollectionManager/1.0 (https://v0.dev)" },
      // IMPORTANT : pas de cache agressive (MangaDex recommande au max 15 min)
      next: { revalidate: 900 },
    })

    if (!res.ok) {
      throw new Error(`MangaDex API error: ${res.status}`)
    }

    const data = await res.json()

    const results =
      (data?.data || []).map((manga: any) => {
        const authors = manga.relationships
          ?.filter((r: any) => r.type === "author" || r.type === "artist")
          ?.map((r: any) => r.attributes?.name)
          ?.filter(Boolean) || ["Auteur inconnu"]

        const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art")
        const coverFile = coverRel?.attributes?.fileName
        const coverThumb = coverFile
          ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.256.jpg`
          : undefined

        return {
          id: `md_${manga.id}`,
          volumeInfo: {
            title:
              manga.attributes.title?.fr ??
              manga.attributes.title?.en ??
              manga.attributes.title?.["ja-ro"] ??
              Object.values(manga.attributes.title)[0] ??
              "Titre inconnu",
            authors,
            description: manga.attributes.description?.fr ?? manga.attributes.description?.en ?? undefined,
            imageLinks: coverThumb ? { thumbnail: coverThumb, smallThumbnail: coverThumb } : undefined,
            publishedDate: manga.attributes.year?.toString() ?? undefined,
            categories: manga.attributes.tags
              ?.filter((t: any) => t.attributes.group === "genre")
              ?.slice(0, 3)
              ?.map((t: any) => t.attributes.name?.fr ?? t.attributes.name?.en) ?? ["Manga"],
            pageCount: manga.attributes.lastChapter ? Number.parseInt(manga.attributes.lastChapter) : undefined,
            publisher: manga.attributes.publicationDemographic ?? "Manga",
            industryIdentifiers: undefined,
          },
        }
      }) || []

    return NextResponse.json({ results })
  } catch (err) {
    console.error("MangaDex proxy error:", err)
    return NextResponse.json({ error: "Failed to fetch MangaDex data" }, { status: 500 })
  }
}

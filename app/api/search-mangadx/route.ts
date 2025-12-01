import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxy server-side vers l'API MangaDex afin d'éviter les erreurs CORS côté client.
 * GET /api/search-mangadx?q=<query>
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
  }

  try {
    // CORRECTION : mangadex.org (avec un 'e') et non mangadx.org
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
      console.error(`MangaDex API error: ${res.status} ${res.statusText}`)
      const errorText = await res.text()
      console.error("Error response:", errorText)
      throw new Error(`MangaDex API error: ${res.status}`)
    }

    const data = await res.json()

    const results =
      (data?.data || []).map((manga: any) => {
        const authors = manga.relationships
          ?.filter((r: any) => r.type === "author" || r.type === "artist")
          ?.map((r: any) => r.attributes?.name)
          ?.filter(Boolean) || ["Auteur inconnu"]

        // MangaDex a une protection stricte contre le hotlinking
        // On ne fournit pas d'image automatique, l'utilisateur peut l'ajouter manuellement
        const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art")
        const coverFile = coverRel?.attributes?.fileName

        // On stocke l'URL originale dans la description pour que l'utilisateur puisse la copier
        let originalCoverUrl = undefined
        if (coverFile && manga.id) {
          // CORRECTION : mangadex.org (avec un 'e')
          originalCoverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}`
        }

        // Construire une description enrichie avec l'URL de l'image
        let enrichedDescription = manga.attributes.description?.fr ?? manga.attributes.description?.en ?? ""
        if (originalCoverUrl) {
          enrichedDescription += `\n\n📸 Image de couverture disponible sur MangaDex :\n${originalCoverUrl}\n(Copiez cette URL dans le champ "URL de l'image" si vous souhaitez l'ajouter)`
        }

        return {
          id: `md_${manga.id}`,
          volumeInfo: {
            title:
              manga.attributes.title?.fr ??
              manga.attributes.title?.en ??
              manga.attributes.title?.["ja-ro"] ??
              manga.attributes.title?.ja ??
              Object.values(manga.attributes.title || {})[0] ??
              "Titre inconnu",
            authors,
            description: enrichedDescription || undefined,
            // Pas d'image automatique à cause de la protection MangaDex
            imageLinks: undefined,
            publishedDate: manga.attributes.year?.toString() ?? undefined,
            categories: manga.attributes.tags
              ?.filter((t: any) => t.attributes.group === "genre")
              ?.slice(0, 3)
              ?.map((t: any) => t.attributes.name?.fr ?? t.attributes.name?.en)
              ?.filter(Boolean) ?? ["Manga"],
            pageCount: manga.attributes.lastChapter ? Number.parseInt(manga.attributes.lastChapter) : undefined,
            publisher: manga.attributes.publicationDemographic ?? "Manga",
            industryIdentifiers: undefined,
          },
        }
      }) || []

    return NextResponse.json({ results })
  } catch (err) {
    console.error("MangaDX proxy error:", err)
    return NextResponse.json({ error: "Failed to fetch MangaDX data" }, { status: 500 })
  }
}

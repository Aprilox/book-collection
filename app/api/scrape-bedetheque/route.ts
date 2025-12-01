import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

// Helper to extract text and clean it
const getText = ($: cheerio.CheerioAPI, selector: string): string | undefined => {
  try {
    const text = $(selector).text().trim()
    return text || undefined
  } catch (error) {
    console.warn(`Error extracting text from selector ${selector}:`, error)
    return undefined
  }
}

// Helper to extract attribute
const getAttr = ($: cheerio.CheerioAPI, selector: string, attr: string): string | undefined => {
  try {
    const attribute = $(selector).attr(attr)?.trim()
    return attribute || undefined
  } catch (error) {
    console.warn(`Error extracting attribute ${attr} from selector ${selector}:`, error)
    return undefined
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url || (!url.includes("bedetheque.com") && !url.includes("bdgest.com"))) {
    return NextResponse.json({ message: "URL Bedetheque ou BDGest valide requise." }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
      },
    })

    if (!response.ok) {
      throw new Error(`Impossible de charger la page: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // --- Data Extraction with fallbacks ---
    const series = getText($, "div.bandeau-info h1 a") || ""
    let albumTitle = getText($, "div.bandeau-info h2") || ""

    let volume: number | undefined
    if (albumTitle) {
      const match = albumTitle.match(/^(?:Tome\s*)?(\d+)\s*[-.:]?\s*(.*)$/i)
      if (match) {
        volume = Number.parseInt(match[1], 10)
        albumTitle = match[2].trim()
      }
    }

    if (!albumTitle) {
      const metaTitle = getAttr($, 'meta[itemprop="name"]', "content")
      if (metaTitle) {
        albumTitle = series ? metaTitle.replace(series, "").replace(/^-/, "").trim() : metaTitle
      }
    }

    if (!albumTitle) {
      albumTitle = getText($, "h3.titre")?.replace(/DP$/, "").trim() || ""
    }

    // Fallback title
    if (!albumTitle && !series) {
      albumTitle = "Titre inconnu"
    }

    let coverUrl = getAttr($, "div.bandeau-image a.zoom-format-icon", "href")
    if (!coverUrl) {
      coverUrl = getAttr($, 'div.bandeau-image img[itemprop="image"]', "src")
    }
    if (coverUrl && !coverUrl.startsWith("http")) {
      try {
        const baseUrl = url.includes("bdgest.com") ? "https://www.bdgest.com/" : "https://www.bedetheque.com/"
        coverUrl = new URL(coverUrl, baseUrl).toString()
      } catch (error) {
        console.warn("Error constructing cover URL:", error)
        coverUrl = undefined
      }
    }

    const authors = new Set<string>()
    try {
      $('div.bandeau-info h3 a[href*="auteur-"] span').each((i, el) => {
        const authorName = $(el).text().trim()
        if (authorName) {
          authors.add(authorName)
        }
      })
      if (authors.size === 0) {
        $(
          'ul.infos li:has(label:contains("Scénario")), ul.infos li:has(label:contains("Dessin")), ul.infos li:has(label:contains("Couleurs"))',
        )
          .find("a")
          .each((i, el) => {
            const authorName = $(el).text().trim()
            if (authorName) {
              authors.add(authorName)
            }
          })
      }
    } catch (error) {
      console.warn("Error extracting authors:", error)
    }

    const publisher =
      getText($, 'div.bandeau-info h3 span[itemprop="publisher"]') ||
      getText($, 'ul.infos li:has(label:contains("Editeur")) > a') ||
      undefined

    // --- Enhanced Date Parsing ---
    const monthMap: Record<string, string> = {
      janvier: "01",
      février: "02",
      mars: "03",
      avril: "04",
      mai: "05",
      juin: "06",
      juillet: "07",
      août: "08",
      septembre: "09",
      octobre: "10",
      novembre: "11",
      décembre: "12",
    }
    let publishedDate: string | undefined

    try {
      const parutionText = $("span.parution").text().trim().replace(/[()]/g, "") // e.g., "05 juillet 2012"

      if (parutionText) {
        const parts = parutionText.split(" ")
        if (parts.length === 3) {
          // "05", "juillet", "2012"
          const day = parts[0].padStart(2, "0")
          const month = monthMap[parts[1].toLowerCase()]
          const year = parts[2]
          if (day && month && year) {
            publishedDate = `${year}-${month}-${day}`
          }
        }
      }

      if (!publishedDate) {
        const dateLiText = $('ul.infos li:contains("Dépot légal")').text() || $('span[title="Dépot légal"]').text()
        const publishedDateStr = dateLiText
          .replace(/Dépot légal\s*:\s*/, "")
          .trim()
          .split("(")[0]
          .trim()

        if (publishedDateStr) {
          if (/^\d{4}$/.test(publishedDateStr)) {
            // YYYY
            publishedDate = `${publishedDateStr}-01-01`
          } else {
            const dateParts = publishedDateStr.split("/") // MM/YYYY or DD/MM/YYYY
            if (dateParts.length === 2) {
              // MM/YYYY
              publishedDate = `${dateParts[1]}-${dateParts[0].padStart(2, "0")}-01`
            } else if (dateParts.length === 3) {
              // DD/MM/YYYY
              publishedDate = `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`
            }
          }
        }
      }

      if (!publishedDate) {
        const yearStr = $("div.bandeau-info h3 span.annee").text().trim()
        if (/^\d{4}$/.test(yearStr)) {
          publishedDate = `${yearStr}-01-01`
        }
      }
    } catch (error) {
      console.warn("Error parsing date:", error)
      publishedDate = undefined
    }

    let isbn: string | undefined
    try {
      isbn = $('ul.infos li span[itemprop="isbn"]').text().trim()
      if (!isbn) {
        isbn = $('ul.infos li:contains("EAN/ISBN")')
          .text()
          .replace(/EAN\/ISBN\s*:\s*/, "")
          .trim()
      }
      if (!isbn) {
        isbn = $('ul.infos li:has(label:contains("ISBN"))')
          .text()
          .replace(/ISBN\s*:\s*/, "")
          .trim()
      }
      isbn = isbn || undefined
    } catch (error) {
      console.warn("Error extracting ISBN:", error)
      isbn = undefined
    }

    let description: string | undefined
    try {
      description =
        $('div.autres p:contains("Info édition")').text().replace("Info édition :", "").trim() ||
        $('div[itemprop="description"]').text().trim() ||
        undefined
    } catch (error) {
      console.warn("Error extracting description:", error)
      description = undefined
    }

    let pageCount: number | undefined
    try {
      const pageCountText = $('span[itemprop="numberOfPages"]').text().trim()
      pageCount = pageCountText ? Number.parseInt(pageCountText, 10) : undefined
    } catch (error) {
      console.warn("Error extracting page count:", error)
      pageCount = undefined
    }

    const categories = ["Comics & Graphic Novels"]

    const scrapedResult = {
      id: `bd_${new URL(url).pathname.replace(/\.html$/, "")}`,
      volumeInfo: {
        title: albumTitle || series || "Titre inconnu",
        authors: authors.size > 0 ? Array.from(authors) : ["Auteur inconnu"],
        description,
        imageLinks: coverUrl ? { thumbnail: coverUrl } : undefined,
        publishedDate,
        pageCount,
        categories,
        publisher,
        industryIdentifiers:
          isbn && isbn.length >= 10
            ? [
                {
                  type: isbn.replace(/-/g, "").length === 13 ? "ISBN_13" : "ISBN_10",
                  identifier: isbn.replace(/-/g, ""),
                },
              ]
            : undefined,
      },
      _customData: {
        volume,
      },
    }

    return NextResponse.json(scrapedResult)
  } catch (error) {
    console.error("Bedetheque scraper error:", error)
    const message = error instanceof Error ? error.message : "Une erreur est survenue lors du scraping."
    return NextResponse.json({ message }, { status: 500 })
  }
}

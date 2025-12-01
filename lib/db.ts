"use server"

import { promises as fs } from "fs"
import path from "path"
import { downloadAndStoreImageDirect } from "./image-utils"
import type { Book } from "@/types/book"
import type { ReadingFolder, ReadingOrderBook } from "@/types/reading-order"

const DATA_FILE = path.join(process.cwd(), "data", "library.json")

interface LoginAttempt {
  timestamp: number
  ip?: string
}

interface UserData {
  password: string
  books: Book[]
  wishlist: Book[]
  readingFolders: ReadingFolder[]
  loginAttempts: LoginAttempt[]
  lastSuccessfulLogin?: number
  isLocked?: boolean
  lockUntil?: number
  apiKeys?: {
    comicVine?: string
  }
}

interface LibraryData {
  users: {
    [username: string]: UserData
  }
}

const SECURITY_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000,
  ATTEMPT_WINDOW: 60 * 60 * 1000,
  PROGRESSIVE_DELAY: [0, 1000, 2000, 5000, 10000],
} as const

async function readData(): Promise<LibraryData> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8")
    const parsedData = JSON.parse(data)
    let dataWasModified = false

    if (parsedData.users?.admin) {
      const adminUser = parsedData.users.admin

      if (!adminUser.loginAttempts) {
        adminUser.loginAttempts = []
        adminUser.isLocked = false
        dataWasModified = true
      }

      if (!adminUser.apiKeys) {
        adminUser.apiKeys = {
          comicVine: process.env.COMIC_VINE_API_KEY || "",
        }
        dataWasModified = true
      }

      if (!adminUser.readingFolders) {
        adminUser.readingFolders = []
        dataWasModified = true
      }

      if (adminUser.books) {
        adminUser.books.forEach((book: Book) => {
          if (book.addedDate && !book.addedDate.includes("T")) {
            book.addedDate = `${book.addedDate}T00:00:00.000Z`
            dataWasModified = true
          } else if (!book.addedDate) {
            const fallbackDate = book.publishedDate
              ? `${book.publishedDate.split("T")[0]}T00:00:00.000Z`
              : "1970-01-01T00:00:00.000Z"
            book.addedDate = fallbackDate
            dataWasModified = true
          }
        })
      }
    }

    if (dataWasModified) {
      await writeData(parsedData)
    }

    return parsedData
  } catch (error) {
    const defaultData: LibraryData = {
      users: {
        admin: {
          password: "admin123",
          books: [],
          wishlist: [],
          readingFolders: [],
          loginAttempts: [],
          isLocked: false,
          apiKeys: {
            comicVine: process.env.COMIC_VINE_API_KEY || "",
          },
        },
      },
    }
    await writeData(defaultData)
    return defaultData
  }
}

async function writeData(data: LibraryData): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8")
  } catch (error) {
    console.error("Error writing data:", error)
    throw error
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

function validateBook(book: Partial<Book>): string[] {
  const errors: string[] = []
  if (!book.title?.trim()) errors.push("Le titre est requis")
  if (!book.author?.trim()) errors.push("L'auteur est requis")
  if (book.condition && !["mint", "good", "fair", "poor"].includes(book.condition)) {
    errors.push("L'état du livre n'est pas valide")
  }
  if (book.rating && (book.rating < 1 || book.rating > 5)) {
    errors.push("La note doit être entre 1 et 5")
  }
  return errors
}

function cleanOldAttempts(attempts: LoginAttempt[]): LoginAttempt[] {
  const now = Date.now()
  return attempts.filter((attempt) => now - attempt.timestamp < SECURITY_CONFIG.ATTEMPT_WINDOW)
}

function isAccountLocked(user: UserData): boolean {
  const now = Date.now()
  if (user.isLocked && user.lockUntil && now < user.lockUntil) {
    return true
  }
  if (user.isLocked && user.lockUntil && now >= user.lockUntil) {
    user.isLocked = false
    user.lockUntil = undefined
    return false
  }
  return false
}

function getRecentAttempts(user: UserData): LoginAttempt[] {
  return cleanOldAttempts(user.loginAttempts || [])
}

function shouldLockAccount(recentAttempts: LoginAttempt[]): boolean {
  return recentAttempts.length >= SECURITY_CONFIG.MAX_ATTEMPTS
}

function getDelayForAttempt(attemptCount: number): number {
  const index = Math.min(attemptCount - 1, SECURITY_CONFIG.PROGRESSIVE_DELAY.length - 1)
  return (
    SECURITY_CONFIG.PROGRESSIVE_DELAY[index] ||
    SECURITY_CONFIG.PROGRESSIVE_DELAY[SECURITY_CONFIG.PROGRESSIVE_DELAY.length - 1]
  )
}

async function recordFailedAttempt(username: string, ip?: string): Promise<void> {
  const data = await readData()
  const user = data.users[username]
  if (!user) return
  const now = Date.now()
  user.loginAttempts = cleanOldAttempts(user.loginAttempts || [])
  user.loginAttempts.push({ timestamp: now, ip: ip || "unknown" })
  if (shouldLockAccount(user.loginAttempts)) {
    user.isLocked = true
    user.lockUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION
  }
  await writeData(data)
}

async function recordSuccessfulLogin(username: string): Promise<void> {
  const data = await readData()
  const user = data.users[username]
  if (!user) return
  user.loginAttempts = []
  user.isLocked = false
  user.lockUntil = undefined
  user.lastSuccessfulLogin = Date.now()
  await writeData(data)
}

export async function getBooks(): Promise<Book[]> {
  const data = await readData()
  return data.users.admin.books
}

export async function addBook(book: Book): Promise<Book> {
  const data = await readData()
  const errors = validateBook(book)
  if (errors.length > 0) throw new Error(errors.join(", "))

  // Ensure book-covers directory exists
  const bookCoversDir = path.join(process.cwd(), "public", "book-covers")
  try {
    await fs.mkdir(bookCoversDir, { recursive: true })
  } catch (error) {
    // Directory might already exist, ignore error
  }

  // Download and store image if it's an external URL
  let localThumbnail = book.thumbnail
  if (book.thumbnail && !book.thumbnail.startsWith("/book-covers/")) {
    try {
      const downloadedPath = await downloadAndStoreImageDirect(book.thumbnail)
      if (downloadedPath) {
        localThumbnail = downloadedPath
      }
    } catch (error) {
      console.warn("Erreur lors du téléchargement de l'image:", error)
    }
  }

  const newBook = {
    ...book,
    id: generateId(),
    addedDate: new Date().toISOString(),
    title: book.title.trim(),
    author: book.author.trim(),
    series: book.series?.trim() || undefined,
    notes: book.notes?.trim() || undefined,
    thumbnail: localThumbnail,
  }

  const exists = data.users.admin.books.some(
    (b) =>
      b.title.toLowerCase().trim() === newBook.title.toLowerCase().trim() &&
      b.author.toLowerCase().trim() === newBook.author.toLowerCase().trim(),
  )
  if (exists) throw new Error("Ce livre existe déjà dans votre collection")

  data.users.admin.books.push(newBook)
  await writeData(data)
  return newBook
}

export async function updateBook(updatedBook: Book): Promise<Book> {
  const data = await readData()
  const errors = validateBook(updatedBook)
  if (errors.length > 0) throw new Error(errors.join(", "))

  const index = data.users.admin.books.findIndex((book) => book.id === updatedBook.id)
  if (index === -1) throw new Error("Livre non trouvé")

  const oldBook = data.users.admin.books[index]

  // Download and store new image if it changed and is external
  let localThumbnail = updatedBook.thumbnail
  if (
    updatedBook.thumbnail &&
    updatedBook.thumbnail !== oldBook.thumbnail &&
    !updatedBook.thumbnail.startsWith("/book-covers/")
  ) {
    try {
      const downloadedPath = await downloadAndStoreImageDirect(updatedBook.thumbnail, oldBook.thumbnail)
      if (downloadedPath) {
        localThumbnail = downloadedPath
      }
    } catch (error) {
      console.warn("Error downloading new image:", error)
    }
  }

  const cleanedBook = {
    ...updatedBook,
    title: updatedBook.title.trim(),
    author: updatedBook.author.trim(),
    series: updatedBook.series?.trim() || undefined,
    notes: updatedBook.notes?.trim() || undefined,
    thumbnail: localThumbnail,
  }

  data.users.admin.books[index] = cleanedBook
  await writeData(data)
  return cleanedBook
}

export async function deleteBook(bookId: string): Promise<void> {
  if (!bookId?.trim()) throw new Error("ID du livre requis")
  const data = await readData()

  const bookToDelete = data.users.admin.books.find((book) => book.id === bookId)

  const initialLength = data.users.admin.books.length
  data.users.admin.books = data.users.admin.books.filter((book) => book.id !== bookId)
  if (data.users.admin.books.length === initialLength) throw new Error("Livre non trouvé")

  // Delete associated image if it's local
  if (bookToDelete?.thumbnail?.startsWith("/book-covers/")) {
    try {
      const imagePath = path.join(process.cwd(), "public", bookToDelete.thumbnail)
      await fs.unlink(imagePath)
    } catch (error) {
      // Ignore errors when deleting images
    }
  }

  // Remove book from all reading folders
  data.users.admin.readingFolders.forEach((folder) => {
    folder.books = folder.books.filter((book) => book.bookId !== bookId)
  })

  await writeData(data)
}

export async function getWishlist(): Promise<Book[]> {
  const data = await readData()
  return data.users.admin.wishlist
}

export async function addToWishlist(book: Book): Promise<Book> {
  const data = await readData()
  const errors = validateBook(book)
  if (errors.length > 0) throw new Error(errors.join(", "))

  const newWishlistItem = {
    ...book,
    id: generateId(),
    title: book.title.trim(),
    author: book.author.trim(),
    addedDate: new Date().toISOString(),
  }

  const exists = data.users.admin.wishlist.some(
    (b) =>
      b.title.toLowerCase().trim() === newWishlistItem.title.toLowerCase().trim() &&
      b.author.toLowerCase().trim() === newWishlistItem.author.toLowerCase().trim(),
  )
  if (exists) throw new Error("Ce livre est déjà dans votre liste de souhaits")

  data.users.admin.wishlist.push(newWishlistItem)
  await writeData(data)
  return newWishlistItem
}

export async function removeFromWishlist(bookId: string): Promise<void> {
  if (!bookId?.trim()) throw new Error("ID du livre requis")
  const data = await readData()
  const initialLength = data.users.admin.wishlist.length
  data.users.admin.wishlist = data.users.admin.wishlist.filter((book) => book.id !== bookId)
  if (data.users.admin.wishlist.length === initialLength) {
    throw new Error("Livre non trouvé dans la liste de souhaits")
  }
  await writeData(data)
}

export async function moveToCollection(book: Book): Promise<Book> {
  const data = await readData()
  const newBook = {
    ...book,
    id: generateId(),
    addedDate: new Date().toISOString(),
    title: book.title.trim(),
    author: book.author.trim(),
  }

  const exists = data.users.admin.books.some(
    (b) =>
      b.title.toLowerCase().trim() === newBook.title.toLowerCase().trim() &&
      b.author.toLowerCase().trim() === newBook.author.toLowerCase().trim(),
  )
  if (!exists) data.users.admin.books.push(newBook)

  data.users.admin.wishlist = data.users.admin.wishlist.filter((item) => item.id !== book.id)
  await writeData(data)
  return newBook
}

// Reading Folders functions
export async function getReadingFolders(): Promise<ReadingFolder[]> {
  const data = await readData()
  return data.users.admin.readingFolders || []
}

export async function createReadingFolder(folder: Omit<ReadingFolder, "id" | "createdDate">): Promise<ReadingFolder> {
  const data = await readData()

  const newFolder: ReadingFolder = {
    ...folder,
    id: generateId(),
    createdDate: new Date().toISOString(),
  }

  if (!data.users.admin.readingFolders) {
    data.users.admin.readingFolders = []
  }

  data.users.admin.readingFolders.push(newFolder)
  await writeData(data)
  return newFolder
}

export async function updateReadingFolder(updatedFolder: ReadingFolder): Promise<ReadingFolder> {
  const data = await readData()

  if (!data.users.admin.readingFolders) {
    throw new Error("Aucun dossier de lecture trouvé")
  }

  const index = data.users.admin.readingFolders.findIndex((folder) => folder.id === updatedFolder.id)
  if (index === -1) throw new Error("Dossier non trouvé")

  data.users.admin.readingFolders[index] = updatedFolder
  await writeData(data)
  return updatedFolder
}

export async function deleteReadingFolder(folderId: string): Promise<void> {
  if (!folderId?.trim()) throw new Error("ID du dossier requis")
  const data = await readData()

  if (!data.users.admin.readingFolders) {
    throw new Error("Aucun dossier de lecture trouvé")
  }

  const initialLength = data.users.admin.readingFolders.length
  data.users.admin.readingFolders = data.users.admin.readingFolders.filter((folder) => folder.id !== folderId)
  if (data.users.admin.readingFolders.length === initialLength) {
    throw new Error("Dossier non trouvé")
  }
  await writeData(data)
}

export async function addBookToReadingFolder(folderId: string, bookId: string, notes?: string): Promise<void> {
  const data = await readData()

  if (!data.users.admin.readingFolders) {
    throw new Error("Aucun dossier de lecture trouvé")
  }

  const folder = data.users.admin.readingFolders.find((f) => f.id === folderId)
  if (!folder) throw new Error("Dossier non trouvé")

  // Check if book exists in collection
  const bookExists = data.users.admin.books.some((book) => book.id === bookId)
  if (!bookExists) throw new Error("Livre non trouvé dans la collection")

  // Check if book is already in folder
  if (folder.books.some((book) => book.bookId === bookId)) {
    throw new Error("Ce livre est déjà dans ce dossier")
  }

  const newOrder = Math.max(0, ...folder.books.map((book) => book.order)) + 1

  const readingOrderBook: ReadingOrderBook = {
    bookId,
    order: newOrder,
    addedDate: new Date().toISOString(),
    notes: notes?.trim() || undefined,
  }

  folder.books.push(readingOrderBook)
  await writeData(data)
}

export async function removeBookFromReadingFolder(folderId: string, bookId: string): Promise<void> {
  const data = await readData()

  if (!data.users.admin.readingFolders) {
    throw new Error("Aucun dossier de lecture trouvé")
  }

  const folder = data.users.admin.readingFolders.find((f) => f.id === folderId)
  if (!folder) throw new Error("Dossier non trouvé")

  const initialLength = folder.books.length
  folder.books = folder.books.filter((book) => book.bookId !== bookId)

  if (folder.books.length === initialLength) {
    throw new Error("Livre non trouvé dans ce dossier")
  }

  // Reorder remaining books
  folder.books = folder.books.sort((a, b) => a.order - b.order).map((book, index) => ({ ...book, order: index + 1 }))

  await writeData(data)
}

export async function reorderBooksInFolder(folderId: string, books: ReadingOrderBook[]): Promise<void> {
  const data = await readData()

  if (!data.users.admin.readingFolders) {
    throw new Error("Aucun dossier de lecture trouvé")
  }

  const folder = data.users.admin.readingFolders.find((f) => f.id === folderId)
  if (!folder) throw new Error("Dossier non trouvé")

  folder.books = books
  await writeData(data)
}

export async function getApiKeys(): Promise<{ comicVine?: string }> {
  const data = await readData()
  return data.users.admin.apiKeys || {}
}

export async function updateApiKeys(apiKeys: { comicVine?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await readData()
    if (!data.users.admin.apiKeys) data.users.admin.apiKeys = {}
    data.users.admin.apiKeys.comicVine = apiKeys.comicVine?.trim() || ""
    await writeData(data)
    return { success: true }
  } catch (error) {
    console.error("Error updating API keys:", error)
    return { success: false, error: "Erreur lors de la mise à jour des clés API" }
  }
}

export async function verifyPassword(password: string, ip?: string): Promise<boolean> {
  if (!password?.trim()) return false
  const data = await readData()
  const user = data.users.admin

  if (isAccountLocked(user)) {
    const remainingTime = Math.ceil((user.lockUntil! - Date.now()) / 1000 / 60)
    throw new Error(`Compte temporairement verrouillé. Réessayez dans ${remainingTime} minute(s).`)
  }

  const recentAttempts = getRecentAttempts(user)
  if (recentAttempts.length > 0) {
    const lastAttempt = recentAttempts[recentAttempts.length - 1]
    const timeSinceLastAttempt = Date.now() - lastAttempt.timestamp
    const requiredDelay = getDelayForAttempt(recentAttempts.length)
    if (timeSinceLastAttempt < requiredDelay) {
      const remainingDelay = Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000)
      throw new Error(`Trop de tentatives. Attendez ${remainingDelay} seconde(s) avant de réessayer.`)
    }
  }

  const isValid = user.password === password.trim()
  if (isValid) await recordSuccessfulLogin("admin")
  else await recordFailedAttempt("admin", ip)
  return isValid
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!currentPassword?.trim() || !newPassword?.trim()) {
      return { success: false, error: "Les mots de passe ne peuvent pas être vides" }
    }
    if (newPassword.length < 6) {
      return { success: false, error: "Le nouveau mot de passe doit contenir au moins 6 caractères" }
    }
    const data = await readData()
    const user = data.users.admin
    if (isAccountLocked(user)) {
      const remainingTime = Math.ceil((user.lockUntil! - Date.now()) / 1000 / 60)
      return { success: false, error: `Compte temporairement verrouillé. Réessayez dans ${remainingTime} minute(s).` }
    }
    if (user.password !== currentPassword.trim()) {
      await recordFailedAttempt("admin")
      return { success: false, error: "Mot de passe actuel incorrect" }
    }
    user.password = newPassword.trim()
    await recordSuccessfulLogin("admin")
    await writeData(data)
    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Erreur lors de la modification du mot de passe" }
  }
}

export async function getSecurityInfo(): Promise<{
  isLocked: boolean
  remainingLockTime?: number
  recentAttempts: number
  lastSuccessfulLogin?: number
}> {
  const data = await readData()
  const user = data.users.admin
  const recentAttempts = getRecentAttempts(user)
  const isLocked = isAccountLocked(user)
  return {
    isLocked,
    remainingLockTime: isLocked && user.lockUntil ? Math.ceil((user.lockUntil - Date.now()) / 1000 / 60) : undefined,
    recentAttempts: recentAttempts.length,
    lastSuccessfulLogin: user.lastSuccessfulLogin,
  }
}

export async function initializeData(initialBooks: Book[] = [], initialWishlist: Book[] = []) {
  const data = await readData()
  data.users.admin.books = initialBooks
  data.users.admin.wishlist = initialWishlist
  await writeData(data)
}

import { redirect } from "next/navigation"
import { isAuthenticated, logout } from "@/lib/auth"
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  changePassword,
  getReadingFolders,
  createReadingFolder,
  updateReadingFolder,
  deleteReadingFolder,
  addBookToReadingFolder,
  removeBookFromReadingFolder,
  reorderBooksInFolder,
  updateApiKeys,
} from "@/lib/db"
import ClientHomePage from "@/components/client-home-page"
import SettingsMenu from "@/components/settings-menu"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

// Force dynamic rendering to handle cookies
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect("/login")
  }

  const books = await getBooks()
  const readingFolders = await getReadingFolders()

  const handleLogout = async () => {
    "use server"
    await logout()
  }

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    "use server"
    return await changePassword(currentPassword, newPassword)
  }

  const handleUpdateApiKeys = async (apiKeys: { comicVine?: string }) => {
    "use server"
    try {
      await updateApiKeys(apiKeys)
      return { success: true }
    } catch (error) {
      return { success: false, error: "Erreur lors de la mise à jour des clés API" }
    }
  }

  const actions = {
    addBook: async (book: any) => {
      "use server"
      return await addBook(book)
    },
    updateBook: async (book: any) => {
      "use server"
      return await updateBook(book)
    },
    deleteBook: async (bookId: string) => {
      "use server"
      return await deleteBook(bookId)
    },
    addToWishlist: async (book: any) => {
      "use server"
      return await addBook({ ...book, isWishlist: true })
    },
    removeFromWishlist: async (bookId: string) => {
      "use server"
      return await deleteBook(bookId)
    },
    moveToCollection: async (book: any) => {
      "use server"
      return await updateBook({ ...book, isWishlist: false })
    },
    changePassword: handleChangePassword,
    logout: handleLogout,
    createReadingFolder: async (folder: any) => {
      "use server"
      return await createReadingFolder(folder)
    },
    updateReadingFolder: async (folder: any) => {
      "use server"
      return await updateReadingFolder(folder)
    },
    deleteReadingFolder: async (folderId: string) => {
      "use server"
      return await deleteReadingFolder(folderId)
    },
    addBookToReadingFolder: async (folderId: string, bookId: string, notes?: string) => {
      "use server"
      return await addBookToReadingFolder(folderId, bookId, notes)
    },
    removeBookFromReadingFolder: async (folderId: string, bookId: string) => {
      "use server"
      return await removeBookFromReadingFolder(folderId, bookId)
    },
    reorderBooksInFolder: async (folderId: string, books: any[]) => {
      "use server"
      return await reorderBooksInFolder(folderId, books)
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header avec boutons de paramètres et déconnexion */}
      <div className="container mx-auto p-4">
        <div className="flex justify-end gap-2 mb-4">
          <SettingsMenu onChangePassword={handleChangePassword} onUpdateApiKeys={handleUpdateApiKeys} />
          <form action={handleLogout}>
            <Button type="submit" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </form>
        </div>
      </div>

      <ClientHomePage
        initialBooks={books}
        initialWishlist={[]}
        initialReadingFolders={readingFolders}
        actions={actions}
      />
    </div>
  )
}

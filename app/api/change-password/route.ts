import { type NextRequest, NextResponse } from "next/server"
import { changePassword } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Mots de passe requis" }, { status: 400 })
    }

    const result = await changePassword(currentPassword, newPassword)

    if (result.success) {
      return NextResponse.json({ success: true, message: "Mot de passe modifié avec succès" })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

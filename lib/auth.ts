"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyPassword } from "./db"
import { headers } from "next/headers"

const AUTH_COOKIE_NAME = "isAuthenticated"

// Fonction pour obtenir l'IP du client (approximative)
async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const realIP = headersList.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return "unknown"
}

export async function login(formData: FormData) {
  const password = formData.get("password") as string

  try {
    const clientIP = await getClientIP()
    const isValid = await verifyPassword(password, clientIP)

    if (isValid) {
      const cookieStore = await cookies()
      cookieStore.set(AUTH_COOKIE_NAME, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 jour
        path: "/",
        sameSite: "lax",
      })
      return { success: true }
    } else {
      return { success: false, error: "Mot de passe incorrect" }
    }
  } catch (error) {
    // L'erreur peut contenir des informations sur le verrouillage ou les délais
    const errorMessage = error instanceof Error ? error.message : "Erreur de connexion"
    return { success: false, error: errorMessage }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
  redirect("/login")
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(AUTH_COOKIE_NAME)?.value === "true"
  } catch (error) {
    console.error("Auth check error:", error)
    return false
  }
}

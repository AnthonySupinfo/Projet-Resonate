import { createContext, useContext, useState, useEffect } from "react"
import { translations } from "../translations/index"
import { updateProfile } from "../api/auth"

const LanguageContext = createContext(null)

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageProvider({ children, user }) {
  // Initialise depuis localStorage si disponible, sinon "fr" par défaut
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr")

  // Quand l'utilisateur se connecte, sa langue BDD prend le dessus
  useEffect(() => {
    if (user?.language) {
      setLang(user.language)
      localStorage.setItem("lang", user.language)
    }
  }, [user?.language])

  async function toggleLanguage() {
    const newLang = lang === "fr" ? "en" : "fr"
    setLang(newLang)

    // Toujours sauvegarder dans localStorage (fonctionne connecté ou non)
    localStorage.setItem("lang", newLang)

    // Si connecté, sauvegarder aussi en BDD
    if (user) {
      try {
        await updateProfile({ language: newLang })
      } catch (e) {
        // Silencieux — la langue reste changée localement même si la BDD échoue
      }
    }
  }

  // t("login.title") - retourne le texte dans la bonne langue
  function t(key) {
    const keys = key.split(".")
    let result = translations[lang]
    for (const k of keys) {
      result = result?.[k]
    }
    return result || key
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
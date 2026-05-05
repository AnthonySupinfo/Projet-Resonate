import { createContext, useContext, useState } from "react"
import { translations } from "../translations/index"

const LanguageContext = createContext(null)

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("fr")

  function toggleLanguage() {
    setLang(prev => prev === "fr" ? "en" : "fr")
  }

  // t("login.title") → retourne le texte dans la bonne langue
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
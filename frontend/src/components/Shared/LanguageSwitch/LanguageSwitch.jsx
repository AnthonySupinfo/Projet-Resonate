import { useLanguage } from "../../../context/LanguageContext.jsx"
import "./LanguageSwitch.css"

export default function LanguageSwitch() {
  const { lang, toggleLanguage } = useLanguage()

  return (
    <button className="lang-switch" onClick={toggleLanguage} title="Changer de langue">
      {lang === "fr" ? (
        <svg width="22" height="22" viewBox="0 0 22 22">
          <clipPath id="circle-clip-fr">
            <circle cx="11" cy="11" r="11"/>
          </clipPath>
          <g clipPath="url(#circle-clip-fr)">
            <rect width="8" height="22" fill="#002395"/>
            <rect x="7" width="8" height="22" fill="#FFFFFF"/>
            <rect x="14" width="8" height="22" fill="#ED2939"/>
          </g>
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 22 22">
          <clipPath id="circle-clip-en">
            <circle cx="11" cy="11" r="11"/>
          </clipPath>
          <g clipPath="url(#circle-clip-en)">
            <rect width="22" height="22" fill="#012169"/>
            <path d="M0,0 L22,22 M22,0 L0,22" stroke="#fff" strokeWidth="4"/>
            <path d="M0,0 L22,22 M22,0 L0,22" stroke="#C8102E" strokeWidth="2"/>
            <path d="M11,0 V22 M0,11 H22" stroke="#fff" strokeWidth="6"/>
            <path d="M11,0 V22 M0,11 H22" stroke="#C8102E" strokeWidth="4"/>
          </g>
        </svg>
      )}
      <span className="lang-label">{lang === "fr" ? "FR" : "EN"}</span>
    </button>
  )
}
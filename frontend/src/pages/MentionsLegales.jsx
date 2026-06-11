import { useNavigate } from "react-router-dom"
import { useLanguage } from "../context/LanguageContext"
import "./MentionsLegales.css"

export default function MentionsLegales() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  const isFr = lang === "fr"

  return (
    <div className="mentions-container">
      <div className="mentions-card">
        <button className="mentions-back" onClick={() => navigate(-1)}>{t('mentionsLegales.backBtn')}</button>

        <h1 className="mentions-title">{t('mentionsLegales.title')}</h1>

        <section className="mentions-section">
          <h2>{isFr ? "Éditeur du site" : "Publisher"}</h2>
          <p>{isFr ? "Resonate est un projet scolaire réalisé dans le cadre du module SUPCONTENT à SUPINFO." : "Resonate is a school project developed as part of the SUPCONTENT module at SUPINFO."}</p>
          <p><strong>{isFr ? "Équipe de développement :" : "Development team:"}</strong> Anthony, Krishna, Mélissa, Élisa</p>
          <p><strong>{isFr ? "Établissement :" : "Institution:"}</strong> SUPINFO - École Internationale d'Informatique</p>
        </section>

        <section className="mentions-section">
          <h2>{isFr ? "Hébergement" : "Hosting"}</h2>
          <p>{isFr ? "L'application est hébergée localement via Docker Compose sur la machine de l'utilisateur. Aucune donnée n'est transmise à un serveur tiers." : "The application is hosted locally via Docker Compose on the user's machine. No data is transmitted to third-party servers."}</p>
        </section>

        <section className="mentions-section">
          <h2>{isFr ? "Données personnelles collectées" : "Personal data collected"}</h2>
          <p>{isFr ? "Dans le cadre de l'utilisation de Resonate, les données suivantes sont collectées :" : "When using Resonate, the following data is collected:"}</p>
          <ul>
            <li>{isFr ? "Adresse email" : "Email address"}</li>
            <li>{isFr ? "Nom d'utilisateur (@username)" : "Username (@username)"}</li>
            <li>{isFr ? "Mot de passe (hashé avec bcrypt - jamais stocké en clair)" : "Password (hashed with bcrypt - never stored in plain text)"}</li>
            <li>{isFr ? "Informations de profil optionnelles : prénom, nom, date de naissance, avatar, biographie, site web" : "Optional profile info: first name, last name, date of birth, avatar, biography, website"}</li>
            <li>{isFr ? "Contenu généré : critiques, commentaires, playlists, bibliothèque d'albums" : "Generated content: reviews, comments, playlists, album library"}</li>
            <li>{isFr ? "Préférences : thème, langue, notifications email" : "Preferences: theme, language, email notifications"}</li>
          </ul>
        </section>

        <section className="mentions-section">
          <h2>{isFr ? "Finalité du traitement" : "Purpose of processing"}</h2>
          <p>{isFr ? "Les données collectées sont utilisées exclusivement pour :" : "Collected data is used exclusively for:"}</p>
          <ul>
            <li>{isFr ? "L'authentification et la gestion de votre compte" : "Authentication and account management"}</li>
            <li>{isFr ? "L'affichage de votre profil public" : "Displaying your public profile"}</li>
            <li>{isFr ? "Le fonctionnement des fonctionnalités sociales (follows, critiques, notifications)" : "Social features (follows, reviews, notifications)"}</li>
            <li>{isFr ? "L'envoi de notifications email si vous les avez activées" : "Sending email notifications if enabled"}</li>
          </ul>
          <p>{isFr ? "Aucune donnée n'est vendue ou transmise à des tiers." : "No data is sold or shared with third parties."}</p>
        </section>

        <section className="mentions-section">
          <h2>{isFr ? "Vos droits (RGPD)" : "Your rights (GDPR)"}</h2>
          <p>{isFr ? "Conformément au RGPD, vous disposez des droits suivants :" : "Under GDPR, you have the following rights:"}</p>
          <ul>
            <li><strong>{isFr ? "Droit d'accès" : "Right of access"}</strong> - {isFr ? "Exportez vos données via Paramètres → Exporter mes données (JSON et CSV)" : "Export your data via Settings → Download my data (JSON and CSV)"}</li>
            <li><strong>{isFr ? "Droit de rectification" : "Right of rectification"}</strong> - {isFr ? "Modifiez vos informations dans vos Paramètres" : "Edit your information in Settings"}</li>
            <li><strong>{isFr ? "Droit à l'effacement" : "Right to erasure"}</strong> - {isFr ? "Supprimez votre compte via Paramètres → Supprimer mon compte" : "Delete your account via Settings → Delete my account"}</li>
            <li><strong>{isFr ? "Droit à la portabilité" : "Right to portability"}</strong> - {isFr ? "Téléchargez vos données au format JSON ou CSV" : "Download your data in JSON or CSV format"}</li>
            <li><strong>{isFr ? "Droit d'opposition" : "Right to object"}</strong> - {isFr ? "Désactivez les notifications email dans vos Paramètres" : "Disable email notifications in Settings"}</li>
          </ul>
        </section>

        <section className="mentions-section">
          <h2>{isFr ? "Cookies et stockage local" : "Cookies and local storage"}</h2>
          <p>{isFr ? "Resonate utilise le localStorage de votre navigateur pour stocker :" : "Resonate uses your browser's localStorage to store:"}</p>
          <ul>
            <li>{isFr ? "Votre token d'authentification (supprimé à la déconnexion)" : "Your authentication token (deleted on logout)"}</li>
            <li>{isFr ? "Vos préférences de thème et de langue" : "Your theme and language preferences"}</li>
          </ul>
          <p>{isFr ? "Aucun cookie tiers ni tracker publicitaire n'est utilisé." : "No third-party cookies or advertising trackers are used."}</p>
        </section>

        <section className="mentions-section">
          <h2>{isFr ? "API tierce - Last.fm" : "Third-party API - Last.fm"}</h2>
          <p>{isFr ? "Resonate utilise l'API Last.fm pour récupérer les métadonnées des albums. Les recherches sont transmises à Last.fm conformément à leurs " : "Resonate uses the Last.fm API to retrieve album metadata. Searches are transmitted to Last.fm in accordance with their "}<a href="https://www.last.fm/legal/terms" target="_blank" rel="noopener noreferrer">{isFr ? "conditions d'utilisation" : "terms of use"}</a>.</p>
        </section>

        <div className="mentions-footer">
          <p>{t('mentionsLegales.updatedAt')}</p>
        </div>
      </div>
    </div>
  )
}
import { useNavigate } from "react-router-dom"
import "./MentionsLegales.css"

export default function MentionsLegales() {
  const navigate = useNavigate()

  return (
    <div className="mentions-container">
      <div className="mentions-card">
        <button className="mentions-back" onClick={() => navigate(-1)}>← Retour</button>

        <h1 className="mentions-title">Mentions légales & RGPD</h1>

        <section className="mentions-section">
          <h2>Éditeur du site</h2>
          <p>Resonate est un projet scolaire réalisé dans le cadre du module SUPCONTENT à SUPINFO.</p>
          <p><strong>Équipe de développement :</strong> Anthony, Krishna, Mélissa, Élisa</p>
          <p><strong>Établissement :</strong> SUPINFO - École Internationale d'Informatique</p>
        </section>

        <section className="mentions-section">
          <h2>Hébergement</h2>
          <p>L'application est hébergée localement via Docker Compose sur la machine de l'utilisateur. Aucune donnée n'est transmise à un serveur tiers.</p>
        </section>

        <section className="mentions-section">
          <h2>Données personnelles collectées</h2>
          <p>Dans le cadre de l'utilisation de Resonate, les données suivantes sont collectées :</p>
          <ul>
            <li>Adresse email</li>
            <li>Nom d'utilisateur (@username)</li>
            <li>Mot de passe (hashé avec bcrypt - jamais stocké en clair)</li>
            <li>Informations de profil optionnelles : prénom, nom, date de naissance, avatar, biographie, site web</li>
            <li>Contenu généré : critiques, commentaires, playlists, bibliothèque d'albums</li>
            <li>Préférences : thème, langue, notifications email</li>
          </ul>
        </section>

        <section className="mentions-section">
          <h2>Finalité du traitement</h2>
          <p>Les données collectées sont utilisées exclusivement pour :</p>
          <ul>
            <li>L'authentification et la gestion de votre compte</li>
            <li>L'affichage de votre profil public</li>
            <li>Le fonctionnement des fonctionnalités sociales (follows, critiques, notifications)</li>
            <li>L'envoi de notifications email si vous les avez activées</li>
          </ul>
          <p>Aucune donnée n'est vendue ou transmise à des tiers.</p>
        </section>

        <section className="mentions-section">
          <h2>Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès</strong> - Exportez toutes vos données via Paramètres → Exporter mes données (formats JSON et CSV disponibles)</li>
            <li><strong>Droit de rectification</strong> - Modifiez vos informations à tout moment dans vos Paramètres</li>
            <li><strong>Droit à l'effacement</strong> - Supprimez définitivement votre compte via Paramètres → Supprimer mon compte</li>
            <li><strong>Droit à la portabilité</strong> - Téléchargez vos données au format JSON ou CSV</li>
            <li><strong>Droit d'opposition</strong> - Désactivez les notifications email dans vos Paramètres</li>
          </ul>
        </section>

        <section className="mentions-section">
          <h2>Cookies et stockage local</h2>
          <p>Resonate utilise le <strong>localStorage</strong> de votre navigateur pour stocker :</p>
          <ul>
            <li>Votre token d'authentification (supprimé à la déconnexion)</li>
            <li>Vos préférences de thème et de langue</li>
          </ul>
          <p>Aucun cookie tiers n'est utilisé. Aucun tracker publicitaire n'est présent.</p>
        </section>

        <section className="mentions-section">
          <h2>API tierce - Last.fm</h2>
          <p>Resonate utilise l'API Last.fm pour récupérer les métadonnées des albums (pochettes, artistes, pistes). Les recherches effectuées sont transmises à Last.fm conformément à leurs <a href="https://www.last.fm/legal/terms" target="_blank" rel="noopener noreferrer">conditions d'utilisation</a>.</p>
        </section>

        <div className="mentions-footer">
          <p>Dernière mise à jour : Juin 2026</p>
        </div>
      </div>
    </div>
  )
}
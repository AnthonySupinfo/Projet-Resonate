import { Link } from "react-router-dom"
import "./Footer.css"

export default function Footer() {
  return (
    <footer className="app-footer">
      <span className="app-footer__text">© 2026 - Resonate</span>
      <Link to="/mentions-legales" className="app-footer__link">
        Mentions légales & RGPD
      </Link>
    </footer>
  )
}
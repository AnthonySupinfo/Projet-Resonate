import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { LanguageProvider } from "./context/LanguageContext"
import Login from "./pages/Login"
import OAuthCallback from "./pages/OAuthCallback"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Register from "./pages/Register"
import LanguageSwitch from "./components/LanguageSwitch"
import Settings from "./pages/Settings"
import Home from "./pages/Home/Home"
import GuestLayout from "./components/Layout/GuestLayout.jsx";
import AuthLayout from "./components/Layout/AuthLayout.jsx";

// Redirige vers /login si l'utilisateur n'est pas connecté
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Chargement...
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

// Page d'accueil - accessible connecté ou non
// function Home() {
//   const { user, logout } = useAuth()
//   const navigate = useNavigate()
//
//   return (
//     <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", gap: 12 }}>
//       <div style={{ textAlign: "center" }}>
//         <h1>Resonate</h1>
//         {user ? (
//           <>
//             <p>Connecté en tant que : {user.role}</p>
//             <button type="button" onClick={logout} style={{ marginTop: 12, padding: "8px 12px" }}>
//               Se déconnecter
//             </button>
//           </>
//         ) : (
//           <>
//             <p>Bienvenue sur Resonate</p>
//             <button type="button" onClick={() => navigate("/login")} style={{ marginTop: 12, padding: "8px 12px" }}>
//               Se connecter
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   )
// }

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/*  Guest routes  */}
        <Route element={<GuestLayout />}>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {!user && <Route path="/" element={<Home />} />}
        </Route>

      {/*  Authentified user routes  */}

            <Route element={
                <ProtectedRoute>
                    <AuthLayout />
                </ProtectedRoute>
            }>
                {<Route path="/" element={<Home />} />}
                <Route path="/settings" element={<Settings />} />
            </Route>

      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <LanguageSwitch />
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
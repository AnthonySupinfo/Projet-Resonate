import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { LanguageProvider } from "./context/LanguageContext"
import Login from "./pages/Login/Login.jsx"
import OAuthCallback from "./pages/OAuthCallback"
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword/ResetPassword.jsx"
import Register from "./pages/Register/Register.jsx"
import LanguageSwitch from "./components/Shared/LanguageSwitch/LanguageSwitch.jsx"
import Settings from "./pages/Settings"
import Home from "./pages/Home/Home"
import GuestLayout from "./components/Layout/GuestLayout/GuestLayout.jsx";
import AuthLayout from "./components/Layout/AuthLayout/AuthLayout.jsx";
import Explore from "./pages/Explore/Explore.jsx";

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
      {/*  Unique routes  */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

      {/*  Guest routes  */}
        <Route element={<GuestLayout />}>
            {!user && <Route path="/" element={<Home />} />}
            {!user && <Route path="/explore" element={<Explore />} />}
        </Route>

      {/*  Authentified user routes  */}
        <Route element={
            <ProtectedRoute>
                <AuthLayout />
            </ProtectedRoute>
        }>
            {<Route path="/" element={<Home />} />}
            {<Route path="/explore" element={<Explore />} />}
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
          {/*<LanguageSwitch />*/}
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
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
import Profile from "./pages/Profile/Profile.jsx";
import Social from "./pages/Social/Social.jsx";

import LibraryPage from "./pages/LibraryPage";
import AllPlaylistPage from "./pages/AllPlaylistsPage";
import PlaylistDetailPage from "./pages/PlaylistDetailPage";
import MyAlbumsPage from "./pages/MyAlbumsPage";

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
            {<Route path="/profile" element={<Profile />} />}
            {<Route path="/user/:id" element={<Profile />} />}
            {<Route path="/settings" element={<Settings/>}/>}
            {<Route path="/social" element={<Social/>}/>}
            <Route path="/settings" element={<Settings />} />

            <Route path="library" element={<LibraryPage />} />
            <Route path="library/playlists" element={<AllPlaylistPage />} />
            <Route path="library/playlists/:id" element={<PlaylistDetailPage />} />
            <Route path="library/albums" element={<MyAlbumsPage />} />
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
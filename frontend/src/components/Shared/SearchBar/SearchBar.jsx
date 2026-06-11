import { useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { useNavigate } from "react-router-dom";
import { searchService } from "../../../api/search.service";
import { useLanguage } from "../../../context/LanguageContext.jsx"

export default function SearchBar() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [albumResults, setAlbumResults] = useState([]);
  const [userResults, setUserResults] = useState([]);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchResults = async (q) => {
    try {
      const [dataAlbums, dataUsers] = await Promise.all([
        searchService.searchAlbums(q, 3, 1),
        searchService.searchUsers(q)
      ]);

      setAlbumResults(dataAlbums.results || []);
      setUserResults((dataUsers.results || []).slice(0, 3));
    } catch (error) {
      console.error("Erreur search:", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length > 1) {
        fetchResults(query);
      } else {
        setAlbumResults([]);
        setUserResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAlbumResults([]);
        setUserResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeDropdown = () => {
    setAlbumResults([]);
    setUserResults([]);
  };

  const hasResults = albumResults.length > 0 || userResults.length > 0;

  return (
      <div className="searchbar-container">
        <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            className="navbar-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(`/search?q=${encodeURIComponent(query)}`);
                closeDropdown();
              }
            }}
        />

        {hasResults && (
            <div className="search-dropdown" ref={dropdownRef}>
              {userResults.length > 0 && (
                  <div className="search-section">
                    <p className="search-section-title">{t('home.searchUsers')}</p>
                    {userResults.map((user) => (
                        <div key={user.id} className="search-item" onClick={() => { navigate(`/user/${user.id}`); closeDropdown(); }}>
                          <p><strong>@{user.username}</strong></p>
                        </div>
                    ))}
                  </div>
              )}

              {albumResults.length > 0 && (
                  <div className="search-section">
                    <p className="search-section-title">{t('home.searchAlbums')}</p>
                    {albumResults.map((album, index) => (
                        <div key={`album-${index}`} className="search-item" onClick={() => { navigate(`/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.name)}`); closeDropdown(); }}>
                          <p><strong>{album.name}</strong></p>
                          <p className="search-item-artist">{album.artist}</p>
                        </div>
                    ))}
                  </div>
              )}
            </div>
        )}
      </div>
  );
}
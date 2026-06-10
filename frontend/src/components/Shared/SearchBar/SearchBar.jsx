import { useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [albumResults, setAlbumResults] = useState([]);
  const [userResults, setUserResults] = useState([]);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchResults = async (q) => {
    try {
      const [resAlbums, resUsers] = await Promise.all([
        fetch(`/api/v1/search/albums?q=${q}&limit=3`),
        fetch(`/api/v1/search/users?q=${q}`)
      ]);

      const dataAlbums = await resAlbums.json();
      const dataUsers = await resUsers.json();

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
      if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
      ) {
        setAlbumResults([]);
        setUserResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
            placeholder="Que voulez-vous écouter..?"
            className="navbar-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(`/search?q=${query}`);
                closeDropdown();
              }
            }}
        />

        {hasResults && (
            <div className="search-dropdown" ref={dropdownRef}>

              {userResults.length > 0 && (
                  <div className="search-section">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Utilisateurs
                    </p>
                    {userResults.map((user) => (
                        <div
                            key={user.id}
                            className="search-item"
                            onClick={() => {
                              navigate(`/user/${user.id}`);
                              closeDropdown();
                            }}
                        >
                          <p><strong>@{user.username}</strong></p>
                        </div>
                    ))}
                  </div>
              )}

              {albumResults.length > 0 && (
                  <div className="search-section">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Albums
                    </p>
                    {albumResults.map((album, index) => (
                        <div
                            key={`album-${index}`}
                            className="search-item"
                            onClick={() => {
                              navigate(`/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.name)}`);
                              closeDropdown();
                            }}
                        >
                          <p><strong>{album.name}</strong></p>
                          <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{album.artist}</p>
                        </div>
                    ))}
                  </div>
              )}

            </div>
        )}
      </div>
  );
}
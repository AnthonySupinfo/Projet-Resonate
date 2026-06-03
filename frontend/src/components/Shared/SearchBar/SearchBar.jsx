import { useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // appel API
  const fetchResults = async (q) => {
    try {
      const res = await fetch(
        `/api/v1/search/albums?q=${q}&limit=5`
      );
      const data = await res.json();

      setResults(data.results || []);
    } catch (error) {
      console.error("Erreur search:", error);
    }
  };

  // debounce 300ms
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length > 1) {
        fetchResults(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // debug (temporaire)
  useEffect(() => {
    console.log("RESULTS:", results);
  }, [results]);

  // fermer dropdown au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setResults([]); // ferme le dropdown 
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="searchbar-container">
      {/* input */}
      <input
        type="text"
        placeholder="Que voulez-vous écouter..?"
        className="navbar-search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate(`/search?q=${query}`);
            }
        }}
      />

      {/* dropdown résultats */}
      {results.length > 0 && (
        <div className="search-dropdown" ref={dropdownRef}>
          {results.map((album, index) => (
            <div key={index} className="search-item" onClick={() => 
              navigate(
                `/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.name)}`
                )}>
              <p><strong>{album.name}</strong></p>
              <p>{album.artist}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
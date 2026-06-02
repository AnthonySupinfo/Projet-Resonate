import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./SearchResults.css";
import SearchBar from "../../components/Shared/SearchBar/SearchBar";

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search).get("q");

  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [activeTab, setActiveTab] = useState("albums");
  const [sortBy, setSortBy] = useState("default");

  const [yearMin, setYearMin] = useState(null);
  const [yearMax, setYearMax] = useState(null);

  const [genre, setGenre] = useState("");

  // FETCH FUNCTION
  const fetchResults = async (pageNumber) => {
    if (!query || loading || !hasMore) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/v1/search/albums?q=${query}&limit=20&page=${pageNumber}`
      );
      const data = await res.json();

      const newResults = data.results || [];

      if (newResults.length === 0) {
        setHasMore(false);
      } else {
        setResults((prev) => {
          const existing = new Set(
            prev.map((a) => a.name + a.artist)
          );

          const filtered = newResults.filter(
            (a) => !existing.has(a.name + a.artist)
          );

          return [...prev, ...filtered];
        });
      }

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // INITIAL LOAD (reset quand query change)
  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);

    fetchResults(1);
  }, [query]);

  // LOAD NEXT PAGE
  useEffect(() => {
    if (page > 1) {
      fetchResults(page);
    }
  }, [page]);

  // SCROLL DETECTION
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        if (!loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  // FILTER PAR ORDRE ALPHABETIQUE
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "az") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "za") {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  // FILTER PAR ANNEE ET GENRE (filtrage basique côté frontend, à améliorer côté backend pour de meilleures performances)
  const filteredByGenre = genre
    ? sortedResults.filter((album) => {
        const g = genre.toLowerCase();
        const name = album.name?.toLowerCase() || "";
        const artist = album.artist?.toLowerCase() || "";

        return name.includes(g) || artist.includes(g);
      })
    : sortedResults;

  // ✅ fallback si aucun résultat
  const finalResults =
    filteredByGenre.length > 0 ? filteredByGenre : sortedResults;

  return (
    <div className="search-page">

      <h1 className="search-title">
        Résultats pour "{query}"
      </h1>

      {/* TABS = ONGLETS */}
      <div className="search-tabs">

        <button
          className={activeTab === "albums" ? "active" : ""}
          onClick={() => setActiveTab("albums")}
        >
          Albums
        </button>

        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Utilisateurs
        </button>

        <button
          className={activeTab === "lists" ? "active" : ""}
          onClick={() => setActiveTab("lists")}
        >
          Listes
        </button>

      </div>

      { /* SORTING = TRI */ }
      <div className="search-sort">
        <span>Trier par :</span>

        <button
          className={sortBy === "az" ? "active" : ""}
          onClick={() => setSortBy("az")}
        >
          A-Z
        </button>

        <button
          className={sortBy === "za" ? "active" : ""}
          onClick={() => setSortBy("za")}
        >
          Z-A
        </button>
      </div>

      {/* TRI PAR ANNEE */}
      <div className="search-filters">
        <label>Année :</label>

        <input
          type="number"
          placeholder="Min"
          value={yearMin || ""}
          onChange={(e) => setYearMin(Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="Max"
          value={yearMax || ""}
          onChange={(e) => setYearMax(Number(e.target.value))}
        />
      </div>

      {/* TRI PAR GENRE */}
      <label>Genre :</label>
      <select
        className="genre-select"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      >
        <option value="">Tous les genres</option>
        <option value="pop">Pop</option>
        <option value="rock">Rock</option>
        <option value="hip hop">Hip-Hop</option>
        <option value="rap">Rap</option>
        <option value="electronic">Electronic</option>
      </select>

      { /* RESULTS = RÉSULTATS */ }
      {activeTab === "albums" && (
        <div className="search-grid">
          {finalResults.map((album) => {
            const imageUrl =
              album.image?.[2]?.["#text"] ||
              album.image?.[1]?.["#text"] ||
              album.image?.[0]?.["#text"];

            return (
              <div
                key={album.url || album.name + album.artist}
                className="search-card"
                onClick={() =>
                  navigate(
                    `/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.name)}`
                  )
                }
              >
                <img
                  src={
                    imageUrl
                      ? `/api/v1/image-proxy?url=${encodeURIComponent(imageUrl)}`
                      : "/fallback.jpg"
                  }
                  alt={album.name}
                />

                <p className="album-name">{album.name}</p>
                <p className="album-artist">{album.artist}</p>

                {album.year && (
                  <p className="album-year">{album.year}</p>
                )}

                <p className="album-rating">⭐ {album.rating || "--"}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "users" && (
        <p style={{ opacity: 0.6 }}>Aucun utilisateur pour le moment</p>
      )}

      {activeTab === "lists" && (
        <p style={{ opacity: 0.6 }}>Aucune liste pour le moment</p>
      )}

      {/* LOADER */}
      {loading && (
        <p style={{ textAlign: "center", marginTop: 20 }}>
          Chargement...
        </p>
      )}

      {/* FIN */}
      {!hasMore && (
        <p style={{ textAlign: "center", opacity: 0.6 }}>
          Plus de résultats
        </p>
      )}

    </div>
  );
}
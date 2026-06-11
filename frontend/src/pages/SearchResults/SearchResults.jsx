import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./SearchResults.css";
import { searchService } from "../../api/search.service";
import {useLanguage} from "../../context/LanguageContext.jsx";

export default function SearchResults() {
  const { t } = useLanguage();
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

  const [userResults, setUserResults] = useState([]);

  const fetchResults = async (pageNumber) => {
    if (!query) return;
    if (pageNumber > 1 && (loading || !hasMore)) return;

    setLoading(true);

    try {
      const data = await searchService.searchAlbums(query, 20, pageNumber);
      const newResults = data.results || [];

      if (newResults.length === 0) {
        setHasMore(false);
      } else {
        setResults((prev) => {
          const currentPrev = pageNumber === 1 ? [] : prev;
          const existing = new Set(currentPrev.map((a) => a.name + a.artist));
          const filtered = newResults.filter((a) => !existing.has(a.name + a.artist));
          return [...currentPrev, ...filtered];
        });
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);
    fetchResults(1);
  }, [query]);

  useEffect(() => {
    if (page > 1) {
      fetchResults(page);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if (!loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  const fetchUsers = async () => {
    if (!query) return;
    try {
      const data = await searchService.searchUsers(query);
      setUserResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [query]);

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "az") return a.name.localeCompare(b.name);
    if (sortBy === "za") return b.name.localeCompare(a.name);
    return 0;
  });

  const filteredByGenre = genre
      ? sortedResults.filter((album) => {
        const g = genre.toLowerCase();
        const name = album.name?.toLowerCase() || "";
        const artist = album.artist?.toLowerCase() || "";
        return name.includes(g) || artist.includes(g);
      })
      : sortedResults;

  const finalResults = filteredByGenre.length > 0 ? filteredByGenre : sortedResults;

  return (
      <div className="search-page">
        <h1 className="search-title">{t('home.resultsFor')} "{query}"</h1>

        <div className="search-tabs">
          <button className={activeTab === "albums" ? "active" : ""} onClick={() => setActiveTab("albums")}>{t('home.tabsAlbums')}</button>
          <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>{t('home.tabsUsers')}</button>
          <button className={activeTab === "lists" ? "active" : ""} onClick={() => setActiveTab("lists")}>{t('home.tabsLists')}</button>
        </div>

        {activeTab === "albums" && (
            <>
              <div className="search-sort">
                <span>{t('home.sortBy')}</span>
                <button className={sortBy === "az" ? "active" : ""} onClick={() => setSortBy("az")}>A-Z</button>
                <button className={sortBy === "za" ? "active" : ""} onClick={() => setSortBy("za")}>Z-A</button>
              </div>

              <div className="search-filters">
                <label>{t('home.year')}</label>
                <input type="number" placeholder={t('home.min')} value={yearMin || ""} onChange={(e) => setYearMin(Number(e.target.value))} />
                <input type="number" placeholder={t('home.max')} value={yearMax || ""} onChange={(e) => setYearMax(Number(e.target.value))} />
                <label>{t('home.genre')}</label>
                <select className="genre-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                  <option value="">{t('home.allGenres')}</option>
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="hip hop">Hip-Hop</option>
                  <option value="rap">Rap</option>
                  <option value="electronic">Electronic</option>
                </select>
              </div>
            </>
        )}

        {activeTab === "albums" && (
            <div className="search-grid">
              {finalResults.map((album) => {
                const imageUrl = album.image?.[2]?.["#text"] || album.image?.[1]?.["#text"] || album.image?.[0]?.["#text"];
                return (
                    <div
                        key={album.url || album.name + album.artist}
                        className="search-card"
                        onClick={() => navigate(`/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.name)}`)}
                    >
                      <img src={imageUrl ? `/api/v1/image-proxy?url=${encodeURIComponent(imageUrl)}` : "/fallback.svg"} alt={album.name} />
                      <p className="album-name">{album.name}</p>
                      <p className="album-artist">{album.artist}</p>
                      {album.year && <p className="album-year">{album.year}</p>}
                    </div>
                );
              })}
            </div>
        )}

        {activeTab === "users" && (
            <div className="search-grid">
              {userResults.length === 0 ? (
                  <p className="search-empty-state">{t('home.noUsers')}</p>
              ) : (
                  userResults.map((user) => (
                      <Link key={user.id} to={`/user/${user.id}`} className="search-card">
                        <p className="album-name">{user.username}</p>
                      </Link>
                  ))
              )}
            </div>
        )}
        {activeTab === "lists" && <p className="search-empty-state">{t('home.noLists')}</p>}
        {loading && <p className="search-loader">{t('home.loading')}</p>}
        {!hasMore && <p className="search-end-msg">{t('home.noMoreResults')}</p>}
      </div>
  );
}
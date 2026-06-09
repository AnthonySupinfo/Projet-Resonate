import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AlbumPage.css";
import AlbumActions from "../../components/AlbumActions/AlbumActions.jsx";
import { addTrackToPlaylist, getMyPlaylist, getPlaylistById, toggleFavorite } from "../../api/api";
import ReviewList from "../../components/reviews/ReviewList/ReviewList.jsx";


export default function AlbumPage() {
  
  const { artist, album } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const [favoriteTracks, setFavoriteTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const [openDropdownTrack, setOpenDropdownTrack] = useState(null);
  const [toast, setToast] = useState(null);


  useEffect(() => {
    if (!artist || !album || album === "null") return;
    const fetchAlbum = async () => {
      const res = await fetch(`/api/v1/detail/${artist}/${album}`);
      const json = await res.json();
      setData(json);
    };

    fetchAlbum();
  }, [artist, album]);


  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const playlistsData = await getMyPlaylist();

        const favoritePlaylist = playlistsData.find(p => p.is_favorite);

        if (!favoritePlaylist) return;

        const favDetails = await getPlaylistById(favoritePlaylist.id);

        // noms des tracks favoris
        const favTrackNames = favDetails.tracks.map(t => t.name);

        // comparer avec les tracks de l'album
        const favPositions = data.tracks
          .filter(track => favTrackNames.includes(track.name))
          .map(track => track.position);

        setFavoriteTracks(favPositions);

      } catch (err) {
        console.error(err);
      }
    };

    if (data && favoriteTracks.length === 0) {
      fetchFavorites();
    }
  }, [data]);


  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await getMyPlaylist();
        setPlaylists(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlaylists();
  }, []);

  const handleAddToPlaylist = async (track, playlistId) => {
    const targetPlaylist = playlists.find(p => p.id === playlistId);

    const isAlreadyAdded = targetPlaylist?.tracks?.some(t => t.name === track.name);
    if (isAlreadyAdded) return;

    try {
      await addTrackToPlaylist(playlistId, { track_id: track.name, artist: data.artist });

      setPlaylists(prevPlaylists =>
          prevPlaylists.map(p => {
            if (p.id === playlistId) {
              const updatedTracks = [...(p.tracks || []), { name: track.name }];
              return { ...p, tracks: updatedTracks };
            }
            return p;
          })
      );

      setToast(`Ajouté à "${targetPlaylist.name}"`);
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error(err);
      setToast("Erreur lors de l'ajout");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const toggleFavoriteUI = (trackId) => {
    setFavoriteTracks((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };




  const handleFavorite = async (track) => {
    try {
      const res = await toggleFavorite({
        track_name: track.name,
        artist: data.artist
      });

      // update UI selon réponse backend
      setFavoriteTracks((prev) => {
        if (res.status === "added") {
          if (prev.includes(track.position)) return prev; // évite doublon
          return [...prev, track.position];
        } else {
          return prev.filter((id) => id !== track.position);
        }
      });


      // afficher message
      if (res.status === "added") {
        setToast(`"${track.name}" ajoutée aux favoris`);
      } else {
        setToast(`"${track.name}" retirée des favoris`);
      }

      // disparition automatique
      setTimeout(() => setToast(null), 2000);


    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownTrack(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  if (!data || !data.tracks) return <div className="album-loading">Chargement...</div>;

  return (
    <div className="album-page-container" style={{backgroundImage: data.image ? `url(/api/v1/image-proxy?url=${encodeURIComponent(data.image)})` : "none",  }}>
      
      <div className="album-overlay" />
      <div className="album-card">

        {/* BOUTON RETOUR */}
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Retour
        </button>

        {/* HEADER */}
        <div className="album-header">    
            <img
              src={
                data.image
                  ? `/api/v1/image-proxy?url=${encodeURIComponent(data.image)}`
                  : "/fallback.jpg"
              }
              alt={data.name}
              className="album-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/fallback.jpg";
              }}
            />
          <div className="album-info">
            <h1>{data.name}</h1>
            <p className="artist">{data.artist}</p>

            <div className="album-meta">
              <span>⭐ {data.average_rating || "Pas de note"}</span>
              <div className="genres">
                {data.genres?.map((g, i) => (
                  <span key={i}>#{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AlbumActions albumId={data.id} />

        {/* TRACKS */}
        <div className="tracks-section">
          <h2>Tracks</h2>

          {data.tracks?.length > 0 ? (
            <div className="tracks-list">
              {data.tracks ?.filter(track => track && track.name) .map((track) => (
                <div key={`${track.name}-${track.position ?? "no-pos"}`} className="track-row">
                  <span className="track-index">
                    {track?.position ? track.position.toString().padStart(2, "0") : "--"}
                  </span>

                  <span className="track-name">
                    {track.name}
                  </span>

                  <span className="track-duration">
                    {track.duration
                      ? Math.floor(track.duration / 60) +
                        ":" +
                        String(track.duration % 60).padStart(2, "0")
                      : "--:--"}
                  </span>

                  <div className="track-actions">
                    
                    <button
                      className={`track-heart ${
                        favoriteTracks.includes(track.position) ? "active" : ""
                      }`}
                      onClick={() => handleFavorite(track)}
                    >
                      {favoriteTracks.includes(track.position) ? "❤️" : "🤍"}
                    </button>

                    <div className="track-dropdown-wrapper">
                      <button
                        className="track-add"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownTrack(
                            openDropdownTrack === track.name ? null : track.name
                          );
                        }}
                      >
                        +
                      </button>

                      {openDropdownTrack === track.name && (
                          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            {playlists.length === 0 ? (
                                <div className="dropdown-item empty">
                                  Aucune playlist — crée-en une
                                </div>
                            ) : (
                                playlists.map((playlist) => {
                                  const isAdded = playlist.tracks?.some(t => t.name === track.name);

                                  return (
                                      <div
                                          key={playlist.id}
                                          className={`dropdown-item ${isAdded ? 'added' : ''}`}
                                          onClick={() => handleAddToPlaylist(track, playlist.id)}
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            cursor: isAdded ? 'default' : 'pointer',
                                            opacity: isAdded ? 0.7 : 1
                                          }}
                                      >
                                        <span>{playlist.name}</span>
                                        {isAdded && <span style={{ color: 'var(--success-icon, #6ee7b7)', fontWeight: 'bold' }}>✓</span>}
                                      </div>
                                  );
                                })
                            )}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucune track disponible</p>
          )}
        </div>
        
        {/* SECTION REVIEWS */}
        <ReviewList albumId={data.id} />

      </div>
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}
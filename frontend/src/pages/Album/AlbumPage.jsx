import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AlbumPage.css";
import AlbumActions from "../../components/AlbumActions/AlbumActions.jsx";
import { addTrackToPlaylist, getMyPlaylist, getPlaylistById } from "../../api/api";
import ReviewList from "../../components/reviews/ReviewList/ReviewList.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AlbumPage() {

  const { artist, album } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [data, setData] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [openDropdownTrack, setOpenDropdownTrack] = useState(null);

  const refreshAlbum = async (idToFetch) => {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/v1/albums/${idToFetch}?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const json = await res.json();
      setData(json);

    } catch (err) {
      console.error("Erreur lors de la récupération de l'album:", err);
    }
  };

  useEffect(() => {
    const fetchAlbumInit = async () => {
      if (!artist || !album || album == "null") return;
      try {
        const resLastFm = await fetch(`/api/v1/detail/${artist}/${album}`);
        const jsonLastFm = await resLastFm.json();

        if (jsonLastFm && jsonLastFm.id) {
          await refreshAlbum(jsonLastFm.id);
        } else {
          setData(jsonLastFm);
        }
      } catch (err) {
        console.error("Erreur lors de l'initialisationd de l'album:", err);
      }
    };
    fetchAlbumInit();
  }, [artist, album]);

  useEffect(() => {
    if (!user) return;

    const fetchPlaylists = async () => {
      try {
        const data = await getMyPlaylist();
        setPlaylists(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlaylists();
  }, [user]);

  const handleAddToPlaylist = async (track, playlistId) => {
    if (!user) return;

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

      setToast(`${t('album.addedTo')} "${targetPlaylist.name}"`);
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error(err);
      setToast(t('album.addError'));
      setTimeout(() => setToast(null), 2000);
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

  if (!data || !data.tracks) return <div className="album-loading">{t('album.loading')}</div>;

  return (
      <div className="album-page-container" style={{backgroundImage: data.image ? `url(/api/v1/image-proxy?url=${encodeURIComponent(data.image)})` : "none",  }}>

        <div className="album-overlay" />
        <div className="album-card">

          <button
              className="back-button"
              onClick={() => navigate(-1)}
          >
            {t('album.back')}
          </button>

          <div className="album-header">
            <img
                src={
                  data.image
                      ? `/api/v1/image-proxy?url=${encodeURIComponent(data.image)}`
                      : "/fallback.svg"
                }
                alt={data.name}
                className="album-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/fallback.svg";
                }}
            />
            <div className="album-info">
              <h1>{data.name}</h1>
              <p className="artist">{data.artist}</p>

              <div className="album-meta">
                <span>⭐ {data.average_rating || t('album.noRating')}</span>
              </div>
            </div>
          </div>

          {user && <AlbumActions albumId={data.id} />}

          <div className="tracks-section">
            <h2>{t('album.tracks')}</h2>

            {data.tracks?.length > 0 ? (
                <div className="tracks-list">
                  {data.tracks ?.filter(track => track && track.name) .map((track) => (
                      <div key={`${track.name}-${track.position ?? "no-pos"}`} className="album-track-row">
                  <span className="album-track-index">
                    {track?.position ? track.position.toString().padStart(2, "0") : "--"}
                  </span>

                        <span className="album-track-name">
                    {track.name}
                  </span>

                        <span className="album-track-duration">
                    {track.duration
                        ? Math.floor(track.duration / 60) +
                        ":" +
                        String(track.duration % 60).padStart(2, "0")
                        : "--:--"}
                  </span>

                        <div className="album-track-actions">
                          {user ? (
                              <div className="track-dropdown-wrapper">
                                <button
                                    className="track-add"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownTrack(
                                          openDropdownTrack === track.name ? null : track.name);
                                    }}
                                >
                                  +
                                </button>

                                {openDropdownTrack === track.name && (
                                    <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                      {playlists.length === 0 ? (
                                          <div className="dropdown-item empty">
                                            {t('album.noPlaylist')}
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
                          ) : (
                              <div className="track-dropdown-wrapper" />
                          )}
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <p>{t('album.noTracks')}</p>
            )}
          </div>

          {data.id && (
              <>
                <ReviewList albumId={data.id} onReviewUpdated={() => refreshAlbum(data.id)}/>

                {!user && (
                    <p className="review-login-hint">{t('album.loginToInteract')}</p>
                )}
              </>
          )}

        </div>
      </div>
  );
}
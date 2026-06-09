import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AlbumPage.css";
import AlbumActions from "../../components/AlbumActions/AlbumActions.jsx";
import { addTrackToPlaylist, getMyPlaylist, getPlaylistById } from "../../api/api";
import ReviewList from "../../components/reviews/ReviewList/ReviewList.jsx";


export default function AlbumPage() {
  
  const { artist, album } = useParams();
  const navigate = useNavigate();

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
    try {
      await addTrackToPlaylist(playlistId, { track_id: track.name, artist: data.artist });
      alert("Ajouté à la playlist !");
      setOpenDropdownTrack(null);
    } catch (err) {
      console.error(err);
      alert("Erreur ou déjà ajouté");
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
                            playlists.map((playlist) => (
                              <div
                                key={playlist.id}
                                className="dropdown-item"
                                onClick={() =>
                                  handleAddToPlaylist(track, playlist.id)
                                }
                              >
                                {playlist.name}
                              </div>
                            ))
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
        <ReviewList albumId={data.id} onReviewUpdated={() => refreshAlbum(data.id)}/>

      </div>
    </div>
  );
}
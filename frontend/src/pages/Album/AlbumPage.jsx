import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AlbumPage.css";

export default function AlbumPage() {
  
  const { artist, album } = useParams();
  const navigate = useNavigate();


  const [data, setData] = useState(null);

  useEffect(() => {
    if (!artist || !album || album === "null") return;
    const fetchAlbum = async () => {
      const res = await fetch(`/api/v1/detail/${artist}/${album}`);
      const json = await res.json();


      console.log("ALBUM DATA!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!:", json, ""); 
      console.log("IMAGE:", json.image, "");


      setData(json);
    };

    fetchAlbum();
  }, [artist, album]);

  if (!data) return <div className="album-loading">Chargement...</div>;

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

        {/* TRACKS */}
        <div className="tracks-section">
          <h2>Tracks</h2>

          {data.tracks?.length > 0 ? (
            <div className="tracks-list">
              {data.tracks.map((track) => (
                <div key={track.position} className="track-row">
                  <span className="track-index">
                    {track.position.toString().padStart(2, "0")}
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
                </div>
              ))}
            </div>
          ) : (
            <p>Aucune track disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}
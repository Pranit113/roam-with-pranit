import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HighlightCircle({ trip, size = 72 }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
      onClick={() => navigate(`/trip/${trip.id}`)}
    >
      <div className="highlight-ring" style={{ width: size + 6, height: size + 6 }}>
        <div className="highlight-ring-inner" style={{ width: size + 2, height: size + 2 }}>
          <img
            src={imgError ? `https://picsum.photos/seed/${trip.id}/${size}/${size}` : trip.cover}
            alt={trip.name}
            onError={() => setImgError(true)}
            style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%', display: 'block' }}
          />
        </div>
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#374151',
        textAlign: 'center',
        maxWidth: size + 10,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {trip.emoji} {trip.name.split(' ')[0]}
      </div>
    </div>
  );
}

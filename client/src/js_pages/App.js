import React from 'react';
import { Link } from 'react-router-dom';

/* API BASE same helper used in OutfitAssemblerPage */
function getApiBase() {
  const env = process.env.REACT_APP_API_BASE;
  if (env) return env;
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5000`;
    }
    return '';
  }
  return 'http://localhost:5000';
}
const API_BASE = getApiBase();

/* AUTH HEADER */
function getAuthHeader() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ITEM_TYPES = ['top', 'bottom', 'shoes', 'accessories'];

/* MAIN APP COMPONENT WITH OUTFIT OF THE DAY */
function App() {
  const [items, setItems] = React.useState([]);
  const [ootd, setOotd] = React.useState(null);

  /* 1. Load items from backend */
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/items`, {
          headers: { ...getAuthHeader() },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch items');
        setItems(data);
      } catch (err) {
        console.error('Could not load wardrobe', err);
      }
    };
    load();
  }, []);

  /* 2. Outfit Generator (same logic as assembler) */
  const generateOneOutfit = React.useCallback(() => {
    if (items.length === 0) return null;

    const byType = ITEM_TYPES.reduce((acc, t) => {
      acc[t] = [];
      return acc;
    }, {});
    for (const it of items) {
      if (it.itemType && byType[it.itemType]) byType[it.itemType].push(it);
    }

    const vibeCounts = new Map();
    for (const it of items) {
      (it.vibes || []).forEach((v) =>
        vibeCounts.set(v, (vibeCounts.get(v) || 0) + 1)
      );
    }
    const allVibes = Array.from(vibeCounts.keys());

    const pickVibe = () => {
      if (allVibes.length === 0) return null;
      const weights = allVibes.map((v) => vibeCounts.get(v));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < allVibes.length; i++) {
        r -= weights[i];
        if (r <= 0) return allVibes[i];
      }
      return allVibes[0];
    };

    const vibe = pickVibe();
    const outfit = [];
    for (const type of ITEM_TYPES) {
      const pool = byType[type];
      if (!pool.length) continue;
      const preferred = pool.filter((p) => (p.vibes || []).includes(vibe));
      const source = preferred.length ? preferred : pool;
      const pick = source[Math.floor(Math.random() * source.length)];
      if (pick) outfit.push(pick);
    }

    const hasTop = outfit.some((i) => i.itemType === 'top');
    const hasBottom = outfit.some((i) => i.itemType === 'bottom');
    const hasShoes = outfit.some((i) => i.itemType === 'shoes');

    if (!hasTop || !hasBottom || !hasShoes) return null;

    return { vibe, items: outfit };
  }, [items]);

  /* 3. Generate Outfit of the Day */
  React.useEffect(() => {
    if (items.length > 0) {
      let o = null;
      let attempts = 0;
      while (!o && attempts < 40) {
        o = generateOneOutfit();
        attempts++;
      }
      setOotd(o);
    }
  }, [items, generateOneOutfit]);

  /* PAGE RETURN */
  return (
    <div
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      {/* Nav Bar */}
      <nav
        className="navbar navbar-expand-lg shadow-sm"
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
        }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Link to="/" className="button">Home</Link>
            <Link to="/create" className="button">Wardrobe</Link>
            <Link to="/assembler" className="button">Outfit Assembler</Link>
            <Link to="/season" className="button">Season Analysis</Link>
          </div>

          <div className="d-flex gap-2">
            <Link to="/login" className="button-outline">Log In</Link>
            <Link to="/signup" className="button-filled">Create Account</Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="container mt-4 text-center">

        <h1
          style={{
            fontSize: '2.6rem',
            fontWeight: '400',
            color: '#d45b82',
            marginBottom: '10px',
            letterSpacing: '0.5px',
            textShadow: '0 1px 6px rgba(255, 182, 193, 0.35)',
          }}
        >
          Welcome to TailorGator
        </h1>

        <p
          style={{
            color: '#c85b75',
            fontSize: '1.15rem',
            marginBottom: '28px',
            fontWeight: '300',
          }}
        >
          Outfit inspiration tailored just for you.
        </p>

        {/* OOTD Card */}
        {ootd && (
          <div className="d-flex justify-content-center mt-5">
            <div
              className="card shadow-sm"
              style={{
                maxWidth: '550px',
                borderRadius: '20px',
                border: '1px solid #f5b3c4',
                padding: '15px',
              }}
            >
              <div
                className="card-header text-center"
                style={{
                  backgroundColor: '#fde2e4',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                }}
              >
                <h4 style={{ color: '#d47b91', margin: 0 }}>Outfit of the Day</h4>
                {ootd.vibe && <span className="tag">{ootd.vibe}</span>}
              </div>

              <div className="card-body d-flex gap-3 align-items-start">

                <img
                  src="/tailor-gator.gif"
                  alt="pixel mascot"
                  style={{
                    width: '160px',
                    height: '160px',
                    imageRendering: 'pixelated',
                    objectFit: 'contain',
                    borderRadius: '12px',
                  }}
                />

                <div className="d-flex flex-wrap justify-content-center gap-2 flex-grow-1">
                  {ootd.items.map((it) => (
                    <div key={it.id} style={{ width: '48%' }}>
                      <img
                        src={`${API_BASE}${it.imageUrl}`}
                        alt=""
                        style={{ width: '100%', borderRadius: 8 }}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />

                      <div className="mt-2 d-flex flex-wrap justify-content-center gap-1">
                        {it.itemType && <span className="tag">{it.itemType}</span>}
                        {(it.vibes || []).map((v) => (
                          <span key={`${it.id}-${v}`} className="tag">{v}</span>
                        ))}
                        {/* ❌ removed color tag completely */}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Styles */}
      <style>{`
        .button {
          background-color: #fde2e4;
          border: none;
          color: #d47b91;
          padding: 0.5rem 1.1rem;
          border-radius: 25px;
          font-weight: 600;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 2px 5px rgba(255, 182, 193, 0.3);
        }
        .button:hover {
          background-color: #f9ccd3;
          color: #c85b75;
        }

        .button-outline {
          border: 2px solid #f5b3c4;
          color: #de7990;
          border-radius: 20px;
          padding: 0.3rem 0.8rem;
          font-weight: 500;
          background: transparent;
        }

        .button-filled {
          background-color: #f5b3c4;
          color: white;
          border-radius: 20px;
          padding: 0.3rem 0.8rem;
          font-weight: 500;
        }

        .tag {
          display: inline-block;
          background-color: #f5b3c4;
          color: white;
          border-radius: 15px;
          padding: 0.25rem 0.7rem;
          font-size: 0.85rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default App;

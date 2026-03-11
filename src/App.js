import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";

// --- КОНФІГУРАЦІЯ FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBE_T0bxUK3itKKKGP6ZXoYOX8nJCq10g8",
  authDomain: "event-tickets-5e625.firebaseapp.com",
  projectId: "event-tickets-5e625",
  storageBucket: "event-tickets-5e625.firebasestorage.app",
  messagingSenderId: "959565642887",
  appId: "1:959565642887:web:f2b0eee1e5242175024c22"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const API_URL = "https://event-backend-production-349d.up.railway.app";

// --- КОМПОНЕНТ: Картка події (Дизайн 4 ЛР) ---
const EventCard = ({ event, user, onRate, onBook }) => {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async (p) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/ratings?page=${p}`);
      const data = await res.json();
      if (p === 1) setReviews(data.ratings || []);
      else setReviews(prev => [...prev, ...(data.ratings || [])]);
      setHasMore(data.ratings?.length === 10);
    } catch (e) { console.error(e); }
  };

  const handleToggle = () => {
    if (!showReviews) {
      fetchReviews(1);
      setPage(1);
    }
    setShowReviews(!showReviews);
  };

  return (
    <div className="event-card fade-in">
      <img src={event.img || 'https://picsum.photos/400/250'} alt={event.title} />
      <div className="card-info">
        <span className="badge">{event.type}</span>
        <h3 style={{fontWeight: 900}}>{event.title}</h3>
        <p className="event-date">📅 {event.date || '2026-06-01'}</p>
        <p className="event-price">Ціна: <b>{event.price} грн</b></p>
        <p className="event-rating">Рейтинг: ⭐ <b>{event.averageRating || "0.0"}</b> <small>({event.ratingCount || 0} відгуків)</small></p>
        
        {user ? (
          <div className="rating-area">
            <select className="rate-select" onChange={(e) => onRate(event.id, Number(e.target.value), user.email)}>
              <option value="">Оцінити...</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          </div>
        ) : <p className="small-text">Увійдіть для оцінки</p>}

        <div className="booking-controls">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value)))} />
          <button className="buy-btn" onClick={() => onBook(event, qty)}>
            Забронювати ({event.price * qty} грн)
          </button>
        </div>

        <button className="toggle-reviews-btn" onClick={handleToggle}>
          {showReviews ? 'Сховати відгуки' : 'Показати всі відгуки'}
        </button>

        {showReviews && (
          <div className="reviews-list">
            {reviews.map((r, i) => (
              <div key={i} className="review-item"><b>⭐ {r.score}</b> — <small>{r.user}</small></div>
            ))}
            {hasMore && <button className="load-more" onClick={() => {fetchReviews(page+1); setPage(page+1)}}>Ще...</button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('Всі');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
    } catch (e) { console.error("API error"); }
  };

  const handleRate = async (id, score, mail) => {
    await fetch(`${API_URL}/api/events/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newRating: score, userEmail: mail }),
    });
    fetchEvents();
  };

  const handleBooking = (event, qty) => {
    const newItem = { bId: Date.now(), title: event.title, price: event.price, qty: qty, total: event.price * qty };
    setBookings(prev => [...prev, newItem]);
    alert(`Додано: ${event.title}`);
  };

  return (
    <Router>
      <style>{`
        :root { --mint: #D1E8E2; --blush: #F7D1CD; --text: #4a4a4a; }
        body { font-family: 'Segoe UI', sans-serif; margin: 0; background-color: #fcfcfc; color: var(--text); }
        header { background-color: var(--mint); padding: 15px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.6rem; font-weight: 900; color: #557a71; text-decoration: none; letter-spacing: -1.5px; }
        .logo span { color: white; }
        .nav-links { list-style: none; display: flex; gap: 20px; margin: 0; }
        .nav-item { text-decoration: none; color: #557a71; font-weight: 700; font-size: 0.9rem; }
        .filters { display: flex; gap: 10px; justify-content: center; margin: 30px 0; }
        .filter-btn { border: 1px solid var(--mint); background: white; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-weight: 600; }
        .filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .event-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .event-card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid #eee; }
        .card-info { padding: 20px; }
        .badge { padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; background: #e2f2ef; color: #557a71; }
        .booking-controls { display: flex; gap: 5px; margin-top: 15px; }
        .booking-controls input { width: 45px; border: 1px solid #ddd; border-radius: 10px; text-align: center; }
        .buy-btn { flex: 1; background: var(--blush); color: #8a5e5b; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-weight: 900; }
        .toggle-reviews-btn { width: 100%; background: none; border: 1px solid #eee; margin-top: 10px; padding: 5px; border-radius: 15px; font-size: 11px; color: #999; }
        .reviews-list { margin-top: 10px; background: #fdfdfd; padding: 10px; border-radius: 10px; font-size: 11px; }
        .cart-page { background: white; padding: 40px; border-radius: 30px; border: 1px solid #eee; margin-top: 40px; }
        .cart-item { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; font-weight: 600; }
        .fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <header>
        <div className="container header-flex">
          <Link to="/" className="logo">🎟️ Event<span>Tickets</span></Link>
          <nav><ul className="nav-links">
            <li><Link to="/" className="nav-item">Події</Link></li>
            <li><Link to="/cart" className="nav-item">Кошик ({bookings.length})</Link></li>
            <li><Link to="/auth" className="nav-item">{user ? 'Мій профіль' : 'Увійти'}</Link></li>
          </ul></nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<>
            <div className="filters">
              {['Всі', 'Концерт', 'Театр', 'IT'].map(c => (
                <button key={c} onClick={() => setFilter(c)} className={filter === c ? 'filter-btn active' : 'filter-btn'}>{c}</button>
              ))}
            </div>
            <div className="event-grid">
              {events.filter(e => filter === 'Всі' || e.type === filter).map(e => (
                <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={handleBooking} />
              ))}
            </div>
          </>} />

          <Route path="/cart" element={<div className="cart-page fade-in">
            <h2 style={{fontWeight: 900}}>🛍️ Ваші бронювання</h2>
            {bookings.length === 0 ? <p>Кошик порожній...</p> : (
              <>
                {bookings.map(b => (
                  <div key={b.bId} className="cart-item">
                    <span>✅ {b.title} (x{b.qty})</span>
                    <span>{b.total} грн</span>
                  </div>
                ))}
                <h3 style={{textAlign:'right', marginTop: '20px', fontWeight: 900}}>Разом: {bookings.reduce((s, i) => s + i.total, 0)} грн</h3>
              </>
            )}
          </div>} />

          <Route path="/auth" element={<div className="cart-page fade-in" style={{textAlign:'center'}}>
            {user ? <><h3>{user.email}</h3><button className="buy-btn" onClick={() => signOut(auth)}>Вийти</button></> : (
              <div style={{display:'flex', flexDirection:'column', gap:'10px', maxWidth:'300px', margin:'0 auto'}}>
                <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={{padding:'10px', borderRadius:'10px', border:'1px solid #eee'}} />
                <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} style={{padding:'10px', borderRadius:'10px', border:'1px solid #eee'}} />
                <button className="buy-btn" onClick={() => signInWithEmailAndPassword(auth, email, password)}>Увійти</button>
                <button onClick={() => createUserWithEmailAndPassword(auth, email, password)} style={{background:'none', border:'none', color:'#aaa', cursor:'pointer'}}>Реєстрація</button>
              </div>
            )}
          </div>} />
        </Routes>
      </main>
    </Router>
  );
}
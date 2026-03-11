import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
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

// --- КОМПОНЕНТ: Картка події ---
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

  return (
    <div className="event-card fade-in">
      <img src={event.img || 'https://picsum.photos/400/250'} alt={event.title} />
      <div className="card-info">
        <span className="badge">{event.type}</span>
        <h3>{event.title}</h3>
        <p className="event-date">📅 {event.date || '2026-06-01'}</p>
        <p className="event-price">Ціна: <b>{event.price} грн</b></p>
        <p className="event-rating">Рейтинг: ⭐ <b>{event.averageRating || "0.0"}</b> <small>({event.ratingCount || 0} загалом)</small></p>
        
        {user ? (
          <div className="rating-area">
            <select className="rate-select" onChange={(e) => onRate(event.id, Number(e.target.value), user.email)}>
              <option value="">Поставити оцінку...</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          </div>
        ) : <p className="small-text">Увійдіть, щоб оцінити подію</p>}

        <div className="booking-controls">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          <button className="buy-btn" onClick={() => onBook(event, qty)}>Забронювати</button>
        </div>

        <button className="toggle-reviews-btn" onClick={() => { if(!showReviews) fetchReviews(1); setShowReviews(!showReviews); }}>
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
    onAuthStateChanged(auth, (u) => setUser(u));
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
    } catch (e) { console.error("API Error"); }
  };

  const handleRate = async (eventId, score, userEmail) => {
    await fetch(`${API_URL}/api/events/${eventId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newRating: score, userEmail: userEmail }),
    });
    fetchEvents();
  };

  const handleBooking = (event, qty) => {
    setBookings([...bookings, { bId: Date.now(), title: event.title, quantity: qty, total: event.price * qty }]);
    alert(`Додано: ${event.title}`);
  };

  const filteredEvents = events.filter(e => filter === 'Всі' || e.type === filter);

  return (
    <Router>
      <style>{`
        :root { --mint: #D1E8E2; --blush: #F7D1CD; --text: #4a4a4a; }
        body { font-family: 'Segoe UI', sans-serif; margin: 0; background-color: #fcfcfc; }
        .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        header { background-color: var(--mint); padding: 15px 0; position: sticky; top: 0; z-index: 100; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.6rem; font-weight: 900; color: #557a71; text-decoration: none; }
        .logo span { color: white; }
        .nav-links { list-style: none; display: flex; gap: 15px; }
        .nav-item { text-decoration: none; color: #557a71; font-weight: 600; font-size: 0.9rem; }
        .filters { display: flex; gap: 10px; justify-content: center; margin: 30px 0; }
        .filter-btn { border: 1px solid var(--mint); background: white; padding: 8px 20px; border-radius: 20px; cursor: pointer; }
        .filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .event-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .event-card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid #eee; transition: 0.3s; }
        .card-info { padding: 20px; }
        .badge { padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; background: #e2f2ef; color: #557a71; }
        h3 { margin: 10px 0; font-weight: 900; font-size: 1.2rem; }
        .event-date, .event-price, .event-rating { font-size: 0.85rem; margin-bottom: 5px; }
        .rating-area { border-top: 1px solid #f0f0f0; padding-top: 10px; margin-bottom: 10px; }
        .rate-select { width: 100%; padding: 5px; border-radius: 5px; }
        .booking-controls { display: flex; gap: 5px; }
        .booking-controls input { width: 40px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .buy-btn { flex: 1; background: var(--blush); color: #8a5e5b; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-weight: bold; }
        .toggle-reviews-btn { width: 100%; background: none; border: 1px solid #eee; margin-top: 10px; padding: 5px; border-radius: 15px; font-size: 11px; color: #999; }
        .auth-section { max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 20px; border: 1px solid #eee; text-align: center; }
        .auth-form input { width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 10px; border: 1px solid #eee; box-sizing: border-box; }
        .footer { background: var(--mint); margin-top: 50px; padding: 30px 0; text-align: center; color: #557a71; font-size: 0.8rem; }
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
              {filteredEvents.map(e => <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={handleBooking} />)}
            </div>
          </>} />
          <Route path="/cart" element={<div className="auth-section">
            <h2>Ваш кошик</h2>
            {bookings.map(b => <div key={b.bId} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}>
              <span>{b.title} (x{b.quantity})</span><b>{b.total} грн</b>
            </div>)}
          </div>} />
          <Route path="/auth" element={<div className="auth-section">
            {user ? <><h3>{user.email}</h3><button className="buy-btn" onClick={() => signOut(auth)}>Вийти</button></> : 
            <div className="auth-form">
              <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
              <input type="password" placeholder="Паро password" onChange={e => setPassword(e.target.value)} />
              <button className="buy-btn" onClick={() => signInWithEmailAndPassword(auth, email, password)}>Увійти</button>
            </div>}
          </div>} />
        </Routes>
      </main>

      <footer className="footer"><p>м. Львів, вул. Бандери, 12 | info@eventtickets.ua</p></footer>
    </Router>
  );
}
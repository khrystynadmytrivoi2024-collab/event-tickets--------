import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";

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

const EventCard = ({ event, user, onRate, onBook }) => {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/ratings?page=1`);
      const data = await res.json();
      setReviews(data.ratings || []);
      setShowReviews(!showReviews);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="event-card fade-in">
      <img src={event.img || 'https://picsum.photos/400/250'} alt="" />
      <div className="card-info">
        <span className="badge">{event.type}</span>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-date">📅 {event.date || '2026-06-01'}</p>
        <p className="event-price">Ціна: <b>{event.price} грн</b></p>
        <p className="event-rating">Рейтинг: ⭐ <b>{event.averageRating || "0.0"}</b> <small>({event.ratingCount || 0} відгуків)</small></p>
        
        {user ? (
          <div className="rating-area">
            <select className="rate-select" onChange={(e) => onRate(event.id, Number(e.target.value), user.email)}>
              <option value="">Оцінити...</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          </div>
        ) : <p className="small-text text-center italic mt-2">Увійдіть для оцінки</p>}

        <div className="booking-controls">
          <input className="qty-input" type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          <button className="buy-btn" onClick={() => onBook(event, qty)}>Забронювати</button>
        </div>

        <button className="toggle-reviews-btn" onClick={fetchReviews}>
          {showReviews ? 'Сховати відгуки' : 'Показати відгуки'}
        </button>

        {showReviews && (
          <div className="reviews-list">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div key={i} className="review-item"><b>⭐ {r.score}</b> — <small>{r.user}</small></div>
            )) : <p className="small-text text-center">Відгуків ще немає</p>}
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

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
    } catch (e) { console.error(e); }
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
    const newBooking = {
      id: Date.now(),
      title: event.title,
      price: event.price,
      qty: qty,
      total: event.price * qty
    };
    setBookings(prev => [...prev, newBooking]);
    alert(`Додано: ${event.title} (${qty} шт.)`);
  };

  const filteredEvents = events.filter(e => filter === 'Всі' || e.type === filter);

  return (
    <Router>
      <style>{`
        :root { --mint: #D1E8E2; --blush: #F7D1CD; --text: #4a4a4a; }
        body { font-family: 'Segoe UI', 'Inter', sans-serif; margin: 0; background-color: #fcfcfc; color: var(--text); }
        header { background-color: var(--mint); padding: 15px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.8rem; font-weight: 900; color: #557a71; text-decoration: none; letter-spacing: -1.5px; }
        .logo span { color: white; }
        .nav-links { list-style: none; display: flex; gap: 25px; margin: 0; padding: 0; }
        .nav-item { text-decoration: none; color: #557a71; font-weight: 700; font-size: 0.95rem; }
        .filters { display: flex; gap: 10px; justify-content: center; margin: 35px 0; }
        .filter-btn { border: 1px solid var(--mint); background: white; padding: 10px 25px; border-radius: 25px; cursor: pointer; font-weight: 700; color: #999; }
        .filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
        .event-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .event-card { background: white; border-radius: 25px; overflow: hidden; border: 1px solid #f0f0f0; transition: 0.3s; }
        .event-card:hover { transform: translateY(-8px); box-shadow: 0 12px 20px rgba(0,0,0,0.05); }
        .event-card img { width: 100%; height: 180px; object-fit: cover; }
        .card-info { padding: 25px; }
        .event-title { font-weight: 900; font-size: 1.3rem; margin: 12px 0; color: #222; }
        .badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 900; background: #e2f2ef; color: #557a71; text-transform: uppercase; }
        .booking-controls { display: flex; gap: 8px; margin-top: 20px; }
        .qty-input { width: 50px; border: 1px solid #eee; border-radius: 12px; text-align: center; font-weight: bold; background: #fafafa; }
        .buy-btn { flex: 1; background: var(--blush); color: #8a5e5b; border: none; padding: 12px; border-radius: 15px; cursor: pointer; font-weight: 900; font-size: 1rem; transition: 0.2s; }
        .buy-btn:hover { background: #f2c0ba; transform: scale(1.02); }
        .toggle-reviews-btn { width: 100%; background: #f9f9f9; border: 1px solid #eee; margin-top: 15px; padding: 8px; border-radius: 20px; font-size: 11px; color: #aaa; font-weight: 700; cursor: pointer; }
        .cart-page { background: white; padding: 50px; border-radius: 40px; border: 1px solid #eee; margin-top: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.02); }
        .cart-item { display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 1px solid #f5f5f5; font-weight: 700; align-items: center; }
        .total { text-align: right; font-size: 1.6rem; font-weight: 900; color: #557a71; margin-top: 30px; border-top: 2px dashed var(--mint); padding-top: 20px; }
        .footer { background: var(--mint); margin-top: 80px; padding: 50px 0; text-align: center; color: #557a71; font-weight: 700; }
        .reviews-list { margin-top: 15px; background: #fdfdfd; padding: 10px; border-radius: 15px; }
        .review-item { font-size: 12px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        .fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
          <Route path="/" element={<div className="fade-in">
            <div className="filters">
              {['Всі', 'Концерт', 'Театр', 'IT'].map(c => (
                <button key={c} onClick={() => setFilter(c)} className={filter === c ? 'filter-btn active' : 'filter-btn'}>{c}</button>
              ))}
            </div>
            <div className="event-grid">
              {filteredEvents.map(e => <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={handleBooking} />)}
            </div>
          </div>} />

          <Route path="/cart" element={<div className="cart-page fade-in">
            <h2 style={{fontWeight: 900, fontSize: '2rem', marginBottom: '30px'}}>🛍️ Ваші бронювання</h2>
            {bookings.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px'}}>
                <p style={{color: '#ccc', fontSize: '1.2rem'}}>Кошик поки що порожній...</p>
                <Link to="/" style={{color: '#557a71', fontWeight: 900}}>Перейти до подій →</Link>
              </div>
            ) : (
              <>
                {bookings.map(b => (
                  <div key={b.id} className="cart-item">
                    <span>✅ {b.title} <small style={{color: '#aaa', fontWeight: 400}}>(x{b.qty})</small></span>
                    <span style={{color: '#557a71'}}>{b.total} грн</span>
                  </div>
                ))}
                <div className="total">Загальна сума: {bookings.reduce((sum, i) => sum + i.total, 0)} грн</div>
              </>
            )}
          </div>} />

          <Route path="/auth" element={<div className="cart-page fade-in" style={{textAlign: 'center', maxWidth: '500px', margin: '40px auto'}}>
            {user ? (
              <div>
                <div style={{fontSize: '4rem', marginBottom: '10px'}}>👤</div>
                <h3 style={{fontWeight: 900, marginBottom: '20px'}}>{user.email}</h3>
                <button className="buy-btn" style={{width: '100%'}} onClick={() => signOut(auth)}>Вийти з системи</button>
              </div>
            ) : (
              <div>
                <h2 style={{fontWeight: 900}}>Вхід до профілю</h2>
                <p style={{color: '#aaa', marginBottom: '20px'}}>Будь ласка, авторизуйтесь у VS Code</p>
                <Link to="/" className="buy-btn" style={{display: 'block', textDecoration: 'none'}}>На головну</Link>
              </div>
            )}
          </div>} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          <p>📍 м. Львів, вул. С. Бандери, 12</p>
          <p>📧 info@eventtickets.ua | 📞 +38 (032) 222-33-44</p>
        </div>
      </footer>
    </Router>
  );
}
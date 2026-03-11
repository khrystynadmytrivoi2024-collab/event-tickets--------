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

// --- КОНФІГУРАЦІЯ FIREBASE (з ЛР 4) ---
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

// Адреса твого сервера на Railway (з ЛР 5)
const API_URL = "https://event-backend-production-349d.up.railway.app";

// --- КОМПОНЕНТ: Картка події ---
const EventCard = ({ event, user, onRate, onBook }) => {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Варіант 8: Пагінація на клієнті (отримання по 10 відгуків)
  const fetchReviews = async (p) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/ratings?page=${p}`);
      const data = await res.json();
      if (p === 1) setReviews(data.ratings || []);
      else setReviews(prev => [...prev, ...(data.ratings || [])]);
      setHasMore(data.ratings?.length === 10);
    } catch (e) { console.error("Error fetching reviews"); }
  };

  const handleToggle = () => {
    if (!showReviews) { fetchReviews(1); setPage(1); }
    setShowReviews(!showReviews);
  };

  return (
    <div className="event-card fade-in">
      <div className="img-container">
        {/* Картинки суворо з Firestore поля 'img' */}
        {event.img ? <img src={event.img} alt={event.title} /> : <div className="no-image">Немає фото у Firebase</div>}
      </div>
      
      <div className="card-info">
        <span className="badge">{event.type}</span>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-date">📅 {event.date || '2026-06-01'}</p>
        <p className="event-price">Ціна: <b>{event.price} грн</b></p>
        <p className="event-rating">Рейтинг: ⭐ <b>{event.averageRating || "0.0"}</b> <small>({event.ratingCount || 0} відгуків)</small></p>
        
        {user ? (
          <div className="rating-area">
            <select className="rate-select" onChange={(e) => { onRate(event.id, Number(e.target.value), user.email); e.target.value = ""; }}>
              <option value="">Поставити оцінку...</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          </div>
        ) : <p className="small-text italic">Увійдіть для оцінювання</p>}

        <div className="booking-controls">
          <input className="qty-input" type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          <button className="buy-btn" onClick={() => onBook(event, qty)}>ЗАБРОНЮВАТИ</button>
        </div>

        <button className="toggle-reviews-btn" onClick={handleToggle}>
          {showReviews ? 'СХОВАТИ ВІДГУКИ ↑' : 'ПОКАЗАТИ ВІДГУКИ ↓'}
        </button>

        {showReviews && (
          <div className="reviews-list">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div key={i} className="review-item"><b>⭐ {r.score}</b> — <small>{r.user}</small></div>
            )) : <p className="small-text">Відгуків ще немає</p>}
            {hasMore && <button className="load-more-btn" onClick={() => { fetchReviews(page + 1); setPage(page + 1); }}>Завантажити ще...</button>}
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

  // Отримання даних з сервера Railway (які підтягуються з Firebase)
  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data || []);
    } catch (e) { console.error("Railway Server Offline"); }
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
    setBookings(prev => [...prev, { bId: Date.now(), title: event.title, price: event.price, qty: qty, total: event.price * qty }]);
    alert(`Додано в кошик: ${event.title}`);
  };

  return (
    <Router>
      <style>{`
        :root { --mint: #D1E8E2; --blush: #F7D1CD; --text: #4a4a4a; }
        body { font-family: 'Segoe UI', 'Inter', sans-serif; margin: 0; background-color: #fcfcfc; }
        header { background-color: var(--mint); padding: 15px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 25px; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.8rem; font-weight: 900; color: #557a71; text-decoration: none; letter-spacing: -1.5px; }
        .logo span { color: white; }
        .nav-links { list-style: none; display: flex; gap: 25px; margin: 0; padding: 0; }
        .nav-item { text-decoration: none; color: #557a71; font-weight: 800; font-size: 0.9rem; }
        .filters { display: flex; gap: 12px; justify-content: center; margin: 40px 0; }
        .filter-btn { border: 1px solid var(--mint); background: white; padding: 10px 25px; border-radius: 25px; cursor: pointer; font-weight: 700; color: #aaa; }
        .filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3); }
        .event-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }
        .event-card { background: white; border-radius: 25px; overflow: hidden; border: 1px solid #f0f0f0; transition: 0.3s; }
        .img-container { width: 100%; height: 180px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .img-container img { width: 100%; height: 100%; object-fit: cover; }
        .card-info { padding: 25px; }
        .event-title { margin: 15px 0 10px; font-weight: 900; font-size: 1.3rem; color: #222; }
        .badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 900; background: #e2f2ef; color: #557a71; }
        .qty-input { width: 50px; border: 1px solid #eee; border-radius: 12px; text-align: center; font-weight: 900; }
        .buy-btn { flex: 1; background: var(--blush); color: #8a5e5b; border: none; padding: 12px; border-radius: 15px; cursor: pointer; font-weight: 900; transition: 0.2s; }
        .buy-btn:hover { background: #f2c0ba; }
        .cart-page { background: white; padding: 50px; border-radius: 40px; border: 1px solid #eee; margin-top: 40px; min-height: 400px; }
        .cart-item { display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 1px solid #f5f5f5; font-weight: 800; }
        .total-box { margin-top: 40px; text-align: right; font-weight: 900; font-size: 1.8rem; color: #557a71; border-top: 2px dashed var(--mint); padding-top: 20px; }
        footer { background-color: var(--mint); padding: 50px 0; margin-top: 80px; color: #557a71; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .fade-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="app-wrapper">
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
                {events.filter(e => filter === 'Всі' || e.type === filter).map(e => (
                  <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={handleBooking} />
                ))}
              </div>
            </div>} />

            <Route path="/cart" element={<div className="cart-page fade-in">
              <h2 style={{fontWeight: 900, fontSize: '2.5rem', marginBottom: '30px'}}>🛍️ ВАШІ КВИТКИ</h2>
              {bookings.length === 0 ? <p style={{color:'#ccc'}}>Кошик порожній...</p> : (
                <>
                  {bookings.map(b => (
                    <div key={b.bId} className="cart-item">
                      <span>✅ {b.title} (x{b.qty})</span>
                      <span style={{color: '#557a71'}}>{b.total} грн</span>
                    </div>
                  ))}
                  <div className="total-box">РАЗОМ: {bookings.reduce((s, i) => s + i.total, 0)} грн</div>
                </>
              )}
            </div>} />

            <Route path="/auth" element={<div className="cart-page fade-in" style={{ textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
              {user ? (
                <div>
                  <div style={{fontSize:'5rem', marginBottom:'10px'}}>👤</div>
                  <h3 style={{fontWeight: 900}}>{user.email}</h3>
                  <button className="buy-btn" style={{width:'100%'}} onClick={() => signOut(auth)}>ВИЙТИ З СИСТЕМИ</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h2 style={{fontWeight: 900}}>ВХІД</h2>
                  <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={{ padding: '15px', borderRadius: '15px', border: '1px solid #eee' }} />
                  <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} style={{ padding: '15px', borderRadius: '15px', border: '1px solid #eee' }} />
                  <button className="buy-btn" onClick={() => signInWithEmailAndPassword(auth, email, password)}>УВІЙТИ</button>
                  <button onClick={() => createUserWithEmailAndPassword(auth, email, password)} style={{background:'none', border:'none', color:'#aaa', cursor:'pointer', fontWeight: 800}}>СТВОРИТИ АККАУНТ</button>
                </div>
              )}
            </div>} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container footer-grid">
            <div>
              <h4 style={{fontWeight: 900}}>📍 НАША АДРЕСА</h4>
              <p>м. Львів, вул. С. Бандери, 12</p>
            </div>
            <div>
              <h4 style={{fontWeight: 900}}>📞 КОНТАКТИ</h4>
              <p>info@eventtickets.ua</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
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

// Твоя адреса бекенду на Railway
const API_URL = "https://event-backend-production-349d.up.railway.app";

// --- КОМПОНЕНТ: Картка події (Дизайн з ЛР 4) ---
const EventCard = ({ event, user, onRate, onBook }) => {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Вимога Варіанта 8: Пагінація відгуків
  const fetchReviews = async (p) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/ratings?page=${p}`);
      const data = await res.json();
      if (p === 1) setReviews(data.ratings || []);
      else setReviews(prev => [...prev, ...(data.ratings || [])]);
      
      // Якщо прийшло 10 відгуків — значить може бути ще сторінка
      setHasMore(data.ratings?.length === 10);
    } catch (e) { console.error("Помилка завантаження відгуків:", e); }
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
      {/* Відображення фото з бази даних Firebase */}
      <img src={event.img || event.image || 'https://picsum.photos/400/250'} alt={event.title} />
      <div className="card-info">
        <span className="badge">{event.type}</span>
        <h3 style={{ fontWeight: 900 }}>{event.title}</h3>
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
        ) : <p className="small-text">Увійдіть для оцінки</p>}

        <div className="booking-controls">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          <button className="buy-btn" onClick={() => onBook(event, qty)}>
            Забронювати
          </button>
        </div>

        <button className="toggle-reviews-btn" onClick={handleToggle}>
          {showReviews ? 'Сховати відгуки ↑' : 'Показати всі відгуки ↓'}
        </button>

        {showReviews && (
          <div className="reviews-list">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div key={i} className="review-item">
                <b>⭐ {r.score}</b> — <small>{r.user}</small>
              </div>
            )) : <p className="small-text" style={{textAlign:'center'}}>Відгуків ще немає</p>}
            {hasMore && (
              <button className="load-more-btn" onClick={() => { fetchReviews(page + 1); setPage(page + 1); }}>
                Завантажити ще...
              </button>
            )}
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
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    fetchEvents();
    return () => unsub();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
    } catch (e) { console.error("Помилка отримання подій"); }
  };

  const handleRate = async (id, score, mail) => {
    try {
      await fetch(`${API_URL}/api/events/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRating: score, userEmail: mail }),
      });
      fetchEvents(); // Оновлюємо дані, щоб побачити нову середню оцінку
    } catch (e) { console.error(e); }
  };

  const handleBooking = (event, qty) => {
    const newItem = { bId: Date.now(), title: event.title, price: event.price, qty: qty, total: event.price * qty };
    setBookings(prev => [...prev, newItem]);
    alert(`Додано до кошика: ${event.title}`);
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
        .filter-btn { border: 1px solid var(--mint); background: white; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-weight: 600; color: #999; }
        .filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; box-shadow: 0 4px 10px rgba(59,130,246,0.2); }
        
        .event-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .event-card { background: white; border-radius: 25px; overflow: hidden; border: 1px solid #eee; transition: 0.3s; }
        .event-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .event-card img { width: 100%; height: 160px; object-fit: cover; }
        .card-info { padding: 20px; }
        .badge { padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; background: #e2f2ef; color: #557a71; }
        
        .rating-area { border-top: 1px solid #f9f9f9; padding-top: 10px; margin-top: 10px; }
        .rate-select { width: 100%; padding: 5px; border-radius: 8px; border: 1px solid #eee; outline: none; }
        
        .booking-controls { display: flex; gap: 5px; margin-top: 15px; }
        .booking-controls input { width: 45px; border: 1px solid #ddd; border-radius: 10px; text-align: center; font-weight: bold; }
        .buy-btn { flex: 1; background: var(--blush); color: #8a5e5b; border: none; padding: 10px; border-radius: 12px; cursor: pointer; font-weight: 900; transition: 0.2s; }
        .buy-btn:hover { background: #f2c0ba; }
        
        .toggle-reviews-btn { width: 100%; background: none; border: 1px solid #eee; margin-top: 10px; padding: 6px; border-radius: 15px; font-size: 11px; color: #bbb; cursor: pointer; font-weight: bold; }
        .reviews-list { margin-top: 10px; background: #fafafa; padding: 10px; border-radius: 15px; font-size: 11px; }
        .review-item { padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
        .load-more-btn { border: none; background: none; color: #3b82f6; font-weight: bold; cursor: pointer; width: 100%; padding: 5px; font-size: 10px; }

        .cart-page { background: white; padding: 40px; border-radius: 30px; border: 1px solid #eee; margin-top: 40px; min-height: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .cart-item { display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 1px solid #f5f5f5; font-weight: 700; align-items: center; }
        .total-box { margin-top: 30px; text-align: right; font-weight: 900; font-size: 1.5rem; color: #557a71; border-top: 2px dashed var(--mint); padding-top: 20px; }

        .footer { background-color: var(--mint); padding: 50px 0; margin-top: 80px; color: #557a71; }
        .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .footer-col h4 { margin-top: 0; font-weight: 900; font-size: 1.1rem; }
        .footer-col p { font-size: 0.9rem; margin: 5px 0; opacity: 0.8; }

        .fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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

            <Route path="/cart" element={
              <div className="cart-page fade-in">
                <h2 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '30px' }}>🛍️ Ваші бронювання</h2>
                {bookings.length === 0 ? (
                  <div style={{textAlign:'center', padding:'50px'}}>
                    <p style={{color:'#ccc', fontSize:'1.2rem'}}>Кошик порожній...</p>
                    <Link to="/" style={{color: '#557a71', fontWeight: 900}}>Повернутися до вибору →</Link>
                  </div>
                ) : (
                  <>
                    {bookings.map(b => (
                      <div key={b.bId} className="cart-item">
                        <div>
                          <p style={{margin:0, fontSize:'1.1rem'}}>{b.title}</p>
                          <small style={{color:'#aaa', fontWeight:400}}>Кількість: {b.qty} шт.</small>
                        </div>
                        <span style={{color: '#557a71'}}>{b.total} грн</span>
                      </div>
                    ))}
                    <div className="total-box">Разом до сплати: {bookings.reduce((s, i) => s + i.total, 0)} грн</div>
                  </>
                )}
              </div>
            } />

            <Route path="/auth" element={<div className="cart-page fade-in" style={{ textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
              {user ? (
                <div>
                  <div style={{fontSize:'4rem', marginBottom:'20px'}}>👤</div>
                  <h3 style={{fontWeight: 900}}>{user.email}</h3>
                  <p style={{color:'#aaa', marginBottom:'30px'}}>Ви успішно авторизовані</p>
                  <button className="buy-btn" style={{width:'100%'}} onClick={() => signOut(auth)}>Вийти з системи</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h2 style={{fontWeight: 900}}>Вхід до кабінету</h2>
                  <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #eee', outline: 'none' }} />
                  <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #eee', outline: 'none' }} />
                  <button className="buy-btn" onClick={() => signInWithEmailAndPassword(auth, email, password).catch(e => alert("Помилка входу: " + e.message))}>УВІЙТИ</button>
                  <button onClick={() => createUserWithEmailAndPassword(auth, email, password).catch(e => alert("Помилка реєстрації: " + e.message))} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontWeight: 600 }}>Створити новий акаунт</button>
                </div>
              )}
            </div>} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container footer-grid">
            <div className="footer-col">
              <h4>📍 Наша адреса</h4>
              <p>м. Львів, вул. С. Бандери, 12</p>
              <p>Корпус №5, ауд. 101</p>
            </div>
            <div className="footer-col">
              <h4>📞 Контакти</h4>
              <p>Тел: +38 (032) 222-33-44</p>
              <p>Email: info@eventtickets.ua</p>
              <p>Пн-Пт: 09:00 - 18:00</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
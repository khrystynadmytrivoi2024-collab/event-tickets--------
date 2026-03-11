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

// 1. КОНФІГУРАЦІЯ FIREBASE
// Христино, встав сюди свої дані з Firebase Console (Project Settings -> General)
const firebaseConfig = {
  apiKey: "AIzaSyBE_T0bxUK3itKKKGP6ZXoYOX8nJCq10g8",
  authDomain: "event-tickets-5e625.firebaseapp.com",
  projectId: "event-tickets-5e625",
  storageBucket: "event-tickets-5e625.firebasestorage.app",
  messagingSenderId: "959565642887",
  appId: "1:959565642887:web:f2b0eee1e5242175024c22",
  measurementId: "G-107MZXYPGH"
};


// Ініціалізація Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// 2. ПОСИЛАННЯ НА  БЕКЕНД (Від Railway)
const API_URL = "https://event-backend-production-349d.up.railway.app";

// --- КОМПОНЕНТ: Картка події ---
const EventCard = ({ event, user, onRate, onBook }) => {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async (pageNum) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/ratings?page=${pageNum}`);
      if (!res.ok) throw new Error("Помилка завантаження");
      const data = await res.json();
      
      if (pageNum === 1) {
        setReviews(data.ratings || []);
      } else {
        setReviews(prev => [...prev, ...(data.ratings || [])]);
      }
      setHasMore(data.ratings?.length === 10);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleReviews = () => {
    if (!showReviews) {
      fetchReviews(1);
      setPage(1);
    }
    setShowReviews(!showReviews);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 border border-gray-100">
      <img 
        className="w-full h-48 object-cover" 
        src={event.img || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80'} 
        alt={event.title} 
      />
      <div className="p-6">
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
          {event.type}
        </span>
        <h3 className="text-xl font-bold mt-3 text-gray-900 leading-tight">{event.title}</h3>
        <p className="text-gray-500 text-sm mt-1">📅 {event.date || 'Незабаром'}</p>
        <p className="text-lg font-bold mt-2 text-gray-800">Ціна: {event.price} грн</p>
        
        <div className="flex items-center mt-2 mb-4 bg-amber-50 px-2 py-1 rounded-lg w-fit">
          <span className="text-amber-500 font-bold">⭐ {event.averageRating || "0.0"}</span>
          <span className="text-gray-400 text-xs ml-2">({event.ratingCount || 0} відгуків)</span>
        </div>
        
        {user ? (
          <div className="mt-4">
            <select 
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => {
                onRate(event.id, Number(e.target.value), user.email);
                if (showReviews) fetchReviews(1);
              }}
            >
              <option value="">Поставити оцінку...</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          </div>
        ) : (
          <p className="text-gray-400 text-xs mt-4">Увійдіть, щоб оцінити подію</p>
        )}

        <div className="flex gap-2 mt-4">
          <input 
            type="number" 
            min="1" 
            className="w-16 border border-gray-300 rounded-lg p-2 text-center focus:ring-2 focus:ring-blue-500 outline-none"
            value={qty} 
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} 
          />
          <button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            onClick={() => onBook(event, qty)}
          >
            Бронювати
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <button 
            className="w-full py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200"
            onClick={handleToggleReviews}
          >
            {showReviews ? 'Сховати відгуки' : 'Показати всі відгуки'}
          </button>
          
          {showReviews && (
            <div className="mt-4 space-y-3">
              {reviews.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">Ще немає відгуків.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {reviews.map((r, index) => (
                    <li key={index} className="py-2 flex justify-between items-center">
                      <span className="font-bold text-gray-700 text-sm">⭐ {r.score}</span>
                      <span className="text-gray-400 text-xs italic">{r.user}</span>
                    </li>
                  ))}
                </ul>
              )}
              {hasMore && (
                <button 
                  className="w-full mt-2 py-2 text-xs font-bold text-blue-600 border border-blue-100 hover:bg-blue-50 rounded-lg"
                  onClick={handleLoadMore}
                >
                  Завантажити ще...
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- ОСНОВНИЙ КОМПОНЕНТ ---
export default function App() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('Всі');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    fetchEvents();
    return () => unsub();
  }, []);

  const fetchEvents = async () => {
    try {
      setServerError("");
      const response = await fetch(`${API_URL}/api/events`);
      if (!response.ok) throw new Error("Помилка завантаження");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      setServerError("Не вдалося підключитися до сервера Railway. Переконайтеся, що бекенд запущено.");
    }
  };

  const handleRate = async (eventId, newScore, userEmail) => {
    try {
      await fetch(`${API_URL}/api/events/${eventId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRating: newScore, userEmail: userEmail }),
      });
      fetchEvents(); 
    } catch (error) {
      console.error("Помилка відправки:", error);
    }
  };

  const handleBooking = (event, quantity) => {
    setBookings([...bookings, { ...event, quantity, total: event.price * quantity, bId: Date.now() }]);
    alert(`Квитки додано: ${event.title} (x${quantity})`);
  };

  const filteredEvents = events.filter(e => filter === 'Всі' || e.type === filter);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        {/* Шапка */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="text-2xl font-black tracking-tight text-gray-800">
              🎟️ Event<span className="text-blue-600">Tickets</span>
            </div>
            <nav>
              <ul className="flex items-center gap-6">
                <li><Link to="/" className="text-sm font-semibold text-gray-600 hover:text-blue-600">Події</Link></li>
                <li>
                  <Link to="/my-bookings" className="text-sm font-semibold text-gray-600 hover:text-blue-600 flex items-center">
                    Кошик 
                    {bookings.length > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{bookings.length}</span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                    {user ? 'Профіль' : 'Увійти'}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-10">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
              <span className="text-lg">⚠️</span> {serverError}
            </div>
          )}
          
          <Routes>
            <Route path="/" element={
              <section>
                <div className="flex flex-wrap gap-2 mb-10">
                  {['Всі', 'Концерт', 'Театр', 'IT'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => setFilter(c)} 
                      className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                        filter === c 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredEvents.map(e => (
                    <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={handleBooking} />
                  ))}
                </div>
              </section>
            } />
            <Route path="/my-bookings" element={
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                <h2 className="text-2xl font-black mb-6">Ваші бронювання</h2>
                {bookings.length === 0 ? (
                  <p className="text-gray-400 italic">Кошик поки що порожній. Оберіть захід!</p>
                ) : (
                  <ul className="space-y-4">
                    {bookings.map(b => (
                      <li key={b.bId} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-bold text-gray-800">✅ {b.title}</p>
                          <p className="text-xs text-gray-500">Кількість: {b.quantity}</p>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-lg text-sm font-black text-blue-600 shadow-sm">
                          {b.total} грн
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            } />
            <Route path="/auth" element={
              <div className="max-w-md mx-auto">
                <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-xl">
                  {user ? (
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">👤</div>
                      <h3 className="text-xl font-bold mb-2">Привіт, {user.email}!</h3>
                      <p className="text-gray-500 text-sm mb-8">Ви успішно авторизовані в системі</p>
                      <button 
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all" 
                        onClick={() => signOut(auth)}
                      >
                        Вийти з системи
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-gray-800">Вітаємо!</h2>
                        <p className="text-gray-500 text-sm mt-2">Увійдіть або створіть новий акаунт</p>
                      </div>
                      <div className="space-y-4">
                        <input 
                          type="email" 
                          placeholder="Email адреса" 
                          className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          onChange={e => setEmail(e.target.value)} 
                        />
                        <input 
                          type="password" 
                          placeholder="Ваш пароль" 
                          className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          onChange={e => setPassword(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-100" 
                          onClick={() => signInWithEmailAndPassword(auth, email, password).catch(e => alert(e.message))}
                        >
                          Увійти
                        </button>
                        <button 
                          className="bg-white border border-gray-200 hover:border-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-all" 
                          onClick={() => createUserWithEmailAndPassword(auth, email, password).catch(e => alert(e.message))}
                        >
                          Реєстрація
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
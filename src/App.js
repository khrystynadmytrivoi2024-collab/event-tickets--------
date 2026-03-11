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
// Христино, переконайся, що ці дані збігаються з твоїм проєктом у Firebase Console
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

// --- ПОСИЛАННЯ НА БЕКЕНД (Railway) ---
// Твоя актуальна адреса сервера
const API_URL = "https://event-backend-production-349d.up.railway.app";

// --- КОМПОНЕНТ: Картка події ---
const EventCard = ({ event, user, onRate, onBook }) => {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // Вимога 3: Отримання оцінок з пагінацією (по 10 штук на сторінку)
  const fetchReviews = async (pageNum) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/events/${event.id}/ratings?page=${pageNum}`);
      if (!res.ok) throw new Error("Помилка завантаження відгуків");
      const data = await res.json();
      
      if (pageNum === 1) {
        setReviews(data.ratings || []);
      } else {
        setReviews(prev => [...prev, ...(data.ratings || [])]);
      }
      // Якщо повернулося 10 записів, значить є ще сторінки
      setHasMore(data.ratings?.length === 10);
    } catch (error) {
      console.error("Reviews Error:", error);
    } finally {
      setLoading(false);
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <img 
        className="w-full h-48 object-cover" 
        src={event.img || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80'} 
        alt={event.title} 
      />
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
            {event.type}
          </span>
          <div className="bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1">
            <span className="text-amber-500 font-bold">⭐ {event.averageRating || "0.0"}</span>
            <span className="text-gray-400 text-[10px]">({event.ratingCount || 0})</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-4">📅 {event.date || 'Дата уточнюється'}</p>
        
        <p className="text-2xl font-black text-blue-600 mb-6">{event.price} <span className="text-sm font-normal">грн</span></p>
        
        <div className="mt-auto space-y-3">
          {user ? (
            <select 
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium"
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) {
                  onRate(event.id, val, user.email);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Оцінити подію...</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          ) : (
            <p className="text-gray-400 text-[11px] text-center italic">Увійдіть для оцінювання</p>
          )}

          <div className="flex gap-2">
            <input 
              type="number" 
              min="1" 
              className="w-16 border border-gray-200 rounded-xl p-2 text-center focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={qty} 
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} 
            />
            <button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-blue-100 transition-colors"
              onClick={() => onBook(event, qty)}
            >
              Бронювати
            </button>
          </div>

          <button 
            className="w-full py-2 text-xs font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-t border-gray-50 mt-4"
            onClick={handleToggleReviews}
          >
            {showReviews ? 'Сховати відгуки' : 'Показати відгуки'}
          </button>
          
          {showReviews && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {reviews.length === 0 ? (
                <p className="text-center text-gray-400 text-[11px]">Ще немає відгуків</p>
              ) : (
                <ul className="space-y-2">
                  {reviews.map((r, index) => (
                    <li key={index} className="p-2 bg-gray-50 rounded-lg flex justify-between items-center text-[11px]">
                      <span className="font-bold text-gray-700">⭐ {r.score}</span>
                      <span className="text-gray-400 italic truncate ml-2" title={r.user}>{r.user}</span>
                    </li>
                  ))}
                </ul>
              )}
              {hasMore && (
                <button 
                  className="w-full py-1 text-[10px] font-bold text-blue-500 hover:underline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Завантаження...' : 'Завантажити ще'}
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

  // Вимога 3: Отримання всіх подій із середньою оцінкою
  const fetchEvents = async () => {
    try {
      setServerError("");
      const response = await fetch(`${API_URL}/api/events`);
      if (!response.ok) throw new Error("Сервер не відповідає");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("API Error:", error);
      setServerError("Не вдалося підключитися до сервера Railway. Перевірте адресу та статус.");
    }
  };

  // Вимога 4: POST-запит для оцінки та МИТТЄВЕ оновлення середньої оцінки
  const handleRate = async (eventId, newScore, userEmail) => {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRating: newScore, userEmail: userEmail }),
      });
      
      if (response.ok) {
        // Миттєво оновлюємо список подій, щоб побачити новий середній рейтинг
        fetchEvents(); 
      } else {
        const err = await response.json();
        alert(`Помилка: ${err.error}`);
      }
    } catch (error) {
      console.error("Rate Error:", error);
    }
  };

  const handleBooking = (event, quantity) => {
    setBookings([...bookings, { ...event, quantity, total: event.price * quantity, bId: Date.now() }]);
    alert(`Додано до кошика: ${event.title}`);
  };

  const filteredEvents = events.filter(e => filter === 'Всі' || e.type === filter);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-2xl font-black tracking-tighter text-gray-800 hover:opacity-80 transition-opacity">
              🎟️ Event<span className="text-blue-600">Tickets</span>
            </Link>
            <nav>
              <ul className="flex items-center gap-6">
                <li><Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Події</Link></li>
                <li>
                  <Link to="/my-bookings" className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-2">
                    Кошик 
                    {bookings.length > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{bookings.length}</span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-5 py-2.5 rounded-full shadow-lg shadow-blue-100 transition-all">
                    {user ? 'ПРОФІЛЬ' : 'УВІЙТИ'}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-10">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-8 flex items-center gap-3 animate-pulse">
              <span className="text-lg">⚠️</span> {serverError}
            </div>
          )}
          
          <Routes>
            <Route path="/" element={
              <section>
                <div className="flex flex-wrap items-center gap-2 mb-10">
                  {['Всі', 'Концерт', 'Театр', 'IT'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => setFilter(c)} 
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                        filter === c 
                          ? 'bg-gray-900 text-white shadow-xl scale-105' 
                          : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <button onClick={fetchEvents} className="ml-auto p-2 text-gray-300 hover:text-blue-600 transition-colors" title="Оновити дані">🔄</button>
                </div>
                
                {events.length === 0 && !serverError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                    <div className="animate-spin text-4xl mb-4">🌀</div>
                    <p className="font-bold">Завантаження подій...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map(e => (
                      <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={handleBooking} />
                    ))}
                  </div>
                )}
              </section>
            } />
            <Route path="/my-bookings" element={
              <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
                <h2 className="text-3xl font-black mb-8 text-gray-900">Ваші бронювання</h2>
                {bookings.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400 italic mb-6">Кошик поки що порожній</p>
                    <Link to="/" className="text-blue-600 font-bold hover:underline">Переглянути події →</Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {bookings.map(b => (
                      <li key={b.bId} className="py-4 flex justify-between items-center group">
                        <div>
                          <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">✅ {b.title}</p>
                          <p className="text-xs text-gray-400">Кількість: {b.quantity}</p>
                        </div>
                        <span className="bg-gray-50 px-4 py-2 rounded-xl text-sm font-black text-gray-700">
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
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
                  {user ? (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">👤</div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900 truncate px-4">{user.email}</h3>
                      <p className="text-gray-400 text-sm mb-8">Ви успішно авторизовані</p>
                      <button 
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-all" 
                        onClick={() => signOut(auth)}
                      >
                        Вийти з акаунта
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-gray-900">Вітаємо!</h2>
                        <p className="text-gray-400 text-sm mt-2">Увійдіть для доступу до оцінок</p>
                      </div>
                      <div className="space-y-4">
                        <input 
                          type="email" 
                          placeholder="Email адреса" 
                          className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={email}
                          onChange={e => setEmail(e.target.value)} 
                        />
                        <input 
                          type="password" 
                          placeholder="Ваш пароль" 
                          className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          value={password}
                          onChange={e => setPassword(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 pt-4">
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all" 
                          onClick={() => signInWithEmailAndPassword(auth, email, password).catch(e => alert(e.message))}
                        >
                          Увійти
                        </button>
                        <button 
                          className="bg-white border border-gray-100 hover:border-gray-200 text-gray-500 font-bold py-4 rounded-2xl transition-all" 
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
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
  appId: "1:959565642887:web:f2b0eee1e5242175024c22",
  measurementId: "G-107MZXYPGH"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Твоя адреса на Railway
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
      const data = await res.json();
      if (pageNum === 1) setReviews(data.ratings || []);
      else setReviews(prev => [...prev, ...(data.ratings || [])]);
      setHasMore(data.ratings?.length === 10);
    } catch (e) { console.error("Error fetching reviews:", e); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col h-full">
      <img className="w-full h-52 object-cover" src={event.img || 'https://picsum.photos/400/250'} alt={event.title} />
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-3">
          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{event.type}</span>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <span className="text-amber-500 font-bold text-sm">⭐ {event.averageRating || "0.0"}</span>
            <span className="text-gray-400 text-[10px]">({event.ratingCount || 0})</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h3>
        <p className="text-gray-400 text-xs mb-4 italic">📅 {event.date || 'Незабаром'}</p>
        
        <div className="text-2xl font-black text-gray-900 mb-6">{event.price} <span className="text-sm font-normal text-gray-400">грн</span></div>
        
        <div className="mt-auto space-y-3">
          {user ? (
            <select className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" 
                    onChange={(e) => { onRate(event.id, Number(e.target.value), user.email); e.target.value = ""; }}>
              <option value="">Поставити оцінку...</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          ) : <p className="text-[10px] text-gray-400 text-center py-2">Увійдіть, щоб оцінити</p>}

          <div className="flex gap-2">
            <input type="number" min="1" className="w-16 border border-gray-100 rounded-xl p-2 text-center font-bold bg-gray-50" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value)))} />
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all text-xs" onClick={() => onBook(event, qty)}>БРОНЮВАТИ</button>
          </div>

          <button className="w-full mt-4 py-2 text-[10px] font-black text-gray-300 hover:text-blue-600 transition-colors uppercase" 
                  onClick={() => { if(!showReviews) fetchReviews(1); setShowReviews(!showReviews); }}>
            {showReviews ? 'Сховати відгуки ↑' : 'Читати відгуки ↓'}
          </button>

          {showReviews && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {reviews.length === 0 ? <p className="text-center text-[10px] text-gray-300 py-2">Відгуків немає</p> : 
                reviews.map((r, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-gray-700 text-xs">⭐ {r.score}</span>
                    <span className="text-[9px] text-gray-400 italic truncate ml-4">{r.user}</span>
                  </div>
                ))
              }
              {hasMore && <button onClick={() => {fetchReviews(page+1); setPage(page+1)}} className="w-full text-[9px] font-bold text-blue-500 py-1">Ще...</button>}
            </div>
          )}
        </div>
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
    } catch (e) { console.error("API Link failed."); }
  };

  const handleRate = async (id, score, mail) => {
    await fetch(`${API_URL}/api/events/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newRating: score, userEmail: mail }),
    });
    fetchEvents();
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#fcfcfd]">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
            <Link to="/" className="text-2xl font-black tracking-tighter text-gray-900">🎟️ Event<span className="text-blue-600">Hub</span></Link>
            <nav className="flex gap-6 items-center">
              <Link to="/" className="text-xs font-bold text-gray-400 uppercase">Події</Link>
              <Link to="/cart" className="text-xs font-bold text-gray-400 uppercase">Кошик ({bookings.length})</Link>
              <Link to="/auth" className="bg-blue-600 text-white text-[10px] font-black px-6 py-3 rounded-full shadow-lg">
                {user ? 'ПРОФІЛЬ' : 'УВІЙТИ'}
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <Routes>
            <Route path="/" element={
              <>
                <div className="flex gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
                  {['Всі', 'Концерт', 'Театр', 'IT'].map(c => (
                    <button key={c} onClick={() => setFilter(c)} 
                            className={`px-8 py-3 rounded-2xl text-xs font-black transition-all ${filter === c ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'}`}>
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {events.filter(e => filter === 'Всі' || e.type === filter).map(e => (
                    <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={(ev, q) => {setBookings([...bookings, {ev, q}]); alert('Додано в кошик!')}} />
                  ))}
                </div>
              </>
            } />
            <Route path="/auth" element={
              <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-2xl mt-10">
                {user ? (
                  <div className="text-center">
                    <p className="text-xl font-bold mb-6 truncate">{user.email}</p>
                    <button className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl text-xs" onClick={() => signOut(auth)}>ВИЙТИ</button>
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <h2 className="text-3xl font-black">Вхід</h2>
                    <input className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl" type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
                    <input className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl" type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} />
                    <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl" onClick={() => signInWithEmailAndPassword(auth, email, password).catch(e => alert(e.message))}>УВІЙТИ</button>
                    <button className="text-[10px] text-gray-400 font-bold uppercase" onClick={() => createUserWithEmailAndPassword(auth, email, password).catch(e => alert(e.message))}>Реєстрація</button>
                  </div>
                )}
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
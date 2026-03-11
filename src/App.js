import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async (p) => {
    const res = await fetch(`${API_URL}/api/events/${event.id}/ratings?page=${p}`);
    const data = await res.json();
    if (p === 1) setReviews(data.ratings || []);
    else setReviews(prev => [...prev, ...(data.ratings || [])]);
    setHasMore(data.ratings?.length === 10);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full animate-fade-in">
      <img className="w-full h-52 object-cover" src={event.img || 'https://picsum.photos/400/250'} alt="" />
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-4">
          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{event.type}</span>
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
            <span className="text-amber-500 font-bold text-sm">⭐ {event.averageRating || "0.0"}</span>
            <span className="text-gray-400 text-[10px]">({event.ratingCount || 0})</span>
          </div>
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">{event.title}</h3>
        <p className="text-gray-400 text-[10px] mb-4 font-bold uppercase tracking-tighter">📅 {event.date || 'Незабаром'}</p>
        <div className="text-2xl font-black text-gray-900 mb-6">{event.price} <span className="text-xs font-normal text-gray-400">грн</span></div>
        <div className="mt-auto space-y-3">
          {user ? (
            <select className="w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20" 
                    onChange={(e) => { onRate(event.id, Number(e.target.value), user.email); e.target.value = ""; }}>
              <option value="">ОЦІНИТИ ПОДІЮ...</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} зірок</option>)}
            </select>
          ) : <p className="text-[10px] text-gray-400 text-center py-2 italic font-bold">Увійдіть для оцінки</p>}
          <div className="flex gap-2">
            <input type="number" min="1" className="w-16 border border-gray-100 rounded-2xl p-2 text-center font-black bg-gray-50" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value)))} />
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all text-[11px] tracking-widest" onClick={() => onBook(event, qty)}>БРОНЮВАТИ</button>
          </div>
          <button className="w-full mt-4 py-2 text-[10px] font-black text-gray-300 hover:text-blue-600 transition-colors uppercase tracking-widest" 
                  onClick={() => { if(!showReviews) fetchReviews(1); setShowReviews(!showReviews); }}>
            {showReviews ? 'Сховати відгуки ↑' : 'Читати відгуки ↓'}
          </button>
          {showReviews && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map((r, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-2xl flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-xs">⭐ {r.score}</span>
                  <span className="text-[9px] text-gray-400 italic truncate ml-4">{r.user}</span>
                </div>
              ))}
              {hasMore && <button onClick={() => {fetchReviews(page+1); setPage(page+1)}} className="w-full text-[9px] font-bold text-blue-500 py-2">ЩЕ...</button>}
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

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await fetch(`${API_URL}/api/events`);
    const data = await res.json();
    setEvents(data);
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
            <Link to="/" className="text-2xl font-black tracking-tighter text-gray-900">
              🎟️ Event<span className="text-blue-600">Tickets</span>
            </Link>
            <nav className="flex gap-8 items-center">
              <Link to="/" className="text-[11px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Події</Link>
              <Link to="/cart" className="text-[11px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Кошик ({bookings.length})</Link>
              <Link to="/auth" className="bg-gray-900 text-white text-[10px] font-black px-6 py-3 rounded-full hover:bg-blue-600 transition-all shadow-xl shadow-gray-200">
                {user ? 'ПРОФІЛЬ' : 'УВІЙТИ'}
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <Routes>
            <Route path="/" element={
              <>
                <div className="flex gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
                  {['Всі', 'Концерт', 'Театр', 'IT'].map(c => (
                    <button key={c} onClick={() => setFilter(c)} 
                            className={`px-8 py-3 rounded-2xl text-[11px] font-black transition-all tracking-wider ${filter === c ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'}`}>
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {events.filter(e => filter === 'Всі' || e.type === filter).map(e => (
                    <EventCard key={e.id} event={e} user={user} onRate={handleRate} onBook={(ev, q) => {setBookings([...bookings, {ev, q}]); alert('Додано в кошик!')}} />
                  ))}
                </div>
              </>
            } />
            <Route path="/auth" element={
              <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-2xl mt-10 text-center">
                {user ? (
                  <div>
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">👤</div>
                    <p className="text-xl font-black mb-10 truncate px-4">{user.email}</p>
                    <button className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 rounded-2xl transition-all text-[10px] tracking-widest" onClick={() => signOut(auth)}>ВИЙТИ З АКАУНТА</button>
                  </div>
                ) : (
                  <p className="font-bold text-gray-400">Увійдіть через додаток VS Code</p>
                )}
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
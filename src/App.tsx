import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, ClipboardList, LogOut, LockKeyhole, MessageCircle, Send, ShieldCheck, Sparkles, Star, Users, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Rating = 'Satisfactory' | 'Good' | 'Excellent';
type Review = { id: string; ratings: Record<string, Rating>; comment: string; feedback_comment: string; created_at: string };

const events = [
  'Morning gift from your spouse / colleague',
  'Teachers Day Assembly',
  'Teachers Day Breakfast events',
  'Best friend event',
  'Cake Cutting event',
  'Teachers Day Picnic Trip',
  'Evening Tea time event',
  'Dinner Night Event',
];
const choices: Rating[] = ['Satisfactory', 'Good', 'Excellent'];
const formTitle = 'Reflect and share your thoughts on Teachers day events - 2026';
const submittedKey = 'faafu-teachers-day-review-submitted';
const basePath = import.meta.env.BASE_URL;
const logoPath = `${basePath}png.png`;

function App() {
  const isAdmin = window.location.pathname.endsWith('/admin') || window.location.hash === '#admin';
  return isAdmin ? <AdminApp /> : <ReviewForm />;
}

function BrandHeader({ admin = false }: { admin?: boolean }) {
  return (
    <header className="topbar">
      <div className="brand">
        <img src={logoPath} alt="Faafu Atoll School" />
        <div><strong>Faafu Atoll School</strong><span>{admin ? 'Review insights' : 'Teachers Day 2026'}</span></div>
      </div>
      {!admin && <a className="admin-link" href={`${basePath}#admin`}><LockKeyhole size={15} /> Admin sign in</a>}
    </header>
  );
}

function ReviewForm() {
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [comment, setComment] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => setAlreadySubmitted(localStorage.getItem(submittedKey) === 'true'), []);

  const completed = events.filter((event) => ratings[event]).length;
  const canSubmit = completed === events.length && comment.trim().length > 0 && feedbackComment.trim().length > 0 && !submitting && !alreadySubmitted;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true); setNotice(null);
    const deviceKey = localStorage.getItem('faafu-review-device') ?? crypto.randomUUID();
    localStorage.setItem('faafu-review-device', deviceKey);
    const { error } = await supabase.from('teachers_day_reviews').insert({ device_key: deviceKey, ratings, comment: comment.trim(), feedback_comment: feedbackComment.trim() });
    if (error) {
      if (error.code === '23505') { localStorage.setItem(submittedKey, 'true'); setAlreadySubmitted(true); setNotice({ type: 'success', text: 'A response has already been recorded from this device.' }); }
      else setNotice({ type: 'error', text: 'We could not save your response. Please try again.' });
    } else {
      localStorage.setItem(submittedKey, 'true'); setAlreadySubmitted(true); setNotice({ type: 'success', text: 'Thank you. Your reflection has been recorded.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSubmitting(false);
  }

  return <div className="app-shell"><BrandHeader /><main className="content-wrap">
    <section className="hero-card"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14} /> Teachers Day 2026</div><h1>{formTitle}</h1><p>Your voice helps us celebrate the moments that made this special day memorable. Please rate each event and share one reflection.</p><div className="hero-meta"><span><ShieldCheck size={16} /> Anonymous & private</span><span><ClipboardList size={16} /> 10 quick questions</span></div></div></section>
    {notice && <div className={`notice ${notice.type}`}><span>{notice.type === 'success' ? <Check size={18} /> : <X size={18} />}</span>{notice.text}</div>}
    {alreadySubmitted ? <section className="success-panel"><div className="success-icon"><Check size={32} /></div><h2>Your response is already recorded</h2><p>Thank you for sharing your thoughts on Teachers Day 2026. Only one response is accepted per device.</p><a href="#top" className="text-link">Back to top</a></section> : <form onSubmit={handleSubmit} className="survey-card"><div className="section-heading"><div><span className="section-kicker">Part one</span><h2>Rate each celebration</h2></div><span className="progress-pill">{completed} / 8 complete</span></div><div className="questions">{events.map((event, index) => <fieldset className="question" key={event}><legend><span className="number">{String(index + 1).padStart(2, '0')}</span><span>{event}</span></legend><div className="choice-grid">{choices.map((choice) => <label className={`choice ${ratings[event] === choice ? 'selected' : ''}`} key={choice}><input type="radio" name={event} value={choice} checked={ratings[event] === choice} onChange={() => setRatings((current) => ({ ...current, [event]: choice }))} /><span className="choice-mark">{ratings[event] === choice && <Check size={14} />}</span>{choice}</label>)}</div></fieldset>)}</div><div className="comment-block"><div className="section-heading"><div><span className="section-kicker">Part two</span><h2>Your highlight of the day</h2></div><MessageCircle size={22} /></div><label htmlFor="comment" className="prompt">Most inspiring, enjoyable and memorable event of the day <span>Required</span></label><textarea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tell us what stood out and why..." rows={5} required /><label htmlFor="feedback-comment" className="prompt second-prompt">Give Your feedback on Teachers day events - 2026 <span>Required</span></label><textarea id="feedback-comment" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="Share your overall feedback and suggestions..." rows={5} required /><div className="form-footer"><span className="helper">{comment.length + feedbackComment.length}/1000 characters</span><button className="submit-button" disabled={!canSubmit}>{submitting ? 'Sending...' : 'Submit my reflection'} <Send size={17} /></button></div></div></form>}
    <footer><span>Faafu Atoll School</span><span>Teachers Day 2026 · Your feedback matters</span></footer>
  </main></div>;
}

function AdminApp() {
  const [session, setSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState('admin@faafuschool.edu'); const [password, setPassword] = useState(''); const [authError, setAuthError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(Boolean(data.session))); const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => setSession(Boolean(current))); return () => listener.subscription.unsubscribe(); }, []);
  if (session === null) return <div className="loading-screen"><img src={logoPath} alt="" /><span>Loading dashboard...</span></div>;
  if (!session) return <AdminLogin email={email} setEmail={setEmail} password={password} setPassword={setPassword} error={authError} busy={busy} onSubmit={async (event) => { event.preventDefault(); setBusy(true); setAuthError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setAuthError('Email or password is incorrect.'); setBusy(false); }} />;
  return <Dashboard onLogout={() => supabase.auth.signOut()} />;
}

function AdminLogin({ email, setEmail, password, setPassword, error, busy, onSubmit }: { email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void; error: string; busy: boolean; onSubmit: (event: FormEvent) => void }) {
  return <div className="login-shell"><div className="login-art"><img src={logoPath} alt="Faafu Atoll School" /><span>FAAFU ATOLL SCHOOL</span><p>Thoughtful celebrations. Stronger community.</p></div><form className="login-card" onSubmit={onSubmit}><span className="section-kicker">Private area</span><h1>Administrator sign in</h1><p>Sign in to view the Teachers Day feedback insights.</p><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="admin@school.edu" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="Enter your password" /></label>{error && <div className="auth-message">{error}</div>}<button className="submit-button full" disabled={busy}>{busy ? 'Please wait...' : 'Sign in to dashboard'} <LockKeyhole size={16} /></button><a className="back-home" href={import.meta.env.BASE_URL}>← Back to public form</a></form></div>;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { supabase.from('teachers_day_reviews').select('id, ratings, comment, feedback_comment, created_at').order('created_at', { ascending: false }).then(({ data, error: queryError }) => { if (queryError) setError('Feedback could not be loaded.'); else setReviews((data as Review[]) ?? []); setLoading(false); }); }, []);
  const counts = useMemo(() => Object.fromEntries(events.map((event) => [event, Object.fromEntries(choices.map((choice) => [choice, reviews.filter((review) => review.ratings[event] === choice).length]))])), [reviews]);
  const statusCounts = useMemo(() => choices.reduce<Record<Rating, number>>((result, choice) => {
    result[choice] = reviews.reduce((total, review) => total + events.filter((event) => review.ratings[event] === choice).length, 0);
    return result;
  }, { Satisfactory: 0, Good: 0, Excellent: 0 }), [reviews]);
  return <div className="dashboard-shell"><BrandHeader admin /><main className="dashboard-content"><div className="dashboard-title"><div><span className="eyebrow"><BarChart3 size={14} /> Admin dashboard</span><h1>Teachers Day feedback</h1><p>A clear view of what your teachers valued most.</p></div><button className="logout-button" onClick={onLogout}><LogOut size={16} /> Sign out</button></div>{error && <div className="notice error">{error}</div>}{loading ? <div className="empty-state">Loading feedback...</div> : <><div className="stat-grid"><div className="stat-card"><Users size={20} /><strong>{reviews.length}</strong><span>Total responses</span></div><div className="stat-card satisfactory"><Check size={20} /><strong>{statusCounts.Satisfactory}</strong><span>Satisfactory ratings</span></div><div className="stat-card good"><Star size={20} /><strong>{statusCounts.Good}</strong><span>Good ratings</span></div><div className="stat-card excellent"><ShieldCheck size={20} /><strong>{statusCounts.Excellent}</strong><span>Excellent ratings</span></div></div><section className="insights-card"><div className="section-heading"><div><span className="section-kicker">At a glance</span><h2>Event rating breakdown</h2></div><span className="response-label">{reviews.length} responses</span></div>{reviews.length === 0 ? <div className="empty-state">No responses yet. Share the public form to begin.</div> : <div className="bars">{events.map((event) => { const eventCounts = counts[event] as Record<Rating, number>; const max = Math.max(...choices.map((choice) => eventCounts[choice]), 1); return <div className="bar-row" key={event}><div className="bar-label"><span>{event}</span><strong>{eventCounts.Excellent} excellent</strong></div><div className="bar-track">{choices.map((choice) => <div key={choice} className={`bar-segment ${choice.toLowerCase()}`} style={{ width: `${(eventCounts[choice] / max) * 100}%` }} title={`${choice}: ${eventCounts[choice]}`} />)}</div><div className="bar-legend">{choices.map((choice) => <span key={choice}><i className={choice.toLowerCase()} /> {eventCounts[choice]}</span>)}</div></div>})}</div>}</section><section className="insights-card reflections"><div className="section-heading"><div><span className="section-kicker">In their words</span><h2>Recent reflections</h2></div></div>{reviews.length === 0 ? <div className="empty-state">Reflections will appear here after teachers submit the form.</div> : reviews.slice(0, 8).map((review) => <article className="reflection" key={review.id}><MessageCircle size={17} /><p><strong>{review.comment}</strong>{review.feedback_comment && <span className="secondary-reflection">{review.feedback_comment}</span>}</p><time>{new Date(review.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</time></article>)}</section></>}</main></div>;
}

export default App;

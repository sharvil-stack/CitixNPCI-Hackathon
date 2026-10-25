import { Suspense, lazy } from 'react';
import { Router, Routes, useRouter, type RouteDef } from './lib/router';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Loading } from './components/ui/Feedback';
import Home from './pages/Home';
import Features from './pages/Features';
import About from './pages/About';
import Help from './pages/Help';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import NotFound from './pages/NotFound';

const Schemes = lazy(() => import('./features/schemes/SchemesApp'));
const ScamShield = lazy(() => import('./features/scamshield/ScamShieldApp'));
const MoneyMentor = lazy(() => import('./features/moneymentor/MentorApp'));
const CardWise = lazy(() => import('./features/cardwise/CardWiseApp'));
const Drunix = lazy(() => import('./features/drunix/DrunixApp'));

const routes: RouteDef[] = [
  { path: '/', element: () => <Home /> },
  { path: '/features', element: () => <Features /> },
  { path: '/about', element: () => <About /> },
  { path: '/help', element: () => <Help /> },
  { path: '/login', element: () => <Login /> },
  { path: '/signup', element: () => <Signup /> },
  { path: '/schemes', element: () => <Schemes view="landing" /> },
  { path: '/schemes/browse', element: () => <Schemes view="browse" /> },
  { path: '/schemes/match', element: () => <Schemes view="match" /> },
  { path: '/scamshield', element: () => <ScamShield view="landing" /> },
  { path: '/scamshield/check', element: () => <ScamShield view="check" /> },
  { path: '/learn', element: () => <MoneyMentor view="dashboard" /> },
  { path: '/learn/:topic', element: (p) => <MoneyMentor view="topic" topic={p.topic} /> },
  { path: '/learn/:topic/simulation', element: (p) => <MoneyMentor view="sim" topic={p.topic} /> },
  { path: '/learn/:topic/quiz', element: (p) => <MoneyMentor view="quiz" topic={p.topic} /> },
  { path: '/cards', element: () => <CardWise view="landing" /> },
  { path: '/cards/browse', element: () => <CardWise view="browse" /> },
  { path: '/cards/recommend', element: () => <CardWise view="recommend" /> },
  { path: '/cards/assistant', element: () => <CardWise view="assistant" /> },
  { path: '/cards/learn', element: () => <CardWise view="learn" /> },
  { path: '/cards/:id', element: (p) => <CardWise view="detail" id={p.id} /> },
  { path: '/referrals', element: () => <Drunix /> },
];

function Shell() {
  const { path } = useRouter();
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <Navbar />
      <main id="main" key={path.split('/')[1] || 'home'}>
        <Suspense fallback={<div className="wrap"><Loading /></div>}><Routes routes={routes} fallback={<NotFound />} /></Suspense>
      </main>
      <Footer />
    </>
  );
}
export default function App() { return <LangProvider><AuthProvider><Router><Shell /></Router></AuthProvider></LangProvider>; }

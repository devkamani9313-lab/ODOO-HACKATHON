import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Drivers from './components/Drivers';
import Trips from './components/Trips';
import Maintenance from './components/Maintenance';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import { 
  Sparkle, 
  CaretRight, 
  EnvelopeSimple, 
  LockSimple, 
  ShieldCheck, 
  ArrowLeft,
  Wrench,
  MapTrifold,
  Users,
  PresentationChart,
  Lock,
  ArrowUpRight,
  TrendUp,
  CheckCircle,
  Database,
  Lightning,
  ChartLineUp,
  ShieldCheckered,
  GasPump,
  Truck,
  MapPin,
  Clock,
  Star,
  Gear,
  Eye,
  Bell,
  CurrencyInr,
  CaretDown,
  Quotes
} from '@phosphor-icons/react';


function AppContent() {
  const { currentUser, userRole, setUserRole, login, signup, loginAsRole, logout, isDemoMode, toggleMode } = useAuth();
  
  // Navigation Routing States
  const [view, setView] = useState('landing'); // landing, login, signup, app
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth Form States
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Manager');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      await login(loginEmail, loginPassword);
      setView('app');
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      if (signupPassword.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      await signup(signupEmail, signupPassword, signupRole);
      setView('app');
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'vehicles':
        return userRole === 'Manager' ? <Vehicles /> : <AccessDenied />;
      case 'drivers':
        return (userRole === 'Manager' || userRole === 'Safety Officer') ? <Drivers /> : <AccessDenied />;
      case 'trips':
        return (userRole === 'Manager' || userRole === 'Driver') ? <Trips /> : <AccessDenied />;
      case 'maintenance':
        return userRole === 'Manager' ? <Maintenance /> : <AccessDenied />;
      case 'expenses':
        return (userRole === 'Manager' || userRole === 'Financial Analyst') ? <Expenses /> : <AccessDenied />;
      case 'reports':
        return (userRole === 'Manager' || userRole === 'Financial Analyst') ? <Reports /> : <AccessDenied />;
      default:
        return <Dashboard />;
    }
  };

  if (currentUser && view !== 'app') {
    setView('app');
  }
  if (!currentUser && view === 'app') {
    setView('landing');
  }

  // --- VIEW 1: LANDING PAGE ---
  if (view === 'landing') {
    return (
      <div className="bg-[#060611] text-white flex flex-col font-sans selection:bg-violet-500/20 selection:text-violet-200 overflow-x-hidden">

        {/* ═══ NAVBAR ═══ */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl px-6 py-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/30 relative pulse-ring">
                <Sparkle size={18} weight="fill" className="text-white" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight text-white">TransitOps</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block text-[10px] text-violet-300/80 font-bold uppercase tracking-[0.2em] bg-violet-500/10 border border-violet-500/20 rounded-full px-3.5 py-1">
                Fleet Engine v2.0
              </span>
              <button
                onClick={() => setView('login')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-violet-600/30 hover:shadow-violet-500/50 transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer border border-violet-500/30"
              >
                Launch App →
              </button>
            </div>
          </div>
        </nav>

        {/* ═══ HERO SECTION — Dark 3D ═══ */}
        <section className="aurora-bg relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
          {/* Floating orbs */}
          <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] pointer-events-none orb-1" />
          <div className="absolute bottom-[5%] right-[5%] w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none orb-2" />
          <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none orb-3" />
          
          {/* Dot grid overlay */}
          <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

          <div className="max-w-7xl mx-auto w-full px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Left: Copy */}
            <div className="space-y-8">
              <div className="hero-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm text-xs text-violet-300 font-bold tracking-wide">
                <Sparkle size={12} weight="fill" className="text-violet-400" />
                <span>AI-Powered Fleet Intelligence</span>
              </div>
              
              <h1 className="hero-fade-up delay-1 text-5xl md:text-7xl font-heading font-bold tracking-tight leading-[1.05]">
                <span className="text-white">The Future of</span><br />
                <span className="gradient-text-animated">Fleet Operations</span>
              </h1>

              <p className="hero-fade-up delay-2 text-gray-400 text-lg md:text-xl leading-relaxed max-w-lg">
                Transform your transport operations with real-time dispatch, predictive maintenance, and intelligent analytics — all in one unified command center.
              </p>

              <div className="hero-fade-up delay-3 pt-2 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setView('login')}
                  className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-2xl shadow-violet-600/30 hover:shadow-violet-500/50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-violet-500/30"
                >
                  <span>Start Operations</span>
                  <ArrowUpRight size={18} weight="bold" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
                <a 
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-gray-300 font-bold text-base flex items-center justify-center gap-2 hover:bg-white/[0.07] hover:border-white/20 transition-all cursor-pointer"
                >
                  <span>Explore Platform</span>
                  <CaretDown size={18} weight="bold" />
                </a>
              </div>

              {/* Mini trust bar */}
              <div className="hero-fade-up delay-4 flex items-center gap-6 pt-4">
                {[
                  { val: '500+', label: 'Vehicles' },
                  { val: '99.2%', label: 'Uptime' },
                  { val: '₹2.4Cr', label: 'Saved' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <span className="text-xl font-heading font-bold text-white block">{s.val}</span>
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D Dashboard Mockup */}
            <div className="perspective-container hero-scale-in delay-2">
              <div className="tilt-card relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] rounded-3xl p-6 backdrop-blur-sm">
                {/* Mock dashboard header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">transitops.app/dashboard</span>
                </div>

                {/* Mock KPI row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Active Fleet', value: '127', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20' },
                    { label: 'On Route', value: '89', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/20' },
                    { label: 'Revenue', value: '₹4.2L', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20' },
                  ].map((kpi, i) => (
                    <div key={i} className={`bg-gradient-to-br ${kpi.color} border ${kpi.border} rounded-xl p-3`}>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{kpi.label}</span>
                      <span className="text-xl font-heading font-bold text-white mt-1 block">{kpi.value}</span>
                    </div>
                  ))}
                </div>

                {/* Mock map/image area */}
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] h-48">
                  <img 
                    src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800" 
                    alt="Fleet of trucks"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060611] via-transparent to-transparent" />
                  
                  {/* Floating widgets over image */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-2 animate-float-slow">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle size={16} className="text-emerald-400" weight="fill" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Fleet Health</span>
                      <span className="text-xs font-bold text-white">98.5% Active</span>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-2 animate-float-medium">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <TrendUp size={16} className="text-violet-400" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Savings</span>
                      <span className="text-xs font-bold text-white">+₹12,450</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 hero-fade-up delay-5">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Scroll to explore</span>
            <div className="w-5 h-8 rounded-full border-2 border-gray-600 flex justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-violet-400 animate-bounce" />
            </div>
          </div>
        </section>

        {/* ═══ STATS SECTION ═══ */}
        <section className="relative z-10 border-y border-white/[0.06] bg-[#0a0a1f]">
          <div className="max-w-7xl mx-auto w-full px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { value: '500+', label: 'Vehicles Tracked', icon: Truck },
              { value: '98.5%', label: 'Fleet Utilization', icon: ChartLineUp },
              { value: '₹2.4Cr', label: 'Annual Savings', icon: CurrencyInr },
              { value: '24/7', label: 'Live Monitoring', icon: Eye },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3 group">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 group-hover:border-violet-500/40 transition-all duration-300">
                  <stat.icon size={24} className="text-violet-400" weight="duotone" />
                </div>
                <span className="text-3xl md:text-4xl font-heading font-bold gradient-text-animated">{stat.value}</span>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES GRID — 3D Cards ═══ */}
        <section id="features" className="relative bg-[#060611] py-28 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[180px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[150px] pointer-events-none" />

          <div className="max-w-7xl mx-auto w-full px-8 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs text-violet-300 font-bold tracking-wide mb-5">
                <Lightning size={12} weight="fill" />
                <span>Core Capabilities</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
                <span className="text-white">Everything to</span><br />
                <span className="gradient-text-animated">Command Your Fleet</span>
              </h2>
              <p className="text-gray-500 text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
                Six powerful modules working together to give you complete operational control.
              </p>
            </div>

            <div className="perspective-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Truck, title: 'Vehicle Registry', desc: 'Real-time tracking with status, odometer, capacity specs, and acquisition cost analysis for every vehicle.', gradient: 'from-violet-500 to-violet-600' },
                { icon: Users, title: 'Driver Management', desc: 'License expiry alerts, safety scores with auto-suspension, and complete assignment history.', gradient: 'from-amber-500 to-orange-500' },
                { icon: MapTrifold, title: 'Trip Dispatch', desc: 'Smart dispatch with capacity validation, availability checks, and multi-rule enforcement.', gradient: 'from-cyan-500 to-blue-500' },
                { icon: Wrench, title: 'Maintenance', desc: 'Auto-lock vehicles to "In Shop" on service entry, track costs, and restore on completion.', gradient: 'from-emerald-500 to-teal-500' },
                { icon: GasPump, title: 'Fuel Analytics', desc: 'Auto-log fuel on trip completion, track consumption patterns, and spot inefficiencies.', gradient: 'from-rose-500 to-pink-500' },
                { icon: PresentationChart, title: 'ROI Reports', desc: 'Per-vehicle profitability with fuel efficiency, net earnings, and exportable CSV reports.', gradient: 'from-indigo-500 to-violet-500' },
              ].map((f, i) => (
                <div key={i} className="float-3d shine-on-hover glow-hover p-7 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm cursor-default group">
                  <div className={`h-13 w-13 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`} style={{height: '52px', width: '52px'}}>
                    <f.icon size={24} className="text-white" weight="fill" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SHOWCASE — Photo + Copy ═══ */}
        <section className="relative bg-[#0a0a1f] py-28 overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
          <div className="max-w-7xl mx-auto w-full px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            {/* Left: Overlapping images */}
            <div className="perspective-container relative h-[520px]">
              <div className="tilt-card absolute top-0 left-0 w-[58%] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-violet-900/30 border-2 border-white/[0.08] z-10">
                <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600" 
                  alt="Analytics dashboard"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1f]/80 via-transparent to-transparent" />
              </div>
              <div className="tilt-card absolute bottom-0 right-0 w-[58%] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-cyan-900/20 border-2 border-white/[0.08] z-20">
                <img 
                  src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=600" 
                  alt="Trucks on highway"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1f]/80 via-transparent to-transparent" />
              </div>
              {/* Floating widget */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/70 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg">
                    <ShieldCheckered size={22} className="text-white" weight="fill" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Safety Score</span>
                    <span className="text-xl font-bold text-white">96.2 / 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 font-bold tracking-wide">
                <ShieldCheck size={12} weight="fill" />
                <span>Built for Scale</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight leading-tight">
                <span className="text-white">One Platform for</span><br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Total Control</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                Whether you manage 10 vehicles or 10,000 — TransitOps scales effortlessly. Role-based access ensures everyone sees exactly what they need.
              </p>
              <div className="space-y-4 pt-2">
                {[
                  'Real-time vehicle status tracking across all regions',
                  'Auto-suspend drivers when safety score drops below threshold',
                  'Cargo weight validation blocks overloading before dispatch',
                  'Maintenance locking prevents dispatch of vehicles under repair',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mt-0.5 flex-shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                      <CheckCircle size={13} className="text-emerald-400" weight="fill" />
                    </div>
                    <span className="text-sm text-gray-400 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="relative bg-[#060611] py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-8 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-300 font-bold tracking-wide mb-5">
                <Gear size={12} weight="fill" />
                <span>Simple Workflow</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
                <span className="text-white">Three Steps to</span><br />
                <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Full Control</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector */}
              <div className="hidden md:block absolute top-20 left-[18%] right-[18%] h-[2px] bg-gradient-to-r from-violet-500/50 via-indigo-500/50 to-cyan-500/50" />

              {[
                { step: '01', icon: Users, title: 'Register Fleet & Drivers', desc: 'Add vehicles with specs and costs. Register drivers with licenses and safety scores.', gradient: 'from-violet-500 to-violet-600' },
                { step: '02', icon: MapTrifold, title: 'Dispatch & Monitor', desc: 'Create trips, assign resources. The system auto-validates all business rules.', gradient: 'from-indigo-500 to-indigo-600' },
                { step: '03', icon: PresentationChart, title: 'Analyze & Optimize', desc: 'Review ROI per vehicle, fuel efficiency, and export CSV reports.', gradient: 'from-cyan-500 to-cyan-600' },
              ].map((item, i) => (
                <div key={i} className="float-3d relative flex flex-col items-center text-center p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-xl relative z-10`}>
                    <item.icon size={28} className="text-white" weight="fill" />
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">Step {item.step}</span>
                  <h3 className="text-xl font-heading font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ROLE-BASED ACCESS ═══ */}
        <section className="relative bg-[#0a0a1f] py-28 overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[180px] pointer-events-none" />

          <div className="max-w-7xl mx-auto w-full px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs text-violet-300 font-bold tracking-wide mb-5">
                <Lock size={12} weight="fill" />
                <span>Access Control</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
                <span className="text-white">Tailored for</span>{' '}
                <span className="gradient-text-animated">Every Role</span>
              </h2>
            </div>

            <div className="perspective-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { role: 'Fleet Manager', icon: Wrench, desc: 'Full CRUD access to vehicles, drivers, trips, and maintenance logs.', gradient: 'from-violet-500 to-violet-600' },
                { role: 'Driver', icon: MapTrifold, desc: 'View dispatched orders, log fuel refills, and track distance metrics.', gradient: 'from-amber-500 to-orange-500' },
                { role: 'Safety Officer', icon: ShieldCheckered, desc: 'Monitor license expiry dates and issue safety score deductions.', gradient: 'from-emerald-500 to-teal-500' },
                { role: 'Financial Analyst', icon: ChartLineUp, desc: 'Analyze fuel efficiency, expenditures, and vehicle ROI analytics.', gradient: 'from-cyan-500 to-blue-500' },
              ].map((item, i) => (
                <div key={i} className="float-3d shine-on-hover p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm group cursor-default">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon size={22} className="text-white" weight="fill" />
                  </div>
                  <h4 className="text-base font-heading font-bold text-white mb-2">{item.role}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="relative bg-[#060611] py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 font-bold tracking-wide mb-5">
                <Star size={12} weight="fill" />
                <span>Testimonials</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">
                <span className="text-white">Trusted by</span>{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Industry Leaders</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Rajesh Patel', role: 'Fleet Manager, TransCargo', quote: 'TransitOps reduced our fleet downtime by 40%. The automated maintenance locking is a game-changer.', rating: 5 },
                { name: 'Ananya Sharma', role: 'Safety Officer, QuickShip', quote: 'Safety scores with auto-suspension cut road incidents by 60% in our first quarter. Incredible tool.', rating: 5 },
                { name: 'Vikram Singh', role: 'CFO, National Freight Corp', quote: 'Per-vehicle ROI analytics helped us save ₹18 Lakhs in six months by retiring underperformers.', rating: 5 },
              ].map((t, i) => (
                <div key={i} className="float-3d p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm flex flex-col justify-between">
                  <div>
                    <Quotes size={28} className="text-violet-500/30 mb-4" weight="fill" />
                    <p className="text-sm text-gray-400 leading-relaxed italic">"{t.quote}"</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">{t.name}</span>
                      <span className="text-xs text-gray-500 font-medium">{t.role}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={13} className="text-amber-400" weight="fill" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="relative z-10 px-8 py-20 bg-[#0a0a1f]">
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-cyan-500/20 border border-violet-500/20 p-12 md:p-20 text-center relative overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
            <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 space-y-7">
              <h2 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tight leading-tight">
                Ready to Transform<br />
                <span className="gradient-text-animated">Your Fleet Ops?</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                Join hundreds of logistics teams already using TransitOps to cut costs, improve safety, and maximize utilization.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setView('login')}
                  className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-2xl shadow-violet-600/30 hover:shadow-violet-500/50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-violet-500/30"
                >
                  <span>Get Started Free</span>
                  <ArrowUpRight size={18} weight="bold" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
                <button 
                  onClick={() => setView('login')}
                  className="px-10 py-4 rounded-2xl border border-white/15 text-gray-300 font-bold text-base flex items-center justify-center gap-2 hover:bg-white/[0.05] transition-all cursor-pointer backdrop-blur-sm"
                >
                  <span>Try Demo Mode</span>
                  <Sparkle size={18} weight="fill" className="text-violet-400" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-white/[0.06] bg-[#060611] relative z-10">
          <div className="max-w-7xl mx-auto w-full px-8 py-14">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
              <div className="md:col-span-1 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-md">
                    <Sparkle size={14} weight="fill" className="text-white" />
                  </div>
                  <span className="font-heading font-bold text-lg text-white">TransitOps</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enterprise-grade fleet management for modern logistics operations.
                </p>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Platform</span>
                <div className="flex flex-col gap-2">
                  {['Vehicle Registry', 'Driver Management', 'Trip Dispatch', 'Maintenance', 'Expenses', 'ROI Reports'].map((item, i) => (
                    <span key={i} className="text-sm text-gray-500 hover:text-violet-400 transition-colors cursor-pointer font-medium">{item}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Access Roles</span>
                <div className="flex flex-col gap-2">
                  {['Fleet Manager', 'Driver Portal', 'Safety Officer', 'Financial Analyst'].map((item, i) => (
                    <span key={i} className="text-sm text-gray-500 hover:text-violet-400 transition-colors cursor-pointer font-medium">{item}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Built With</span>
                <div className="flex flex-col gap-2">
                  {['React 19', 'Firebase Firestore', 'TailwindCSS 4', 'Vite 8', 'Phosphor Icons'].map((item, i) => (
                    <span key={i} className="text-sm text-gray-500 font-medium">{item}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-600">© 2026 TransitOps Operations Inc. All rights reserved.</p>
              <p className="text-xs text-gray-600">Built for Odoo Hackathon '26 🚀</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }


  // --- VIEW 2: LOGIN / GATEWAY PAGE ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex items-center justify-center p-6 relative">
        {/* Decorative background orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-200/25 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-slate-200/80 p-8 rounded-3xl shadow-2xl backdrop-blur-lg relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setView('landing')}
              className="flex items-center gap-1.5 text-violet-600 hover:text-violet-750 font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Live Database Mode
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="mx-auto h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-650 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-2">
              <Sparkle size={22} weight="fill" className="text-white" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500">
              Log in to access your operations dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
              {error}
            </div>
          )}

          {/* SIGN IN FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="manager@transitops.com"
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                />
                <EnvelopeSimple size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                />
                <LockSimple size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md shadow-violet-600/10"
            >
              {formLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW 3: MAIN PLATFORM APP ---
  return (
    <div className="flex bg-[#f8fafc] text-[#1e293b] min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Top Header Navigation */}
        <header className="h-16 border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-violet-50 text-violet-750 border border-violet-100 uppercase tracking-wide">
              {userRole} Mode
            </span>
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              ({currentUser?.email})
            </span>
            <button
              onClick={() => setUserRole(prev => prev === 'Manager' ? 'Driver' : 'Manager')}
              className="text-[10px] bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer active:scale-95 border border-violet-200/50"
            >
              Toggle Role (Dev Tools)
            </button>
          </div>
          
          <button
            onClick={() => {
              logout();
              setView('landing');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-55 hover:bg-red-100 hover:text-red-700 text-red-600 font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <span>Sign Out</span>
          </button>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto bg-gray-50/50">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

// Access Denied Fallback UI
function AccessDenied() {
  return (
    <div className="flex-grow flex items-center justify-center p-8 text-center bg-[#f8fafc] h-full">
      <div className="max-w-md p-6 bg-red-500/5 border border-red-200 rounded-2xl flex flex-col items-center shadow-lg shadow-red-500/5">
        <ShieldCheck size={40} className="text-red-500 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Your active system role does not have authorization to view this registry or execute operations on this data.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

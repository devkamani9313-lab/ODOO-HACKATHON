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
  Database
} from '@phosphor-icons/react';


function AppContent() {
  const { currentUser, userRole, login, signup, loginAsRole, logout, isDemoMode } = useAuth();
  
  // Navigation Routing States
  const [view, setView] = useState('landing'); // landing, login, signup, app
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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

  const handleDemoLogin = async (roleKey) => {
    setError('');
    setFormLoading(true);
    try {
      await loginAsRole(roleKey);
      setView('app');
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.message || 'Demo Login failed.');
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
      <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans selection:bg-violet-500/10 selection:text-violet-900 overflow-hidden relative">
        {/* Soft, beautiful, moving visual gradients in background */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-violet-200/40 to-fuchsia-200/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-cyan-200/30 to-indigo-200/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-rose-200/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        {/* Header */}
        <header className="px-8 py-5 border-b border-gray-200/60 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkle size={20} weight="fill" className="text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              TransitOps
            </span>
          </div>
          <span className="text-[10px] text-violet-600 font-bold uppercase tracking-widest bg-violet-50 border border-violet-100 rounded-full px-3.5 py-1">
            Enterprise Fleet Engine
          </span>
        </header>

        {/* Hero Section */}
        <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10 relative">
          {/* Left Hero copy */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-200 bg-violet-50 text-xs text-violet-600 font-bold tracking-wide">
              <Sparkle size={12} weight="fill" />
              <span>Smart Transport Operations Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading font-medium tracking-tight text-gray-900 leading-[1.05]">
              Seamless Fleet <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent font-bold">
                Management
              </span>
            </h1>

            <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-xl">
              Digitize dispatch logs, maintenance routines, fuel expenditures, and driver safety scores into a high-fidelity visual interface.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setView('login')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-violet-600/20 hover:shadow-violet-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Launch Operations</span>
                <CaretRight size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Right Hero: Colorful Collage & Mock Floating Widgets */}
          <div className="lg:col-span-6 relative flex items-center justify-center h-[450px]">
            {/* Visual background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3rem_3rem] rounded-3xl" />
            
            {/* 3D Stacked Colorful Images */}
            <div className="w-full max-w-md relative">
              {/* Image 1: Colorful Port / Shipping */}
              <div className="w-64 aspect-[4/3] rounded-3xl overflow-hidden border border-white/60 shadow-2xl relative rotate-[-6deg] z-10 bg-white p-2">
                <img 
                  src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600" 
                  alt="Logistics container port"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              {/* Image 2: Colorful Truck Cargo */}
              <div className="w-64 aspect-[4/3] rounded-3xl overflow-hidden border border-white/60 shadow-2xl absolute right-0 top-16 rotate-[8deg] z-20 bg-white p-2">
                <img 
                  src="https://images.unsplash.com/photo-1516576885230-101c031beeb4?auto=format&fit=crop&q=80&w=600" 
                  alt="Logistics fleet trucking"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              {/* Floating Dashboard Widget 1 */}
              <div className="absolute -left-6 bottom-4 z-30 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-xl flex items-center gap-3 animate-float-slow">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Fleet Status</span>
                  <span className="text-sm font-bold text-gray-800">98.5% Utilized</span>
                </div>
              </div>

              {/* Floating Dashboard Widget 2 */}
              <div className="absolute -right-6 -top-6 z-30 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-xl flex items-center gap-3 animate-float-medium">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <TrendUp size={20} className="text-violet-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Cost Savings</span>
                  <span className="text-sm font-bold text-gray-800">+₹12,450 Saved</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200/60 py-8 px-6 text-center text-xs text-gray-500 max-w-7xl mx-auto w-full">
          <p>© 2026 TransitOps Operations Inc. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // --- VIEW 2: LOGIN / GATEWAY PAGE ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex items-center justify-center p-6 relative">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-200/25 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-white/60 border border-white/50 p-8 rounded-3xl shadow-2xl backdrop-blur-lg relative z-10">
          
          {/* Left Column: Role Quick Selectors (Demo Access Mode) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <button 
                onClick={() => setView('landing')}
                className="flex items-center gap-1.5 text-violet-600 hover:text-violet-700 mb-3 font-semibold text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to homepage</span>
              </button>
              <h2 className="text-3xl font-heading font-semibold text-gray-900 tracking-tight">One-Click Entry</h2>
              <p className="text-xs text-gray-500 mt-1">Select a role card to instantly log in using pre-seeded dashboard templates.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Manager Card */}
              <button 
                onClick={() => handleDemoLogin('Manager')}
                className="p-4 rounded-2xl border border-white bg-white/40 hover:bg-white hover:border-violet-300 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md hover:shadow-lg hover:shadow-violet-500/5 group"
              >
                <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500 group-hover:text-white transition-all">
                  <Wrench size={18} className="text-violet-600 group-hover:text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Fleet Manager</h4>
                <p className="text-[10.5px] text-gray-400 mt-1 leading-snug">Full CRUD access to vehicles, driver records, and maintenance logs.</p>
              </button>

              {/* Driver Card */}
              <button 
                onClick={() => handleDemoLogin('Driver')}
                className="p-4 rounded-2xl border border-white bg-white/40 hover:bg-white hover:border-amber-300 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md hover:shadow-lg hover:shadow-amber-500/5 group"
              >
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <MapTrifold size={18} className="text-amber-600 group-hover:text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Driver Portal</h4>
                <p className="text-[10.5px] text-gray-400 mt-1 leading-snug">View and execute dispatched orders, log fuel refills and distance metrics.</p>
              </button>

              {/* Safety Officer Card */}
              <button 
                onClick={() => handleDemoLogin('Safety')}
                className="p-4 rounded-2xl border border-white bg-white/40 hover:bg-white hover:border-emerald-300 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md hover:shadow-lg hover:shadow-emerald-500/5 group"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Users size={18} className="text-emerald-600 group-hover:text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Safety Officer</h4>
                <p className="text-[10.5px] text-gray-400 mt-1 leading-snug">Audit license expiry alerts and issue safety score infraction deductions.</p>
              </button>

              {/* Financial Analyst Card */}
              <button 
                onClick={() => handleDemoLogin('Analyst')}
                className="p-4 rounded-2xl border border-white bg-white/40 hover:bg-white hover:border-cyan-300 text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md hover:shadow-lg hover:shadow-cyan-500/5 group"
              >
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                  <PresentationChart size={18} className="text-cyan-600 group-hover:text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Financial Analyst</h4>
                <p className="text-[10.5px] text-gray-400 mt-1 leading-snug">Examine fuel efficiencies, operational expenditures, and vehicle ROI logs.</p>
              </button>
            </div>
          </div>

          {/* Right Column: Secure Email/Password Login Form */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-lg space-y-6">
            <div>
              <h3 className="text-xl font-heading font-semibold text-gray-900">Manual Sign In</h3>
              <p className="text-xs text-gray-500 mt-0.5">Enter authorized employee credentials.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-600 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. employee@transitops.com"
                    className="w-full bg-gray-55 border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm text-gray-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                  <EnvelopeSimple size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-55 border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm text-gray-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                  <LockSimple size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-550 text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center shadow-md shadow-violet-600/10"
              >
                {formLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Removed public signup option. Accounts must be registered by a Manager. */}
          </div>

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

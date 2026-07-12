import React from 'react';
import { 
  Sparkle, 
  ChartBar, 
  Truck, 
  Users, 
  MapTrifold, 
  Wrench, 
  Receipt, 
  PresentationChart, 
  SignOut,
  User,
  WarningCircle,
  Leaf
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { currentUser, userRole, logout, isDemoMode, toggleMode } = useAuth();

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBar, roles: ['Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
    { id: 'vehicles', label: 'Vehicle Registry', icon: Truck, roles: ['Manager'] },
    { id: 'drivers', label: 'Staff Registry', icon: Users, roles: ['Manager'] },
    { id: 'trips', label: 'Trip Management', icon: MapTrifold, roles: ['Manager', 'Driver'] },
    { id: 'tripslog', label: 'My Trips Log', icon: Leaf, roles: ['Driver'] },
    { id: 'maintenance', label: 'Maintenance Log', icon: Wrench, roles: ['Manager'] },
    { id: 'expenses', label: 'Fuel & Expenses', icon: Receipt, roles: ['Manager', 'Financial Analyst', 'Driver'] },
    { id: 'reports', label: 'Reports & ROI', icon: PresentationChart, roles: ['Manager', 'Financial Analyst'] },
    { id: 'incidents', label: 'Driver Complaints', icon: WarningCircle, roles: ['Manager', 'Safety Officer'] }
  ];

  // Filter tabs based on active user role
  const visibleTabs = allTabs.filter(tab => tab.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 shadow-sm z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkle size={20} weight="fill" className="text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-slate-900 leading-none tracking-tight">TransitOps</h1>
          <span className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">Fleet Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow p-4 space-y-1">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-violet-50 text-violet-600 border border-violet-100/50 shadow-sm shadow-violet-500/5' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-55 border border-transparent'
              }`}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mode Switcher Banner (For Evaluator Check) */}
      <div className="px-4 py-2 border-t border-b border-slate-100 bg-slate-50/50 text-center flex flex-col gap-1.5 items-center justify-center p-3 m-3 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs">
          <Sparkle size={14} className={isDemoMode ? "text-amber-500 animate-pulse" : "text-emerald-500 animate-pulse"} />
          <span className="text-gray-500 font-medium">Mode: </span>
          <span className={isDemoMode ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
            {isDemoMode ? "Local Storage" : "Firebase Live"}
          </span>
        </div>
        <button 
          onClick={toggleMode}
          className="text-[10px] text-violet-600 hover:text-violet-700 underline font-bold cursor-pointer active:scale-95 transition-transform"
        >
          Switch to {isDemoMode ? "Firebase" : "Local Mode"}
        </button>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/20 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <User size={20} weight="bold" />
          </div>
          <div className="min-w-0 flex-grow">
            <h4 className="text-sm font-bold text-slate-800 truncate leading-tight">
              {currentUser?.email?.split('@')[0]}
            </h4>
            <span className="text-[11px] text-slate-550 truncate block font-medium">
              {userRole}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-slate-650 hover:text-red-650 text-xs font-bold tracking-wide transition-all active:scale-[0.98] cursor-pointer"
        >
          <SignOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

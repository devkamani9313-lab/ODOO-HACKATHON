import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  MapPin, 
  UserGear, 
  Car,
  Hourglass,
  WarningCircle,
  Wrench,
  CheckCircle,
  Funnel
} from '@phosphor-icons/react';
import { getVehicles, getDrivers, getTrips, getFuelLogs, getExpenses } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { isDemoMode, userRole } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        const [v, d, t, f, e] = await Promise.all([
          getVehicles(isDemoMode),
          getDrivers(isDemoMode),
          getTrips(isDemoMode),
          getFuelLogs(isDemoMode),
          getExpenses(isDemoMode)
        ]);
        setVehicles(v);
        setDrivers(d);
        setTrips(t);
        setFuelLogs(f);
        setExpenses(e);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isDemoMode]);

  // Apply filters to vehicles first (all KPIs are derived from filtered list)
  const filteredVehicles = vehicles.filter(v => {
    const matchType = filterType === 'All' || v.type === filterType;
    const matchStatus = filterStatus === 'All' || v.status === filterStatus;
    // Default region to 'North' if not specified for mock data compatibility
    const vRegion = v.region || 'North';
    const matchRegion = filterRegion === 'All' || vRegion === filterRegion;
    return matchType && matchStatus && matchRegion;
  });

  // Calculate KPIs based on filtered vehicles
  const totalVehiclesCount = filteredVehicles.length;
  const activeVehiclesCount = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const availableVehiclesCount = filteredVehicles.filter(v => v.status === 'Available').length;
  const maintenanceVehiclesCount = filteredVehicles.filter(v => v.status === 'In Shop').length;

  // Filter trips based on selected vehicle filters (matching vehicle specifications)
  const filteredVehicleIds = new Set(filteredVehicles.map(v => v.id));
  const relevantTrips = trips.filter(t => filteredVehicleIds.has(t.vehicleId) || totalVehiclesCount === 0);

  const activeTripsCount = relevantTrips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = relevantTrips.filter(t => t.status === 'Draft').length;

  // Drivers calculations (unfiltered by vehicle type for accuracy)
  const activeDriverIds = new Set(trips.filter(t => t.status === 'Dispatched').map(t => t.driverId));
  const driversOnDutyCount = drivers.filter(d => d.status === 'On Trip' || activeDriverIds.has(d.id)).length;

  // Fleet Utilization Calculation
  const fleetUtilization = totalVehiclesCount > 0 
    ? Math.round((activeVehiclesCount / totalVehiclesCount) * 100) 
    : 0;

  // Safety compliance details (for Safety Officer card)
  const expiredLicenseCount = drivers.filter(d => {
    if (!d.licenseExpiryDate) return true;
    return new Date(d.licenseExpiryDate) < new Date();
  }).length;
  
  const lowSafetyScoreCount = drivers.filter(d => d.safetyScore < 70).length;

  // Cost metrics (for Financial Analyst card)
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (Number(log.cost) || 0), 0);
  const totalOtherExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.cost) || 0), 0);
  const totalOperationalCost = totalFuelCost + totalOtherExpenses;

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#f8fafc] h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
          <span className="text-slate-500 text-sm font-semibold">Loading fleet analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Operations Dashboard</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time status updates and fleet utilization analysis.</p>
        </div>

        {/* Dynamic Filters Section */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-100/50 p-2.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            <Funnel size={14} />
            <span>Filters</span>
          </div>

          {/* Type Filter */}
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Container">Container</option>
            <option value="Car">Car</option>
          </select>

          {/* Status Filter */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          {/* Region Filter */}
          <select 
            value={filterRegion} 
            onChange={(e) => setFilterRegion(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="All">All Regions</option>
            <option value="North">North Region</option>
            <option value="South">South Region</option>
            <option value="East">East Region</option>
            <option value="West">West Region</option>
          </select>
        </div>
      </div>

      {/* KPI Grid Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Active Vehicles */}
        <div className="premium-card-violet p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Active Vehicles</span>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 shadow-sm flex items-center justify-center">
              <Car size={20} className="text-violet-650" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-heading font-bold text-slate-900 font-mono">{activeVehiclesCount}</h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">Status: On active route</span>
          </div>
        </div>

        {/* KPI 2: Available Vehicles */}
        <div className="premium-card-emerald p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Available Vehicles</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 shadow-sm flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-655" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-heading font-bold text-slate-900 font-mono">{availableVehiclesCount}</h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">Ready for dispatch</span>
          </div>
        </div>

        {/* KPI 3: In Maintenance */}
        <div className="premium-card-amber p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">In Maintenance</span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 shadow-sm flex items-center justify-center">
              <Wrench size={20} className="text-amber-655" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-heading font-bold text-slate-900 font-mono">{maintenanceVehiclesCount}</h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">Currently in shop</span>
          </div>
        </div>

        {/* KPI 4: Active / Pending Trips */}
        <div className="premium-card-cyan p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Trips Queue</span>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 shadow-sm flex items-center justify-center">
              <Hourglass size={20} className="text-cyan-650" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-heading font-bold text-slate-900 font-mono">
              {activeTripsCount} <span className="text-lg text-slate-455 font-normal">/ {pendingTripsCount}</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold block mt-1">Dispatched / Drafted</span>
          </div>
        </div>

      </div>

      {/* Main Panel Grid: Balanced double columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (1/3 Width) - Holds Utilization and Safety Alerts */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* Fleet Utilization Card */}
          <div className="premium-card-slate p-8 rounded-2xl flex flex-col items-center justify-between hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="text-left w-full">
              <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Fleet Utilization</h3>
              <span className="text-slate-450 text-xs mt-1 block">Active vehicles ratio of total fleet.</span>
            </div>

            <div className="relative flex items-center justify-center my-6 h-44 w-44">
              {/* SVG Progress Circle */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-slate-100" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-violet-600 transition-all duration-1000 ease-out" 
                  strokeWidth="9" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * fleetUtilization) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <h2 className="text-4xl font-heading font-bold text-slate-900 leading-none font-mono">{fleetUtilization}%</h2>
                <span className="text-[10px] uppercase tracking-wider text-slate-455 font-bold block mt-1">Utilization</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div className="text-center bg-white border border-slate-150 p-3 rounded-xl shadow-sm">
                <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">Total Vehicles</span>
                <span className="text-lg font-bold text-slate-800 mt-1 block font-mono">{totalVehiclesCount}</span>
              </div>
              <div className="text-center bg-white border border-slate-150 p-3 rounded-xl shadow-sm">
                <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">On Duty Drivers</span>
                <span className="text-lg font-bold text-slate-800 mt-1 block font-mono">{driversOnDutyCount}</span>
              </div>
            </div>
          </div>

          {/* Compliance & Safety Alerts Card (Manager or Safety Officer) */}
          {(userRole === 'Manager' || userRole === 'Safety Officer') && (
            <div className="premium-card-red p-6 rounded-2xl hover:shadow-xl hover:shadow-red-500/5 hover:-translate-y-0.5 transition-all duration-300 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-red-100/50">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shadow-sm">
                  <WarningCircle size={20} className="text-red-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Compliance & Safety</h3>
                  <p className="text-xs text-slate-450 mt-0.5 font-medium">Expiring licenses and operator alerts.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/20 border border-red-200/50 text-center shadow-sm">
                  <span className="text-[9.5px] text-red-800 uppercase font-bold block">Expired Licenses</span>
                  <span className="text-2xl font-bold text-red-650 mt-1.5 block font-mono">{expiredLicenseCount}</span>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/20 border border-amber-200/50 text-center shadow-sm">
                  <span className="text-[9.5px] text-amber-800 uppercase font-bold block">Low Safety Scores</span>
                  <span className="text-2xl font-bold text-amber-700 mt-1.5 block font-mono">{lowSafetyScoreCount}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (2/3 Width) - Holds Deliveries and Expenses */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Active Deliveries Card (Manager or Driver) */}
          {(userRole === 'Manager' || userRole === 'Driver') && (
            <div className="premium-card-violet p-6 rounded-2xl hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-violet-100/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shadow-sm">
                    <MapPin size={20} className="text-violet-650" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Active Deliveries</h3>
                    <p className="text-xs text-slate-455 mt-0.5 font-medium">Currently monitoring dispatched shipments.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-750 border border-violet-200">
                  {relevantTrips.filter(t => t.status === 'Dispatched').length} Active
                </span>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-violet-100 shadow-sm bg-white/50">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead className="text-[10px] text-slate-455 uppercase tracking-wider font-bold bg-violet-500/[0.03] border-b border-violet-100/65">
                    <tr>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Driver</th>
                      <th className="py-3 px-4">Route</th>
                      <th className="py-3 px-4 text-right">Cargo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {relevantTrips.filter(t => t.status === 'Dispatched').slice(0, 3).map(trip => (
                      <tr key={trip.id} className="hover:bg-violet-50/20 transition-colors">
                        <td className="py-3 px-4 text-slate-900 font-bold text-xs">{trip.vehicleName}</td>
                        <td className="py-3 px-4 text-xs">{trip.driverName}</td>
                        <td className="py-3 px-4 text-xs truncate max-w-[200px]">{trip.source} → {trip.destination}</td>
                        <td className="py-3 px-4 text-right text-xs font-mono font-bold text-violet-700">{trip.cargoWeight} kg</td>
                      </tr>
                    ))}
                    {relevantTrips.filter(t => t.status === 'Dispatched').length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 px-4 text-center text-xs text-slate-455 font-medium bg-white">No active shipments in transit.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Operational Expense Breakdown Card (Manager or Financial Analyst) */}
          {(userRole === 'Manager' || userRole === 'Financial Analyst') && (
            <div className="premium-card-emerald p-6 rounded-2xl hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-sm">
                    <Coins size={20} className="text-emerald-655" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Financial Overview</h3>
                    <p className="text-xs text-slate-455 mt-0.5 font-medium">Real-time expenditure summaries of fleet activities.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/20 border border-slate-200/60 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Fuel Logs</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1.5 font-mono">₹{totalFuelCost.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/20 border border-slate-200/60 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Other Costs</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1.5 font-mono">₹{totalOtherExpenses.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/20 border border-emerald-250/60 text-center shadow-sm">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Total Cost</span>
                  <span className="text-lg font-bold text-emerald-700 block mt-1.5 font-mono">₹{totalOperationalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

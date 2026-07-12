import React, { useState, useEffect } from 'react';
import { Leaf, Gauge, Tree, Globe, Lightbulb, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { getVehicles, getDrivers, getTrips } from '../services/dataManager';
import { generateTripReportPDF } from '../utils/generateTripReportPDF';

export default function DriverTripsLog() {
  const { isDemoMode, currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportToast, setReportToast] = useState(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [v, d, t] = await Promise.all([
          getVehicles(isDemoMode),
          getDrivers(isDemoMode),
          getTrips(isDemoMode)
        ]);
        setVehicles(v);
        setDrivers(d);
        setTrips(t);
      } catch (err) {
        console.error("Failed to load trips log data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isDemoMode]);

  // Find current driver
  const driverNameFromEmail = currentUser?.email?.split('@')[0]?.toLowerCase() || '';
  const currentDriver = drivers.find(d => 
    d.id === currentUser?.uid || 
    d.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
    (d.name && d.name.toLowerCase().includes(driverNameFromEmail))
  );

  // Filter trips for this driver
  const driverTrips = trips.filter(t => 
    t.driverId === currentDriver?.id || 
    t.driverId === currentUser?.uid ||
    (t.driverName && t.driverName.toLowerCase().includes(driverNameFromEmail))
  );

  const completedDriverTrips = driverTrips.filter(t => t.status === 'Completed');

  // Helper: Calculate trip distance
  const calculateTripDistance = (trip) => {
    if (trip.actualOdometer && trip.startOdometer !== undefined) {
      const diff = Number(trip.actualOdometer) - Number(trip.startOdometer);
      if (diff > 0) return diff;
    }
    return Number(trip.plannedDistance) || 0;
  };

  // Helper: Calculate CO2 emissions
  const calculateTripCO2 = (trip) => {
    const tripVehicle = vehicles.find(v => v.id === trip.vehicleId);
    const vType = tripVehicle?.type || 'Truck';
    const isHeavy = vType === 'Truck' || vType === 'Container';
    const factor = isHeavy ? 2.68 : 2.31;
    
    if (trip.fuelConsumed && Number(trip.fuelConsumed) > 0) {
      return Number(trip.fuelConsumed) * factor;
    }
    
    let standardLitersPerKm = 0.35;
    if (vType === 'Container') standardLitersPerKm = 0.40;
    else if (vType === 'Van') standardLitersPerKm = 0.15;
    else if (vType === 'Car') standardLitersPerKm = 0.08;
    
    const distance = calculateTripDistance(trip);
    return distance * standardLitersPerKm * factor;
  };

  // Report generation handler
  const handleGenerateTripReport = (trip) => {
    try {
      const vehicle = vehicles.find(v => v.name === trip.vehicleName || v.id === trip.vehicleId) || {};
      generateTripReportPDF(trip, currentUser || {}, vehicle);
    } catch (err) {
      setReportToast('Unable to generate report.');
      setTimeout(() => setReportToast(null), 3500);
    }
  };

  // Aggregate metrics
  const totalDistanceDriven = completedDriverTrips.reduce((sum, t) => sum + calculateTripDistance(t), 0);
  const totalFuelConsumed = completedDriverTrips.reduce((sum, t) => sum + (Number(t.fuelConsumed) || 0), 0);
  const totalCO2Emitted = completedDriverTrips.reduce((sum, t) => sum + calculateTripCO2(t), 0);
  const treesToOffset = Math.ceil(totalCO2Emitted / 22) || 0;
  const avgFuelEfficiency = totalDistanceDriven > 0 ? (totalFuelConsumed / totalDistanceDriven * 100).toFixed(1) : '—';

  const ecoTips = [
    {
      title: "Reduce Idling Time",
      description: "Idling for just 10 minutes consumes 0.3 liters of fuel. Turn off your engine during loading and unloading delays.",
      stat: "Potential CO2 reduction: up to 10%"
    },
    {
      title: "Maintain Steady Speeds",
      description: "Aggressive acceleration and hard braking increase fuel consumption by 30% on highways and 5% in city transit.",
      stat: "Potential CO2 reduction: up to 15%"
    },
    {
      title: "Maintain Tire Pressure",
      description: "Under-inflated tires increase rolling resistance, consuming 3% more fuel and causing higher engine load.",
      stat: "Potential CO2 reduction: up to 3%"
    },
    {
      title: "Optimal Load Balancing",
      description: "Overloading or uneven weight distribution forces the engine to work harder, increasing tailpipe emissions.",
      stat: "Potential CO2 reduction: up to 8%"
    },
    {
      title: "Use Aerodynamic Settings",
      description: "Keep window glass rolled up and cargo tarpaulins tight at highway speeds to minimize drag coefficient.",
      stat: "Potential CO2 reduction: up to 5%"
    }
  ];

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#f8fafc] h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
          <span className="text-slate-500 text-sm font-semibold">Loading trips log...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">My Trips Log</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Monitoring fuel efficiency and CO2 footprint per dispatch.</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card-slate p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200">
              <Globe size={18} className="text-violet-600" weight="fill" />
            </div>
            <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Total Distance</span>
          </div>
          <span className="text-2xl font-heading font-bold text-slate-900">{totalDistanceDriven.toLocaleString()} km</span>
          <span className="text-[10px] text-slate-400 font-medium">{completedDriverTrips.length} completed trips</span>
        </div>

        <div className="premium-card-slate p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
              <Gauge size={18} className="text-amber-600" weight="fill" />
            </div>
            <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Fuel Consumed</span>
          </div>
          <span className="text-2xl font-heading font-bold text-slate-900">{totalFuelConsumed.toLocaleString()} L</span>
          <span className="text-[10px] text-slate-400 font-medium">Avg: {avgFuelEfficiency} L/100km</span>
        </div>

        <div className="premium-card-slate p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center border border-red-200">
              <Lightbulb size={18} className="text-red-500" weight="fill" />
            </div>
            <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">CO2 Emitted</span>
          </div>
          <span className="text-2xl font-heading font-bold text-slate-900">{totalCO2Emitted.toFixed(1)} kg</span>
          <span className="text-[10px] text-slate-400 font-medium">Carbon footprint total</span>
        </div>

        <div className="premium-card-slate p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <Tree size={18} className="text-emerald-600" weight="fill" />
            </div>
            <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Trees to Offset</span>
          </div>
          <span className="text-2xl font-heading font-bold text-slate-900">{treesToOffset}</span>
          <span className="text-[10px] text-slate-400 font-medium">Based on 22 kg CO2/tree/year</span>
        </div>
      </div>

      {/* Eco Tips */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Leaf size={16} className="text-emerald-500" weight="fill" />
            <h3 className="text-sm font-heading font-bold text-slate-700 uppercase tracking-wider">Eco Driving Tips</h3>
          </div>
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => setCurrentTipIndex(prev => (prev - 1 + ecoTips.length) % ecoTips.length)}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-55 text-slate-655 transition-colors cursor-pointer active:scale-90"
            >
              <CaretLeft size={16} />
            </button>
            <span className="text-[10px] font-bold text-slate-400 px-1 font-mono">
              {currentTipIndex + 1}/{ecoTips.length}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentTipIndex(prev => (prev + 1) % ecoTips.length)}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-55 text-slate-655 transition-colors cursor-pointer active:scale-90"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/50 space-y-2">
          <h4 className="text-sm font-bold text-amber-900">{ecoTips[currentTipIndex].title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{ecoTips[currentTipIndex].description}</p>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded w-fit block mt-1">
            {ecoTips[currentTipIndex].stat}
          </span>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-slate-900 font-heading font-bold text-lg">Trip History</h3>
          <p className="text-xs text-slate-455 mt-0.5 font-medium">All dispatched routes with fuel efficiency and CO2 metrics.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm bg-white/50">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="text-[10px] text-slate-455 uppercase tracking-wider font-bold bg-slate-500/[0.03] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Fuel Burned</th>
                <th className="py-3 px-4">CO2 Output</th>
                <th className="py-3 px-4 text-right">Rating</th>
                <th className="py-3 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {driverTrips.map(trip => {
                const dist = trip.status === 'Completed' ? calculateTripDistance(trip) : Number(trip.plannedDistance) || 0;
                const fuel = trip.status === 'Completed' ? (Number(trip.fuelConsumed) || 0) : 0;
                const co2 = calculateTripCO2(trip);
                const isEco = dist > 0 && (co2 / dist) < 0.5;

                return (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-xs">
                      <div className="font-bold text-slate-900">{trip.source} → {trip.destination}</div>
                      <div className="text-[9.5px] text-slate-400 font-normal mt-0.5">Status: {trip.status}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-800">{trip.vehicleName}</td>
                    <td className="py-3 px-4 text-xs font-mono">{dist.toLocaleString()} km</td>
                    <td className="py-3 px-4 text-xs font-mono">{trip.status === 'Completed' ? `${fuel} L` : '—'}</td>
                    <td className="py-3 px-4 text-xs font-mono font-bold text-slate-900">{co2.toFixed(1)} kg</td>
                    <td className="py-3 px-4 text-right">
                      {trip.status === 'Completed' ? (
                        isEco ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-emerald-50 text-emerald-600 border-emerald-100">
                            <Leaf size={10} weight="fill" />
                            <span>Eco-Route</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-slate-50 text-slate-500 border-slate-200">
                            <span>Standard</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-violet-50 text-violet-600 border-violet-100 animate-pulse">
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {trip.status === 'Completed' ? (
                        <button
                          type="button"
                          onClick={() => handleGenerateTripReport(trip)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 shadow-sm hover:shadow transition-all duration-300 cursor-pointer active:scale-95"
                        >
                          Generate Trip Report (PDF)
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {driverTrips.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 px-4 text-center text-xs text-slate-455 font-medium bg-white">No routes logged. Get dispatched to see your carbon metrics!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Toast */}
      {reportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <span>{reportToast}</span>
        </div>
      )}
    </div>
  );
}

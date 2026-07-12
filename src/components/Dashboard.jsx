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
  Funnel,
  Leaf,
  Tree,
  Gauge,
  CaretLeft,
  CaretRight,
  GasPump,
  Globe,
  Lightbulb,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning
} from '@phosphor-icons/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getVehicles, getDrivers, getTrips, getFuelLogs, getExpenses, getIncidents, getMaintenanceLogs } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';
import { FleetManagerCharts, DriverCharts, FinancialAnalystCharts, SafetyOfficerCharts } from './DashboardCharts';
import { generateTripReportPDF } from '../utils/generateTripReportPDF';

// Pseudo-random seed weather generator utilizing geographical coordinate models
function generateMockWeather(locationName, lat, lon, dateString) {
  const getSeed = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getSeed(locationName + dateString);
  const month = parseInt(dateString.split('-')[1]) || 6; // default to June

  // Determine weather type probability based on month (monsoon: June-Sept)
  let condition = 'Sunny';
  let rand = seed % 100;
  
  if (month >= 6 && month <= 9) {
    if (rand < 50) condition = 'Rainy';
    else if (rand < 80) condition = 'Thunderstorm';
    else condition = 'Cloudy';
  } else if (month === 12 || month === 1 || month === 2) {
    if (rand < 40) condition = 'Cloudy';
    else condition = 'Sunny';
  } else {
    if (rand < 15) condition = 'Cloudy';
    else if (rand < 25) condition = 'Rainy';
    else condition = 'Sunny';
  }

  // Base min/max temperatures based on latitude and month
  let baseMin = 22;
  let baseMax = 32;

  // Heuristics mapping coordinates to actual climate zones across India
  if (lat > 25) {
    // North India (Srinagar, Delhi, etc.)
    if (month === 12 || month === 1 || month === 2) {
      baseMin = Math.max(2, Math.round(15 - (lat - 25) * 2));
      baseMax = Math.max(12, Math.round(25 - (lat - 25) * 1.5));
    } else if (month >= 5 && month <= 7) {
      baseMin = 26;
      baseMax = Math.min(45, Math.round(38 + (lat - 25) * 0.5));
    } else {
      baseMin = 16;
      baseMax = 28;
    }
  } else if (lat < 15) {
    // South India (Bengaluru, Chennai, etc. stable tropical)
    baseMin = 22 + (month === 12 || month === 1 ? -2 : 0);
    baseMax = 32 + (month >= 3 && month <= 5 ? 3 : 0);
    
    // Altitude check (like Bengaluru)
    if (locationName.toLowerCase().includes('bengaluru') || locationName.toLowerCase().includes('bangalore') || (lat > 12 && lat < 14 && lon > 77 && lon < 78)) {
      baseMin -= 4;
      baseMax -= 3;
    }
  } else {
    // Central/Coastal India (Mumbai, Kolkata, Pune)
    baseMin = 23;
    baseMax = 33;
    if (month === 12 || month === 1) {
      baseMin = 18;
      baseMax = 28;
    }
    if (locationName.toLowerCase().includes('pune')) {
      baseMin -= 2;
      baseMax -= 1;
    }
  }

  const hourly = [];
  const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
  
  hours.forEach(hour => {
    let timeOffset = 0;
    if (hour === 6) timeOffset = 0;
    else if (hour === 8) timeOffset = 2;
    else if (hour === 10) timeOffset = 5;
    else if (hour === 12) timeOffset = 8;
    else if (hour === 14) timeOffset = 10;
    else if (hour === 16) timeOffset = 9;
    else if (hour === 18) timeOffset = 6;
    else if (hour === 20) timeOffset = 3;
    else if (hour === 22) timeOffset = 1;

    let hourTemp = baseMin + Math.round((baseMax - baseMin) * (timeOffset / 10));
    hourTemp += (seed + hour) % 3 - 1;

    let rainChance = 0;
    if (condition === 'Rainy') {
      rainChance = 60 + ((seed + hour) % 40);
    } else if (condition === 'Thunderstorm') {
      rainChance = 80 + ((seed + hour) % 20);
    } else if (condition === 'Cloudy') {
      rainChance = 20 + ((seed + hour) % 30);
    } else {
      rainChance = ((seed + hour) % 10);
    }

    hourly.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp: hourTemp,
      rain: rainChance
    });
  });

  const avgTemp = Math.round(hourly.reduce((sum, h) => sum + h.temp, 0) / hourly.length);
  const maxTemp = Math.max(...hourly.map(h => h.temp));
  const minTemp = Math.min(...hourly.map(h => h.temp));

  let humidity = 60 + (seed % 30);
  let windSpeed = 10 + (seed % 25);
  if (condition === 'Rainy' || condition === 'Thunderstorm') {
    humidity = 85 + (seed % 15);
    windSpeed = 20 + (seed % 30);
  }

  return {
    location: locationName,
    date: dateString,
    condition,
    avgTemp,
    maxTemp,
    minTemp,
    humidity,
    windSpeed,
    hourly
  };
}

export default function Dashboard() {
  const { isDemoMode, userRole, currentUser } = useAuth();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [weatherDate, setWeatherDate] = useState(new Date().toISOString().split('T')[0]);
  const [weatherLocationInput, setWeatherLocationInput] = useState('Mumbai');
  const [selectedWeatherLoc, setSelectedWeatherLoc] = useState({ name: 'Mumbai', lat: 19.0760, lon: 72.8777 });
  const [weatherSuggestions, setWeatherSuggestions] = useState([]);
  const [showWeatherSuggestions, setShowWeatherSuggestions] = useState(false);
  const [weatherReport, setWeatherReport] = useState(null);
  
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportToast, setReportToast] = useState(null);

  const handleGenerateTripReport = (trip) => {
    try {
      const vehicle = vehicles.find(v => v.name === trip.vehicleName || v.id === trip.vehicleId) || {};
      generateTripReportPDF(trip, currentUser || {}, vehicle);
    } catch (err) {
      setReportToast('Unable to generate report.');
      setTimeout(() => setReportToast(null), 3500);
    }
  };

  // Filters State
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        const [v, d, t, f, e, inc, ml] = await Promise.all([
          getVehicles(isDemoMode),
          getDrivers(isDemoMode),
          getTrips(isDemoMode),
          getFuelLogs(isDemoMode),
          getExpenses(isDemoMode),
          getIncidents(isDemoMode),
          getMaintenanceLogs(isDemoMode)
        ]);
        setVehicles(v);
        setDrivers(d);
        setTrips(t);
        setFuelLogs(f);
        setExpenses(e);
        setIncidents(inc);
        setMaintenanceLogs(ml);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isDemoMode]);

  // Set default weather location once trips and drivers are loaded
  useEffect(() => {
    if (userRole === 'Driver' && trips.length > 0 && drivers.length > 0) {
      const driverNameFromEmail = currentUser?.email?.split('@')[0]?.toLowerCase() || '';
      const currentDriver = drivers.find(d => 
        d.id === currentUser?.uid || 
        d.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
        (d.name && d.name.toLowerCase().includes(driverNameFromEmail))
      );
      if (currentDriver) {
        const driverTrips = trips.filter(t => 
          t.driverId === currentDriver.id || 
          t.driverId === currentUser?.uid ||
          (t.driverName && t.driverName.toLowerCase().includes(driverNameFromEmail))
        );
        const activeTrip = driverTrips.find(t => t.status === 'Dispatched');
        if (activeTrip && activeTrip.destination) {
          const city = activeTrip.destination.split(',')[0].trim();
          setWeatherLocationInput(city);
          let defLat = 19.0760, defLon = 72.8777;
          if (city.toLowerCase().includes('delhi')) { defLat = 28.7041; defLon = 77.1025; }
          else if (city.toLowerCase().includes('bengaluru') || city.toLowerCase().includes('bangalore')) { defLat = 12.9716; defLon = 77.5946; }
          else if (city.toLowerCase().includes('chennai')) { defLat = 13.0827; defLon = 80.2707; }
          else if (city.toLowerCase().includes('kolkata')) { defLat = 22.5726; defLon = 88.3639; }
          else if (city.toLowerCase().includes('pune')) { defLat = 18.5204; defLon = 73.8567; }
          setSelectedWeatherLoc({ name: city, lat: defLat, lon: defLon });
        } else {
          setWeatherLocationInput('Mumbai');
          setSelectedWeatherLoc({ name: 'Mumbai', lat: 19.0760, lon: 72.8777 });
        }
      } else {
        setWeatherLocationInput('Mumbai');
        setSelectedWeatherLoc({ name: 'Mumbai', lat: 19.0760, lon: 72.8777 });
      }
    }
  }, [trips, drivers, userRole, currentUser]);

  // Search autocompletion list for Indian cities from Nominatim API
  useEffect(() => {
    if (userRole !== 'Driver') return;
    if (weatherLocationInput.length < 3) {
      setWeatherSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(weatherLocationInput)}&countrycodes=in&limit=5`);
        const data = await res.json();
        setWeatherSuggestions(data || []);
      } catch (err) {
        console.error("Failed to query Indian locations", err);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [weatherLocationInput, userRole]);

  // Auto fetch weather on coordinate/date change
  useEffect(() => {
    if (userRole === 'Driver' && selectedWeatherLoc && weatherDate) {
      const report = generateMockWeather(selectedWeatherLoc.name, selectedWeatherLoc.lat, selectedWeatherLoc.lon, weatherDate);
      setWeatherReport(report);
    }
  }, [selectedWeatherLoc, weatherDate, userRole]);

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

  const avgSafetyScore = drivers.length > 0
    ? Math.round(drivers.reduce((sum, d) => sum + Number(d.safetyScore || 0), 0) / drivers.length)
    : 100;

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

  if (userRole === 'Driver') {
    const driverNameFromEmail = currentUser?.email?.split('@')[0]?.toLowerCase() || '';
    const currentDriver = drivers.find(d => 
      d.id === currentUser?.uid || 
      d.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
      (d.name && d.name.toLowerCase().includes(driverNameFromEmail))
    );

    const driverTrips = trips.filter(t => 
      t.driverId === currentDriver?.id || 
      t.driverId === currentUser?.uid ||
      (t.driverName && t.driverName.toLowerCase().includes(driverNameFromEmail))
    );

    const completedDriverTrips = driverTrips.filter(t => t.status === 'Completed');
    const activeDriverTrip = driverTrips.find(t => t.status === 'Dispatched');

    const calculateTripDistance = (trip) => {
      if (trip.actualOdometer && trip.startOdometer !== undefined) {
        const diff = Number(trip.actualOdometer) - Number(trip.startOdometer);
        if (diff > 0) return diff;
      }
      return Number(trip.plannedDistance) || 0;
    };

    const totalDistanceDriven = completedDriverTrips.reduce((sum, t) => sum + calculateTripDistance(t), 0);
    const totalFuelConsumed = completedDriverTrips.reduce((sum, t) => sum + (Number(t.fuelConsumed) || 0), 0);

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

    const totalCO2Emitted = completedDriverTrips.reduce((sum, t) => sum + calculateTripCO2(t), 0);
    const treesToOffset = Math.ceil(totalCO2Emitted / 22) || 0;

    const safetyScoreComponent = Number(currentDriver?.safetyScore || 100);
    
    let fuelEfficiencyScore = 100;
    if (totalDistanceDriven > 0 && totalFuelConsumed > 0) {
      const avgLitersPer100Km = (totalFuelConsumed / totalDistanceDriven) * 100;
      const benchmarkLitersPer100Km = 25; 
      const ratio = benchmarkLitersPer100Km / avgLitersPer100Km;
      fuelEfficiencyScore = Math.min(100, Math.max(10, Math.round(ratio * 100)));
    }
    
    const ecoDrivingScore = Math.round(safetyScoreComponent * 0.4 + fuelEfficiencyScore * 0.6);

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

    return (
      <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto animate-fade-in">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-indigo-850 rounded-3xl p-8 text-white relative overflow-hidden border border-white/[0.08] shadow-xl shadow-violet-955/15">
          <div className="absolute top-[-30%] right-[-10%] w-[300px] h-[300px] bg-violet-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[200px] h-[200px] bg-cyan-500/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] text-violet-300 font-bold uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full border border-white/10">Driver Command Center</span>
              <h2 className="text-3xl font-heading font-bold tracking-tight">Hello, {currentDriver?.name || currentUser?.email?.split('@')[0]}</h2>
              <p className="text-violet-200/70 text-sm font-medium">Keep driving green. Monitor your fuel metrics and CO2 score in real-time.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Leaf size={22} className="text-emerald-400" weight="fill" />
              </div>
              <div>
                <span className="text-[9px] text-violet-300 uppercase font-bold tracking-wider block">Eco Efficiency</span>
                <span className="text-lg font-bold text-emerald-400">
                  {ecoDrivingScore >= 90 ? 'A+ Champion' : ecoDrivingScore >= 80 ? 'A Eco Driver' : ecoDrivingScore >= 70 ? 'B Eco Driver' : 'Standard'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Dispatch</span>
              <MapPin size={20} className="text-violet-650" />
            </div>
            <div className="mt-3">
              <span className="text-sm font-bold text-slate-900 block truncate">
                {activeDriverTrip ? `${activeDriverTrip.source} → ${activeDriverTrip.destination}` : 'Ready for Dispatch'}
              </span>
              <span className="text-[10.5px] text-slate-455 font-medium block mt-0.5">
                {activeDriverTrip ? `Vehicle: ${activeDriverTrip.vehicleName}` : 'Awaiting next route assignment'}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Distance</span>
              <Globe size={20} className="text-cyan-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 block font-mono">{totalDistanceDriven.toLocaleString()} km</span>
              <span className="text-[10.5px] text-slate-455 font-medium block mt-0.5">Across {completedDriverTrips.length} completed trips</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Safety Rating</span>
              <Gauge size={20} className="text-amber-500" />
            </div>
            <div className="mt-3">
              <span className={`text-2xl font-bold block font-mono ${
                safetyScoreComponent >= 90 ? 'text-emerald-655' : safetyScoreComponent >= 70 ? 'text-amber-700' : 'text-red-650'
              }`}>{safetyScoreComponent}/100</span>
              <span className="text-[10.5px] text-slate-455 font-medium block mt-0.5">Safe speeds & smooth braking</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Carbon Footprint</span>
              <Leaf size={20} className="text-emerald-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-700 block font-mono">{totalCO2Emitted.toFixed(1)} kg CO2</span>
              <span className="text-[10.5px] text-emerald-800 font-medium block mt-0.5">Estimated cumulative emissions</span>
            </div>
          </div>
        </div>

        {/* CO2 Tracker Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carbon Score Circular Gauge */}
          <div className="lg:col-span-1 bg-white border border-slate-200/80 p-8 rounded-2xl flex flex-col items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="text-left w-full">
              <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Eco Driving Score</h3>
              <span className="text-slate-455 text-xs mt-1 block">Weighted fuel efficiency and safety index.</span>
            </div>

            <div className="relative flex items-center justify-center my-6 h-44 w-44">
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
                  className={`transition-all duration-1000 ease-out ${
                    ecoDrivingScore >= 85 
                      ? 'stroke-emerald-500' 
                      : ecoDrivingScore >= 70 
                      ? 'stroke-amber-500' 
                      : 'stroke-red-500'
                  }`}
                  strokeWidth="9" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * ecoDrivingScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <h2 className="text-4xl font-heading font-bold text-slate-900 leading-none font-mono">{ecoDrivingScore}%</h2>
                <span className="text-[10px] uppercase tracking-wider text-slate-455 font-bold block mt-1">Carbon Score</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div className="text-center bg-slate-50 border border-slate-150 p-3 rounded-xl shadow-sm">
                <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">Avg Economy</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block font-mono">
                  {totalDistanceDriven > 0 && totalFuelConsumed > 0 
                    ? `${(totalDistanceDriven / totalFuelConsumed).toFixed(1)} km/L` 
                    : 'N/A'}
                </span>
              </div>
              <div className="text-center bg-slate-50 border border-slate-150 p-3 rounded-xl shadow-sm">
                <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">CO2 / km</span>
                <span className="text-sm font-bold text-slate-855 mt-1 block font-mono">
                  {totalDistanceDriven > 0 
                    ? `${(totalCO2Emitted / totalDistanceDriven).toFixed(2)} kg` 
                    : '0.00 kg'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Forest Offset & Tip Carousel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Carbon Offset Visualizer */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="space-y-2 text-left flex-grow">
                <h3 className="text-slate-900 font-heading font-bold text-lg flex items-center gap-2">
                  <Tree size={22} className="text-emerald-500" weight="fill" />
                  <span>Carbon Forest Offset</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  A mature tree absorbs roughly 22 kg of CO2 annually. To offset your travel emissions of <strong className="text-slate-800">{totalCO2Emitted.toFixed(1)} kg</strong>, your personal forest requires:
                </p>
                <div className="flex items-center gap-2 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 w-fit">
                  <span className="text-2xl font-bold font-mono text-emerald-700">{treesToOffset}</span>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Mature Trees</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2.5 max-w-[200px] justify-center bg-slate-55 p-4 rounded-2xl border border-slate-200/60 min-w-[150px]">
                {treesToOffset === 0 ? (
                  <div className="text-xs text-slate-400 font-medium italic text-center py-4">No offset required yet. Start a trip to grow your forest!</div>
                ) : (
                  <>
                    {Array.from({ length: Math.min(treesToOffset, 12) }).map((_, i) => (
                      <Tree key={i} size={24} className="text-emerald-600 animate-bounce" weight="fill" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                    {treesToOffset > 12 && (
                      <div className="text-[10px] font-bold text-emerald-700 self-center pl-1 font-mono">+{treesToOffset - 12} more</div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Eco-Driving Tip Carousel */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 font-heading font-bold text-lg flex items-center gap-2">
                  <Lightbulb size={22} className="text-amber-500" weight="fill" />
                  <span>Eco-Driving Insights</span>
                </h3>
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
              
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/50 space-y-2 min-h-[110px] flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-900">{ecoTips[currentTipIndex].title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ecoTips[currentTipIndex].description}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded w-fit block mt-1">
                  {ecoTips[currentTipIndex].stat}
                </span>
              </div>
            </div>
          </div>
        </div>        {/* Weather Forecast Section */}
        {(() => {
          const getWeatherIcon = (cond) => {
            switch (cond) {
              case 'Sunny': return <Sun size={48} className="text-amber-500 animate-pulse" weight="fill" />;
              case 'Cloudy': return <Cloud size={48} className="text-slate-400 animate-pulse" weight="fill" />;
              case 'Rainy': return <CloudRain size={48} className="text-cyan-500 animate-bounce" weight="fill" />;
              case 'Thunderstorm': return <CloudLightning size={48} className="text-violet-650 animate-pulse" weight="fill" />;
              default: return <Sun size={48} className="text-amber-500" />;
            }
          };

          const getWeatherWarning = (cond) => {
            switch (cond) {
              case 'Rainy':
                return {
                  title: "Slippery Road Conditions",
                  text: "Rain detected. Braking distances are increased. Reduce speeds by 15-20% and avoid hard braking.",
                  bg: "bg-cyan-50/70 border-cyan-200 text-cyan-800",
                  icon: <WarningCircle size={18} className="text-cyan-600 animate-pulse" />
                };
              case 'Thunderstorm':
                return {
                  title: "Severe Weather Hazard Alert",
                  text: "Active thunderstorms in route. Watch out for crosswinds, waterlogged sections, and sudden downpours. Maintain a high safety distance.",
                  bg: "bg-red-50/70 border-red-200 text-red-800",
                  icon: <WarningCircle size={18} className="text-red-500 animate-pulse" />
                };
              case 'Cloudy':
                return {
                  title: "Overcast Visibility Alert",
                  text: "Overcast skies might decrease visibility. Ensure daytime running lamps are turned on.",
                  bg: "bg-slate-50/80 border-slate-200 text-slate-700",
                  icon: <WarningCircle size={18} className="text-slate-500" />
                };
              default:
                return {
                  title: "Optimal Travel Conditions",
                  text: "Clear, sunny skies reported. Visibility index is high. Safe travels!",
                  bg: "bg-emerald-50/70 border-emerald-200 text-emerald-800",
                  icon: <CheckCircle size={18} className="text-emerald-600" />
                };
            }
          };

          const handleSelectWeatherLocation = (item) => {
            const cityName = item.display_name.split(',')[0].trim();
            setWeatherLocationInput(item.display_name);
            setSelectedWeatherLoc({
              name: cityName,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            });
            setShowWeatherSuggestions(false);
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Weather Form & Current Overview */}
              <div className="lg:col-span-1 bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Route Weather Forecast</h3>
                    <p className="text-slate-455 text-xs mt-1 block">Search any city/hub across India for seasonal forecast updates.</p>
                  </div>

                  {/* Form inputs */}
                  <div className="space-y-3 text-xs relative">
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Search City (India)</label>
                      <input 
                        type="text"
                        value={weatherLocationInput}
                        onChange={(e) => {
                          setWeatherLocationInput(e.target.value);
                          setShowWeatherSuggestions(true);
                        }}
                        onBlur={() => setTimeout(() => setShowWeatherSuggestions(false), 250)}
                        placeholder="Type city name (e.g. Pune, Srinagar)..."
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 font-semibold"
                      />
                      {/* Geocoding Dropdown Suggestions */}
                      {showWeatherSuggestions && weatherSuggestions.length > 0 && (
                        <ul className="absolute z-[999] top-[55px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {weatherSuggestions.map((item) => (
                            <li 
                              key={item.place_id} 
                              onMouseDown={() => handleSelectWeatherLocation(item)}
                              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 font-medium truncate"
                            >
                              {item.display_name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Forecast Date</label>
                      <input 
                        type="date"
                        value={weatherDate}
                        onChange={(e) => setWeatherDate(e.target.value)}
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 font-semibold cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Weather Overview Summary */}
                {weatherReport && (
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getWeatherIcon(weatherReport.condition)}
                      <div>
                        <span className="text-2xl font-bold font-mono text-slate-800">{weatherReport.avgTemp}°C</span>
                        <span className="text-xs font-semibold text-slate-500 block mt-0.5">{weatherReport.condition}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-505 text-right space-y-1">
                      <div>Max/Min: <strong className="font-mono text-slate-800">{weatherReport.maxTemp}°C / {weatherReport.minTemp}°C</strong></div>
                      <div>Humidity: <strong className="font-mono text-slate-800">{weatherReport.humidity}%</strong></div>
                      <div>Wind: <strong className="font-mono text-slate-800">{weatherReport.windSpeed} km/h</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Weather Area Chart & Advisory */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Hourly Weather Trend</h3>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider truncate max-w-[200px]" title={selectedWeatherLoc?.name}>
                      {selectedWeatherLoc?.name} • {weatherDate}
                    </span>
                  </div>

                  {/* Dynamic Advisory Box */}
                  {weatherReport && (() => {
                    const adv = getWeatherWarning(weatherReport.condition);
                    return (
                      <div className={`p-4 rounded-xl border flex items-start gap-3 ${adv.bg}`}>
                        <div className="mt-0.5 flex-shrink-0">{adv.icon}</div>
                        <div>
                          <h4 className="text-xs font-bold font-heading">{adv.title}</h4>
                          <p className="text-[11px] mt-0.5 leading-relaxed font-medium">{adv.text}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Recharts Area Chart */}
                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weatherReport?.hourly || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '10px' }}
                          labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                        />
                        <Area type="monotone" dataKey="temp" name="Temp (°C)" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#tempGradient)" />
                        <Area type="monotone" dataKey="rain" name="Rain (%)" stroke="#06b6d4" strokeWidth={1} fillOpacity={1} fill="url(#rainGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Trips Log */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-slate-900 font-heading font-bold text-lg">My Trips Log</h3>
            <p className="text-xs text-slate-455 mt-0.5 font-medium">Monitoring fuel efficiency and CO2 footprint per dispatch.</p>
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
                {driverTrips.slice(0, 8).map(trip => {
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
                            aria-label={`Generate Trip Report (PDF) for trip from ${trip.source} to ${trip.destination}`}
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

        {/* Driver Analytics Charts */}
        <DriverCharts trips={trips} />

        {/* Error Toast Notification */}
        {reportToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <span>{reportToast}</span>
          </div>
        )}
      </div>
    );
  }

  if (userRole === 'Safety Officer') {
    const activeComplaintsCount = incidents.filter(i => i.status !== 'Resolved').length;

    return (
      <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Safety Overview</h2>
          <p className="text-slate-550 text-sm font-medium">Real-time operator behavior tracking, incident logs, and safety audits.</p>
        </div>

        {/* Safety Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expired Licenses</span>
            <span className="text-2xl font-bold text-red-650 block mt-1">{expiredLicenseCount}</span>
          </div>
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Low Safety Scores (&lt;70)</span>
            <span className="text-2xl font-bold text-amber-700 block mt-1">{lowSafetyScoreCount}</span>
          </div>
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Safety Rating</span>
            <span className="text-2xl font-bold text-slate-800 block mt-1">{avgSafetyScore}/100</span>
          </div>
          <div className="p-5 rounded-2xl border border-violet-100 bg-violet-50/70 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">Active Complaints</span>
            <span className="text-2xl font-bold text-violet-755 block mt-1">{activeComplaintsCount}</span>
          </div>
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (1/3 Width) - Safety Circular Gauge */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div className="premium-card-slate p-8 rounded-2xl flex flex-col items-center justify-between hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300">
              <div className="text-left w-full">
                <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Fleet Safety Rating</h3>
                <span className="text-slate-455 text-xs mt-1 block">Average driver compliance score.</span>
              </div>

              <div className="relative flex items-center justify-center my-6 h-44 w-44">
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
                    className={`transition-all duration-1000 ease-out ${
                      avgSafetyScore >= 85 
                        ? 'stroke-emerald-500' 
                        : avgSafetyScore >= 70 
                        ? 'stroke-amber-500' 
                        : 'stroke-red-500'
                    }`}
                    strokeWidth="9" 
                    fill="transparent" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * avgSafetyScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <h2 className="text-4xl font-heading font-bold text-slate-900 leading-none font-mono">{avgSafetyScore}%</h2>
                  <span className="text-[10px] uppercase tracking-wider text-slate-455 font-bold block mt-1">Safety Score</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div className="text-center bg-white border border-slate-150 p-3 rounded-xl shadow-sm">
                  <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">Total Drivers</span>
                  <span className="text-lg font-bold text-slate-800 mt-1 block font-mono">{drivers.length}</span>
                </div>
                <div className="text-center bg-white border border-slate-150 p-3 rounded-xl shadow-sm">
                  <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">Alerts Triggered</span>
                  <span className="text-lg font-bold text-slate-850 mt-1 block font-mono">{lowSafetyScoreCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (2/3 Width) - Recent Critical Safety violations */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div>
              <h3 className="text-slate-900 font-heading font-bold text-lg">Critical Safety Infractions</h3>
              <p className="text-xs text-slate-450 mt-0.5 font-medium">Recent high or critical severity driver behavior flags.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-650">
                <thead className="text-slate-455 uppercase tracking-wider border-b border-slate-100 font-bold">
                  <tr>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Driver</th>
                    <th className="py-2.5">Infraction</th>
                    <th className="py-2.5">Severity</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {incidents.filter(i => i.severity === 'Critical' || i.severity === 'High').slice(0, 5).map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono">{inc.date}</td>
                      <td className="py-3 text-slate-900 font-bold">{inc.driverName}</td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-850">{inc.category}</div>
                        <div className="text-[9.5px] text-slate-400 font-normal truncate max-w-[200px]" title={inc.description}>
                          {inc.description}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          inc.severity === 'Critical'
                            ? 'bg-red-50 text-red-650 border-red-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          inc.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : inc.status === 'Investigating'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            : 'bg-red-55 text-red-600 border-red-200'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {incidents.filter(i => i.severity === 'Critical' || i.severity === 'High').length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">No critical safety infractions registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Safety Officer Analytics Charts */}
        <SafetyOfficerCharts incidents={incidents} drivers={drivers} />
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

      {/* Fleet Manager Analytics Visualizations */}
      {(userRole === 'Manager' || !userRole || userRole === 'Fleet Manager') && (
        <FleetManagerCharts vehicles={vehicles} trips={trips} maintenanceLogs={maintenanceLogs} />
      )}

      {/* Financial Analyst Analytics Visualizations */}
      {(userRole === 'Financial Analyst' || userRole === 'Manager') && (
        <FinancialAnalystCharts expenses={expenses} fuelLogs={fuelLogs} trips={trips} />
      )}

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

          {/* Fleet Safety Score Card */}
          <div className="premium-card-slate p-8 rounded-2xl flex flex-col items-center justify-between hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="text-left w-full">
              <h3 className="text-slate-900 font-heading font-bold text-base leading-tight">Fleet Safety Rating</h3>
              <span className="text-slate-455 text-xs mt-1 block">Average driver compliance score.</span>
            </div>

            <div className="relative flex items-center justify-center my-6 h-44 w-44">
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
                  className={`transition-all duration-1000 ease-out ${
                    avgSafetyScore >= 85 
                      ? 'stroke-emerald-500' 
                      : avgSafetyScore >= 70 
                      ? 'stroke-amber-500' 
                      : 'stroke-red-500'
                  }`}
                  strokeWidth="9" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * avgSafetyScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <h2 className="text-4xl font-heading font-bold text-slate-900 leading-none font-mono">{avgSafetyScore}%</h2>
                <span className="text-[10px] uppercase tracking-wider text-slate-455 font-bold block mt-1">Safety Score</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div className="text-center bg-white border border-slate-150 p-3 rounded-xl shadow-sm">
                <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">Total Drivers</span>
                <span className="text-lg font-bold text-slate-800 mt-1 block font-mono">{drivers.length}</span>
              </div>
              <div className="text-center bg-white border border-slate-150 p-3 rounded-xl shadow-sm">
                <span className="text-[9.5px] text-slate-450 uppercase tracking-wide font-bold block">Alerts Triggered</span>
                <span className="text-lg font-bold text-slate-850 mt-1 block font-mono">{lowSafetyScoreCount}</span>
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

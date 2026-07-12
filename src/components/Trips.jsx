import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Funnel, Warning, CaretLeft, CaretRight, ShieldCheck } from '@phosphor-icons/react';
import { 
  getTrips, 
  getVehicles, 
  getDrivers, 
  createTrip, 
  dispatchTrip, 
  cancelTrip, 
  completeTrip, 
  isLicenseExpired,
  getMaintenanceLogs
} from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Trips() {
  const { isDemoMode, userRole, currentUser } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Trip Form Fields
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('');
  const [startOdometer, setStartOdometer] = useState('');

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);

  // Completion Form Fields
  const [activeTripId, setActiveTripId] = useState(null);
  const [activeTripOdometer, setActiveTripOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [petrolPrice, setPetrolPrice] = useState('');
  const [currentVehicleOdo, setCurrentVehicleOdo] = useState(0);

  const isDriver = userRole === 'Driver';
  const isManager = userRole === 'Manager';

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, vList, dList, mList] = await Promise.all([
        getTrips(isDemoMode),
        getVehicles(isDemoMode),
        getDrivers(isDemoMode),
        getMaintenanceLogs(isDemoMode)
      ]);
      
      if (isDriver) {
        const driverName = currentUser?.email?.split('@')[0]?.toLowerCase() || '';
        const filteredTrips = tList.filter(t => 
          t.driverName.toLowerCase().includes(driverName) || 
          t.driverId === currentUser.uid
        );
        setTrips(filteredTrips);
      } else {
        setTrips(tList);
      }

      setVehicles(vList);
      setDrivers(dList);
      setMaintenanceLogs(mList);
    } catch (err) {
      console.error("Failed to load operations list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode, userRole, currentUser]);

  const activeMaintenanceVehicleIds = new Set(
    maintenanceLogs
      .filter(log => log.status === 'Active')
      .map(log => log.vehicleId)
  );

  const availableVehicles = vehicles.filter(v => 
    v.status === 'Available' && 
    v.status !== 'Retired' && 
    v.status !== 'In Shop' &&
    v.status !== 'Maintenance' &&
    v.status !== 'Under Maintenance' &&
    !activeMaintenanceVehicleIds.has(v.id)
  );

  const availableDrivers = drivers.filter(d => 
    (d.role || 'Driver') === 'Driver' &&
    d.status === 'Available' && 
    d.status !== 'Suspended'
  );

  const openAddModal = () => {
    setError('');
    setSource('');
    setDestination('');
    setSelectedVehicleId(availableVehicles[0]?.id || '');
    setSelectedDriverId(availableDrivers[0]?.id || '');
    setCargoWeight('');
    setPlannedDistance('');
    setRevenue('');
    setStartOdometer('');
    setWizardStep(1);
    setModalOpen(true);
  };

  const openCompleteModal = (trip) => {
    setError('');
    setActiveTripId(trip.id);
    setFuelConsumed('');
    setFuelCost('');
    setPetrolPrice('100'); // default petrol price for quick entry
    
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const startOdo = vehicle ? vehicle.odometer : 0;
    setCurrentVehicleOdo(startOdo);
    
    setActiveTripOdometer((startOdo + trip.plannedDistance).toString());
    setCompleteModalOpen(true);
  };

  const handleNextStep = () => {
    setError('');
    
    if (wizardStep === 1) {
      if (!source.trim() || !destination.trim() || !plannedDistance || Number(plannedDistance) <= 0) {
        setError('Please enter a valid source, destination, and distance.');
        return;
      }
      if (!selectedVehicleId && availableVehicles.length > 0) {
        setSelectedVehicleId(availableVehicles[0].id);
      }
    } else if (wizardStep === 2) {
      if (!selectedVehicleId) {
        setError('Please select a vehicle.');
        return;
      }
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        setStartOdometer(vehicle.odometer.toString());
      }
      if (!selectedDriverId && availableDrivers.length > 0) {
        setSelectedDriverId(availableDrivers[0].id);
      }
    } else if (wizardStep === 3) {
      if (!selectedDriverId) {
        setError('Please select a driver.');
        return;
      }
    }
    
    setWizardStep(prev => prev + 1);
  };

  const isNextDisabled = () => {
    if (wizardStep === 1) {
      return !source.trim() || !destination.trim() || !plannedDistance || Number(plannedDistance) <= 0;
    }
    if (wizardStep === 2) {
      return !selectedVehicleId || availableVehicles.length === 0;
    }
    if (wizardStep === 3) {
      if (!selectedDriverId || availableDrivers.length === 0) return true;
      const d = drivers.find(item => item.id === selectedDriverId);
      if (d && isLicenseExpired(d.licenseExpiryDate)) return true;
      return false;
    }
    return false;
  };

  const isSubmitDisabled = () => {
    if (!cargoWeight || Number(cargoWeight) <= 0 || !revenue || Number(revenue) <= 0) {
      return true;
    }
    const v = vehicles.find(item => item.id === selectedVehicleId);
    if (v && Number(cargoWeight) > Number(v.maxCapacity)) {
      return true;
    }
    return false;
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError('');

    if (!source || !destination || !selectedVehicleId || !selectedDriverId || !cargoWeight || !plannedDistance || !revenue || !startOdometer) {
      setError('Please fill in all fields.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    const driver = drivers.find(d => d.id === selectedDriverId);

    const tripPayload = {
      source: source.trim(),
      destination: destination.trim(),
      vehicleId: selectedVehicleId,
      vehicleName: vehicle ? `${vehicle.regNumber} (${vehicle.name})` : 'Unknown Vehicle',
      driverId: selectedDriverId,
      driverName: driver ? driver.name : 'Unknown Driver',
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(plannedDistance),
      revenue: Number(revenue),
      startOdometer: Number(startOdometer)
    };

    try {
      await createTrip(isDemoMode, tripPayload);
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create trip.');
    }
  };

  const handleDispatch = async (tripId) => {
    try {
      await dispatchTrip(isDemoMode, tripId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to dispatch trip.');
    }
  };

  const handleCancel = async (tripId) => {
    if (window.confirm('Are you sure you want to cancel this active dispatch? This will release both driver and vehicle.')) {
      try {
        await cancelTrip(isDemoMode, tripId);
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to cancel trip.');
      }
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeTripOdometer || !fuelConsumed || !petrolPrice) {
      setError('Please fill in all completion parameters.');
      return;
    }

    if (Number(activeTripOdometer) <= currentVehicleOdo) {
      setError(`Final odometer must be greater than current vehicle odometer (${currentVehicleOdo} km).`);
      return;
    }

    try {
      const calculatedFuelCost = Number(fuelConsumed) * Number(petrolPrice);
      await completeTrip(isDemoMode, activeTripId, activeTripOdometer, fuelConsumed, calculatedFuelCost);
      setCompleteModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to log completion.');
    }
  };

  const getStatusColor = (tStatus) => {
    switch (tStatus) {
      case 'Draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Dispatched': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled': return 'bg-red-50 text-red-650 border-red-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Trip Dispatch</h2>
          <p className="text-slate-555 text-sm font-medium">Monitor active shipments, plan routing, and log delivery completion.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-600/10 cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span>Create Dispatch</span>
        </button>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Source → Destination</th>
                  <th className="px-6 py-4">Assigned Vehicle</th>
                  <th className="px-6 py-4">Assigned Driver</th>
                  <th className="px-6 py-4 text-right">Cargo Weight</th>
                  <th className="px-6 py-4 text-right">Planned Distance</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">
                      {trip.source} <span className="text-gray-400 mx-1">→</span> {trip.destination}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-700">
                      <div>{trip.vehicleName}</div>
                      {trip.status === 'Completed' && trip.startOdometer !== undefined && (
                        <div className="text-[9.5px] text-slate-450 mt-0.5 font-normal">
                          Odo: {trip.startOdometer.toLocaleString()} → {trip.actualOdometer.toLocaleString()} km
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">{trip.driverName}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-medium">{trip.cargoWeight} kg</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-medium">{trip.plannedDistance} km</td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-700">
                      <div className="font-bold text-emerald-600">₹{trip.revenue.toLocaleString()}</div>
                      {trip.status === 'Completed' && trip.fuelCost !== undefined && (
                        <div className="text-[10px] text-slate-450 mt-0.5 font-normal">
                          Profit: <span className="font-bold text-violet-700">₹{(trip.revenue - trip.fuelCost).toLocaleString()}</span>
                          <span className="block text-[8.5px] text-slate-400">(Fuel: ₹{trip.fuelCost.toLocaleString()})</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {trip.status === 'Draft' && (
                          <button
                            onClick={() => handleDispatch(trip.id)}
                            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm"
                          >
                            Dispatch
                          </button>
                        )}
                        {trip.status === 'Dispatched' && (
                          <>
                            <button
                              onClick={() => openCompleteModal(trip)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancel(trip.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(trip.status === 'Completed' || trip.status === 'Cancelled') && (
                          <span className="text-[11px] text-gray-400 font-bold">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No dispatch orders listed in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

          {/* Create Trip Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900">Create Dispatch Order</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Initialize routing, assign assets, and verify specifications.</p>
            </div>

            {/* Progress Step Indicator */}
            <div className="flex items-center justify-between pb-2">
              {[
                { label: 'Route', step: 1 },
                { label: 'Vehicle', step: 2 },
                { label: 'Driver', step: 3 },
                { label: 'Details', step: 4 }
              ].map((s, idx) => (
                <React.Fragment key={s.step}>
                  <div className="flex flex-col items-center space-y-1 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      wizardStep === s.step 
                        ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-600/20' 
                        : wizardStep > s.step 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {wizardStep > s.step ? <ShieldCheck size={16} weight="bold" /> : s.step}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide uppercase ${
                      wizardStep === s.step ? 'text-violet-600' : wizardStep > s.step ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 mx-2 -mt-4 transition-all ${
                      wizardStep > s.step ? 'bg-emerald-400' : 'bg-slate-100'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTrip} className="space-y-5 text-xs">
              
              {/* Step 1: Route Setup */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Source */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Source Location</label>
                      <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="e.g. Warehouse A"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Destination */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Destination Location</label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Retail Center 9"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Planned Distance */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Distance (km)</label>
                    <input
                      type="number"
                      value={plannedDistance}
                      onChange={(e) => setPlannedDistance(e.target.value)}
                      placeholder="e.g. 180"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Assign Vehicle */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Available Vehicle</label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold transition-colors"
                    >
                      {availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.regNumber} — {v.name}
                        </option>
                      ))}
                      {availableVehicles.length === 0 && (
                        <option value="" disabled>No available vehicles in fleet</option>
                      )}
                    </select>
                  </div>

                  {/* Selected Vehicle Info Card */}
                  {selectedVehicleId ? (() => {
                    const v = vehicles.find(item => item.id === selectedVehicleId);
                    if (!v) return null;
                    return (
                      <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100/80 space-y-2">
                        <div className="text-xs font-bold text-violet-800 uppercase tracking-wider">Vehicle Details</div>
                        <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600">
                          <div>Model: <span className="font-semibold text-slate-900">{v.name}</span></div>
                          <div>Reg Number: <span className="font-semibold text-slate-900 font-mono">{v.regNumber}</span></div>
                          <div>Capacity: <span className="font-semibold text-slate-900">{v.maxCapacity.toLocaleString()} kg</span></div>
                          <div>Odometer: <span className="font-semibold text-slate-900">{v.odometer.toLocaleString()} km</span></div>
                        </div>
                      </div>
                    );
                  })() : availableVehicles.length > 0 ? null : (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-semibold leading-relaxed flex items-start gap-2">
                      <Warning size={16} className="mt-0.5 flex-shrink-0" />
                      <span>All active vehicles are currently in use or under maintenance. You must release a vehicle from maintenance or wait for an active trip to finish.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Assign Driver */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Available Operator</label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold transition-colors"
                    >
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} (Score: {d.safetyScore}/100)
                        </option>
                      ))}
                      {availableDrivers.length === 0 && (
                        <option value="" disabled>No qualified drivers on duty</option>
                      )}
                    </select>
                  </div>

                  {/* Selected Operator Info Card */}
                  {selectedDriverId ? (() => {
                    const d = drivers.find(item => item.id === selectedDriverId);
                    if (!d) return null;
                    const expired = isLicenseExpired(d.licenseExpiryDate);
                    return (
                      <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-2">
                          <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Operator Details</div>
                          <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600">
                            <div>Name: <span className="font-semibold text-slate-900">{d.name}</span></div>
                            <div>Safety Score: <span className="font-semibold text-slate-900">{d.safetyScore}/100</span></div>
                            <div className="col-span-2">
                              License Expiry: <span className={`font-semibold ${expired ? 'text-red-650' : 'text-slate-900'}`}>{d.licenseExpiryDate || 'N/A'} {expired && '(Expired)'}</span>
                            </div>
                          </div>
                        </div>
                        {expired && (
                          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-650 font-semibold leading-relaxed flex items-start gap-2">
                            <Warning size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                            <span>This operator cannot be assigned because their license is expired. Please select a qualified operator.</span>
                          </div>
                        )}
                      </div>
                    );
                  })() : availableDrivers.length > 0 ? null : (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-semibold leading-relaxed flex items-start gap-2">
                      <Warning size={16} className="mt-0.5 flex-shrink-0" />
                      <span>No available drivers on duty. Ensure drivers are marked 'Available' and have valid licenses in the driver registry.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Details & Financials */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Cargo Weight */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cargo Load (kg)</label>
                      <input
                        type="number"
                        value={cargoWeight}
                        onChange={(e) => setCargoWeight(e.target.value)}
                        placeholder="e.g. 450"
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Revenue */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Money Charged (Revenue) (₹)</label>
                      <input
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(e.target.value)}
                        placeholder="e.g. 950"
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-emerald-600 font-bold focus:outline-none focus:border-violet-500 focus:bg-white transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Initial Odometer */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Initial Odometer Reading (km)</label>
                    <input
                      type="number"
                      required
                      value={startOdometer}
                      onChange={(e) => setStartOdometer(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-colors font-mono font-bold"
                    />
                  </div>

                  {/* Real-time check logic */}
                  {(() => {
                    const v = vehicles.find(item => item.id === selectedVehicleId);
                    if (v && cargoWeight && Number(cargoWeight) > Number(v.maxCapacity)) {
                      return (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-250 text-amber-700 font-semibold leading-relaxed flex items-start gap-2">
                          <Warning size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
                          <span>Warning: Cargo load ({Number(cargoWeight).toLocaleString()} kg) exceeds vehicle's maximum capacity ({v.maxCapacity.toLocaleString()} kg). You will not be able to dispatch until this is corrected.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  {wizardStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep(prev => prev - 1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-55 text-slate-650 font-bold cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                    >
                      <CaretLeft size={14} weight="bold" />
                      <span>Back</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-55 text-slate-550 font-bold cursor-pointer active:scale-95 transition-all"
                  >
                    Cancel
                  </button>

                  {wizardStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isNextDisabled()}
                      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-1 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-violet-600/10"
                    >
                      <span>Next</span>
                      <CaretRight size={14} weight="bold" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitDisabled()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-emerald-600/10"
                    >
                      <Check size={14} weight="bold" />
                      <span>Draft Order</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Verification Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setCompleteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
                <Check size={22} className="text-emerald-500 animate-pulse" weight="bold" />
                <span>Log Completion Audit</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Record final trip metrics and update vehicle odometer log.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              {/* Odometer */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Final Odometer Reading (km) — <span className="text-slate-400 lowercase font-normal">must exceed {currentVehicleOdo} km</span>
                </label>
                <input
                  type="number"
                  value={activeTripOdometer}
                  onChange={(e) => setActiveTripOdometer(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Fuel Consumed */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fuel Consumed (Liters)</label>
                  <input
                    type="number"
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                {/* Petrol/Diesel Price */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fuel Price (₹/Litre)</label>
                  <input
                    type="number"
                    value={petrolPrice}
                    onChange={(e) => setPetrolPrice(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Dynamic Fuel Cost Calculation Display */}
              {fuelConsumed && petrolPrice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl flex items-center justify-between">
                  <span className="font-semibold">Calculated Fuel Cost:</span>
                  <span className="font-mono font-bold text-base">₹{(Number(fuelConsumed) * Number(petrolPrice)).toLocaleString()}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-55 text-slate-500 font-bold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-600/10"
                >
                  <Check size={16} weight="bold" />
                  <span>Audit Completed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash, X, Check } from '@phosphor-icons/react';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Vehicles() {
  const { isDemoMode } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [error, setError] = useState('');

  // Form Fields
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Truck');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [status, setStatus] = useState('Available');
  const [region, setRegion] = useState('North');

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await getVehicles(isDemoMode);
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [isDemoMode]);

  const openAddModal = () => {
    setError('');
    setEditMode(false);
    setRegNumber('');
    setName('');
    setType('Truck');
    setMaxCapacity('');
    setOdometer('');
    setAcquisitionCost('');
    setStatus('Available');
    setRegion('North');
    setModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setError('');
    setEditMode(true);
    setActiveVehicleId(vehicle.id);
    setRegNumber(vehicle.regNumber);
    setName(vehicle.name);
    setType(vehicle.type);
    setMaxCapacity(vehicle.maxCapacity.toString());
    setOdometer(vehicle.odometer.toString());
    setAcquisitionCost(vehicle.acquisitionCost.toString());
    setStatus(vehicle.status);
    setRegion(vehicle.region || 'North');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regNumber || !name || !maxCapacity || !odometer || !acquisitionCost) {
      setError('Please fill in all fields.');
      return;
    }

    const vehicleData = {
      regNumber: regNumber.trim(),
      name: name.trim(),
      type,
      maxCapacity: Number(maxCapacity),
      odometer: Number(odometer),
      acquisitionCost: Number(acquisitionCost),
      status,
      region
    };

    try {
      if (editMode) {
        await updateVehicle(isDemoMode, activeVehicleId, vehicleData);
      } else {
        await addVehicle(isDemoMode, vehicleData);
      }
      setModalOpen(false);
      loadVehicles();
    } catch (err) {
      setError(err.message || 'An error occurred while saving.');
    }
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle from the registry?')) {
      try {
        await deleteVehicle(isDemoMode, vehicleId);
        loadVehicles();
      } catch (err) {
        alert(err.message || 'Failed to delete vehicle.');
      }
    }
  };

  const getStatusColor = (vStatus) => {
    switch (vStatus) {
      case 'Available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'On Trip': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'In Shop': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Retired': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Vehicle Registry</h2>
          <p className="text-slate-500 text-sm font-medium">Manage fleet assets, configurations, and status allocations.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-600/10 cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-50/50 via-white to-white border border-slate-200/85 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Reg Number</th>
                  <th className="px-6 py-4">Vehicle Model</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Region</th>
                  <th className="px-6 py-4 text-right">Max Load</th>
                  <th className="px-6 py-4 text-right">Odometer</th>
                  <th className="px-6 py-4 text-right">Acquisition</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-bold font-mono">{vehicle.regNumber}</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">{vehicle.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{vehicle.type}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{vehicle.region || 'North'}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-medium">{vehicle.maxCapacity.toLocaleString()} kg</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-medium">{vehicle.odometer.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-semibold text-slate-800">₹{vehicle.acquisitionCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
                          title="Edit Vehicle"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 border border-slate-200/60 text-slate-500 hover:text-red-600 transition-all cursor-pointer shadow-sm"
                          title="Delete Vehicle"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      No vehicles registered in the database. Click 'Register Vehicle' to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Modal Component */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900">
                {editMode ? 'Edit Vehicle Configuration' : 'Register New Vehicle'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure asset details and database triggers.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Reg Number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registration Number</label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    disabled={editMode}
                    placeholder="e.g. VAN-05"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white disabled:opacity-50 font-mono font-bold"
                  />
                </div>

                {/* Model Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vehicle Model</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Scania R500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asset Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Container">Container</option>
                    <option value="Car">Car</option>
                  </select>
                </div>

                {/* Region Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Operational Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="North">North Region</option>
                    <option value="South">South Region</option>
                    <option value="East">East Region</option>
                    <option value="West">West Region</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Max Load Capacity */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Max Capacity (kg)</label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                {/* Odometer */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Odometer (km)</label>
                  <input
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Acquisition Cost */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Acquisition (₹)</label>
                  <input
                    type="number"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    placeholder="e.g. 85000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-mono font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Status Selector (only in Edit mode for Managers) */}
              {editMode && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asset Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-violet-600/10"
                >
                  <Check size={16} weight="bold" />
                  <span>{editMode ? 'Save Changes' : 'Register'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

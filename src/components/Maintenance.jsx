import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Wrench, WarningCircle } from '@phosphor-icons/react';
import { getMaintenanceLogs, getVehicles, startMaintenance, closeMaintenance } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Maintenance() {
  const { isDemoMode } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Log Form Fields
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState('');

  // Closing Form Fields
  const [activeLogId, setActiveLogId] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [finalCost, setFinalCost] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [mList, vList] = await Promise.all([
        getMaintenanceLogs(isDemoMode),
        getVehicles(isDemoMode)
      ]);
      setLogs(mList);
      setVehicles(vList);
    } catch (err) {
      console.error("Failed to load maintenance database", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const activeVehicles = vehicles.filter(v => v.status !== 'Retired');

  const openAddModal = () => {
    setError('');
    setSelectedVehicleId(activeVehicles[0]?.id || '');
    setDescription('');
    setCost('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const openCloseModal = (log) => {
    setError('');
    setActiveLogId(log.id);
    setFinalCost(log.cost.toString());
    setEndDate(new Date().toISOString().split('T')[0]);
    setCloseModalOpen(true);
  };

  const handleStartLog = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedVehicleId || !description || !cost || !startDate) {
      setError('Please fill in all fields.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    const logPayload = {
      vehicleId: selectedVehicleId,
      vehicleName: vehicle ? `${vehicle.regNumber} (${vehicle.name})` : 'Unknown Vehicle',
      description: description.trim(),
      cost: Number(cost),
      startDate
    };

    try {
      await startMaintenance(isDemoMode, logPayload);
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to start maintenance.');
    }
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!endDate || !finalCost) {
      setError('Please fill in final audit details.');
      return;
    }

    try {
      await closeMaintenance(isDemoMode, activeLogId, endDate, finalCost);
      setCloseModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to close maintenance ticket.');
    }
  };

  const getStatusColor = (mStatus) => {
    return mStatus === 'Active' 
      ? 'bg-amber-50 text-amber-600 border-amber-100' 
      : 'bg-emerald-50 text-emerald-600 border-emerald-100';
  };

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Maintenance Records</h2>
          <p className="text-slate-500 text-sm font-medium">Schedule repairs, track operational maintenance history, and release assets.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-600/10 cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          <span>Schedule Service</span>
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
            <table className="w-full text-left text-sm text-slate-650">
              <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Service Description</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold font-mono text-xs">{log.vehicleName}</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold">{log.description}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-bold text-amber-600">₹{log.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-mono font-medium">{log.startDate}</td>
                    <td className="px-6 py-4 text-xs font-mono font-medium">{log.endDate || 'In Progress'}</td>
                    <td className="px-6 py-4 text-right">
                      {log.status === 'Active' ? (
                        <button
                          onClick={() => openCloseModal(log)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm"
                        >
                          Close Ticket
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <Check size={14} className="text-emerald-500" />
                          <span>Released</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No maintenance records in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Start Maintenance Modal */}
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
              <h3 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={22} className="text-violet-600" />
                <span>Schedule Vehicle Service</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">This will lock the vehicle to 'In Shop' status and block dispatches.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleStartLog} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Vehicle</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  >
                    {activeVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.regNumber} - {v.name} ({v.status})
                      </option>
                    ))}
                    {activeVehicles.length === 0 && (
                      <option value="" disabled>No active vehicles in fleet</option>
                    )}
                  </select>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  />
                </div>
              </div>

              {/* Cost Estimate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-amber-600 focus:outline-none focus:border-violet-500 focus:bg-white font-semibold font-mono text-base"
                />
              </div>

              {/* Service Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Service Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe repair or diagnostics requirements..."
                  rows="3"
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white resize-none"
                />
              </div>

              {activeVehicles.length === 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-semibold leading-relaxed flex items-start gap-2">
                  <WarningCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Registry has no vehicles to maintain. Register a vehicle first.</span>
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
                  disabled={activeVehicles.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-violet-600/10"
                >
                  <Check size={16} weight="bold" />
                  <span>Start Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Modal */}
      {closeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setCloseModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
                <Check size={22} className="text-emerald-500 animate-pulse" weight="bold" />
                <span>Close Service Ticket</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">This will release the vehicle to 'Available' and log the maintenance cost.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  />
                </div>

                {/* Final Cost */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Final Cost (₹)</label>
                  <input
                    type="number"
                    value={finalCost}
                    onChange={(e) => setFinalCost(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-emerald-650 focus:outline-none focus:border-violet-500 focus:bg-white font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-55 text-slate-500 font-bold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-600/10"
                >
                  <Check size={16} weight="bold" />
                  <span>Release Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

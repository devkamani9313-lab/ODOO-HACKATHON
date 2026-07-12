import React, { useState, useEffect } from 'react';
import { Plus, X, GasPump, Receipt, Check } from '@phosphor-icons/react';
import { getExpenses, getFuelLogs, getVehicles, addFuelLog, addExpense } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Expenses() {
  const { isDemoMode } = useAuth();
  
  const [expenses, setExpenses] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Fuel Form Fields
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  // Expense Form Fields
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState('Toll');
  const [expCost, setExpCost] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [eList, fList, vList] = await Promise.all([
        getExpenses(isDemoMode),
        getFuelLogs(isDemoMode),
        getVehicles(isDemoMode)
      ]);
      setExpenses(eList);
      setFuelLogs(fList);
      setVehicles(vList);
    } catch (err) {
      console.error("Failed to load financial logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const activeVehicles = vehicles.filter(v => v.status !== 'Retired');

  const openFuelModal = () => {
    setError('');
    setFuelVehicleId(activeVehicles[0]?.id || '');
    setLiters('');
    setFuelCost('');
    setFuelDate(new Date().toISOString().split('T')[0]);
    setFuelModalOpen(true);
  };

  const openExpenseModal = () => {
    setError('');
    setExpVehicleId(activeVehicles[0]?.id || '');
    setExpType('Toll');
    setExpCost('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpDesc('');
    setExpenseModalOpen(true);
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fuelVehicleId || !liters || !fuelCost || !fuelDate) {
      setError('Please fill in all fields.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === fuelVehicleId);
    const fuelPayload = {
      vehicleId: fuelVehicleId,
      vehicleName: vehicle ? `${vehicle.regNumber} (${vehicle.name})` : 'Unknown Vehicle',
      liters: Number(liters),
      cost: Number(fuelCost),
      date: fuelDate
    };

    try {
      await addFuelLog(isDemoMode, fuelPayload);
      
      await addExpense(isDemoMode, {
        vehicleId: fuelVehicleId,
        vehicleName: fuelPayload.vehicleName,
        type: 'Fuel',
        cost: Number(fuelCost),
        date: fuelDate,
        description: `Fuel refill: ${liters} Liters`
      });

      setFuelModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save fuel log.');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!expVehicleId || !expCost || !expDate || !expDesc) {
      setError('Please fill in all fields.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === expVehicleId);
    const expensePayload = {
      vehicleId: expVehicleId,
      vehicleName: vehicle ? `${vehicle.regNumber} (${vehicle.name})` : 'Unknown Vehicle',
      type: expType,
      cost: Number(expCost),
      date: expDate,
      description: expDesc.trim()
    };

    try {
      await addExpense(isDemoMode, expensePayload);
      setExpenseModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save expense log.');
    }
  };

  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
  const totalMaintenanceCost = expenses.filter(e => e.type === 'Maintenance').reduce((sum, exp) => sum + Number(exp.cost), 0);
  const totalTollsCost = expenses.filter(e => e.type === 'Toll').reduce((sum, exp) => sum + Number(exp.cost), 0);
  const totalOtherCost = expenses.filter(e => e.type === 'Other').reduce((sum, exp) => sum + Number(exp.cost), 0);
  
  const totalGeneralExpenses = expenses.filter(e => e.type !== 'Fuel').reduce((sum, exp) => sum + Number(exp.cost), 0);
  const consolidatedCost = totalFuelCost + totalGeneralExpenses;

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Fuel & Expenses</h2>
          <p className="text-slate-555 text-sm font-medium">Audit fuel logs, tolls, and maintenance expenditures across your fleet.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openFuelModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <GasPump size={16} className="text-violet-650" />
            <span>Refill Log</span>
          </button>
          <button
            onClick={openExpenseModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-violet-600/10"
          >
            <Plus size={16} weight="bold" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fuel Costs */}
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Fuel cost</span>
          <span className="text-2xl font-bold text-slate-800 block mt-1">₹{totalFuelCost.toLocaleString()}</span>
        </div>
        {/* Maintenance */}
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Maintenance costs</span>
          <span className="text-2xl font-bold text-slate-800 block mt-1">₹{totalMaintenanceCost.toLocaleString()}</span>
        </div>
        {/* Tolls & Toll gates */}
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tolls & Highway fees</span>
          <span className="text-2xl font-bold text-slate-800 block mt-1">₹{totalTollsCost.toLocaleString()}</span>
        </div>
        {/* Consolidated costs */}
        <div className="p-5 rounded-2xl border border-violet-100 bg-violet-50 shadow-md shadow-violet-500/5">
          <span className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">Consolidated operational cost</span>
          <span className="text-2xl font-bold text-violet-755 block mt-1">₹{consolidatedCost.toLocaleString()}</span>
        </div>
      </div>

      {/* Tables section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. Fuel Refills Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-slate-900 font-heading font-bold text-lg flex items-center gap-2">
              <GasPump size={20} className="text-violet-600" />
              <span>Fuel Refill Logs</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Vehicle</th>
                    <th className="py-2.5 text-right">Liters</th>
                    <th className="py-2.5 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {fuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono">{log.date}</td>
                      <td className="py-3 text-slate-900 font-bold font-mono">{log.vehicleName}</td>
                      <td className="py-3 text-right font-mono font-medium">{log.liters} L</td>
                      <td className="py-3 text-right text-emerald-600 font-bold font-mono">₹{log.cost}</td>
                    </tr>
                  ))}
                  {fuelLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">No fuel refills registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Other Expenses Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-slate-900 font-heading font-bold text-lg flex items-center gap-2">
              <Receipt size={20} className="text-violet-600" />
              <span>General Expenses</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-650">
                <thead className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Vehicle</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-mono">{exp.date}</td>
                      <td className="py-3 text-slate-900 font-bold font-mono">{exp.vehicleName}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          exp.type === 'Maintenance' 
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : exp.type === 'Fuel'
                            ? 'bg-violet-50 text-violet-600 border-violet-100'
                            : exp.type === 'Toll'
                            ? 'bg-cyan-50 text-cyan-600 border-cyan-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 font-medium truncate max-w-[120px]" title={exp.description}>
                        {exp.description}
                      </td>
                      <td className="py-3 text-right text-emerald-600 font-bold font-mono">₹{exp.cost}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">No expenses registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Fuel Log Modal */}
      {fuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setFuelModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
                <GasPump size={22} className="text-violet-600" />
                <span>Log Fuel Refill</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Record liters pumped and total invoice cost.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleFuelSubmit} className="space-y-4 text-xs">
              {/* Vehicle Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vehicle</label>
                <select
                  value={fuelVehicleId}
                  onChange={(e) => setFuelVehicleId(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                >
                  {activeVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.regNumber} - {v.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Refill Date</label>
                <input
                  type="date"
                  value={fuelDate}
                  onChange={(e) => setFuelDate(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Liters */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Liters</label>
                  <input
                    type="number"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                {/* Total Cost */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Refill Cost (₹)</label>
                  <input
                    type="number"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-emerald-600 focus:outline-none focus:border-violet-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFuelModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-505 font-bold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-violet-600/10"
                >
                  <Check size={16} weight="bold" />
                  <span>Log Refill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* General Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setExpenseModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
                <Receipt size={22} className="text-violet-600" />
                <span>Log Other Expense</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Audit tolls, insurance, or other operational expenditures.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vehicle</label>
                  <select
                    value={expVehicleId}
                    onChange={(e) => setExpVehicleId(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  >
                    {activeVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.regNumber} - {v.name}</option>
                    ))}
                  </select>
                </div>

                {/* Expense Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expense Type</label>
                  <select
                    value={expType}
                    onChange={(e) => setExpType(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="Toll">Toll Fee</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other Operational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expense Date</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  />
                </div>

                {/* Cost */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cost Value (₹)</label>
                  <input
                    type="number"
                    value={expCost}
                    onChange={(e) => setExpCost(e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-emerald-600 focus:outline-none focus:border-violet-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Details of toll gate location, insurance bill, or fee explanation..."
                  rows="3"
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-505 font-bold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-violet-600/10"
                >
                  <Check size={16} weight="bold" />
                  <span>Log Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

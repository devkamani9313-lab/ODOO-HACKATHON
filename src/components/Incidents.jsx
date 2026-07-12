import React, { useState, useEffect } from 'react';
import { WarningCircle, CheckCircle, Plus, Check } from '@phosphor-icons/react';
import { getDrivers, getIncidents, addIncident, updateIncidentStatus } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Incidents() {
  const { isDemoMode, userRole } = useAuth();

  const [drivers, setDrivers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safety Officer Incident Form States
  const [incDriverId, setIncDriverId] = useState('');
  const [incCategory, setIncCategory] = useState('Speeding');
  const [incSeverity, setIncSeverity] = useState('Medium');
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [incDesc, setIncDesc] = useState('');
  const [incSuccess, setIncSuccess] = useState(false);
  const [incError, setIncError] = useState('');
  const [incLoading, setIncLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dList, iList] = await Promise.all([
        getDrivers(isDemoMode),
        getIncidents(isDemoMode)
      ]);
      setDrivers(dList);
      setIncidents(iList);

      if (dList.length > 0 && !incDriverId) {
        setIncDriverId(dList[0].id);
      }
    } catch (err) {
      console.error("Failed to load incidents data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    setIncError('');
    setIncSuccess(false);
    setIncLoading(true);

    if (!incDriverId || !incDesc.trim()) {
      setIncError('Please select a driver and enter incident details.');
      setIncLoading(false);
      return;
    }

    const driver = drivers.find(d => d.id === incDriverId);
    const incidentPayload = {
      driverId: incDriverId,
      driverName: driver ? driver.name : 'Unknown Driver',
      category: incCategory,
      severity: incSeverity,
      date: incDate,
      description: incDesc.trim(),
      status: 'Active'
    };

    try {
      await addIncident(isDemoMode, incidentPayload);
      setIncSuccess(true);
      setIncDesc('');
      await loadData();

      // Auto fade-out success notification
      setTimeout(() => {
        setIncSuccess(false);
      }, 4000);
    } catch (err) {
      setIncError(err.message || 'Failed to submit incident report.');
    } finally {
      setIncLoading(false);
    }
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      await updateIncidentStatus(isDemoMode, incidentId, 'Resolved');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to resolve incident.');
    }
  };

  const expiredLicenseCount = drivers.filter(d => {
    if (!d.licenseExpiryDate) return true;
    return new Date(d.licenseExpiryDate) < new Date();
  }).length;

  const lowSafetyScoreCount = drivers.filter(d => d.safetyScore < 70).length;
  const avgSafetyScore = drivers.length > 0
    ? Math.round(drivers.reduce((sum, d) => sum + Number(d.safetyScore || 0), 0) / drivers.length)
    : 100;
  const activeComplaintsCount = incidents.filter(i => i.status !== 'Resolved').length;

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#f8fafc] h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
          <span className="text-slate-500 text-sm font-semibold">Loading safety records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Driver Complaints & Safety</h2>
        <p className="text-slate-550 text-sm font-medium">Log driving safety infractions, audit expiring driver licenses, and handle behavior reports.</p>
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
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Safety Score</span>
          <span className="text-2xl font-bold text-slate-800 block mt-1">{avgSafetyScore}/100</span>
        </div>
        <div className="p-5 rounded-2xl border border-violet-100 bg-violet-50/70 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">Active Complaints</span>
          <span className="text-2xl font-bold text-violet-755 block mt-1">{activeComplaintsCount}</span>
        </div>
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Complaint Form */}
        {userRole === 'Safety Officer' && (
          <div className="lg:col-span-1 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shadow-sm">
                <WarningCircle size={20} className="text-red-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-slate-900 font-heading font-bold text-base">File Driver Complaint</h3>
                <p className="text-xs text-slate-450 mt-0.5 font-medium">Report driver infractions or violations.</p>
              </div>
            </div>

            {incSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-655 text-center flex items-center justify-center gap-1.5 animate-bounce">
                <CheckCircle size={16} className="text-emerald-500" />
                <span>Incident Logged Successfully!</span>
              </div>
            )}

            {incError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {incError}
              </div>
            )}

            <form onSubmit={handleIncidentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned Driver</label>
                <select
                  value={incDriverId}
                  onChange={(e) => setIncDriverId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-semibold cursor-pointer"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (Score: {d.safetyScore}/100)</option>
                  ))}
                  {drivers.length === 0 && (
                    <option value="" disabled>No drivers registered</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</label>
                  <select
                    value={incCategory}
                    onChange={(e) => setIncCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-semibold cursor-pointer"
                  >
                    <option value="Speeding">Speeding</option>
                    <option value="Rash Driving">Rash Driving</option>
                    <option value="Route Deviation">Route Deviation</option>
                    <option value="Log Delay">Log Delay</option>
                    <option value="Customer Complaint">Customer Complaint</option>
                    <option value="Accident">Accident / Damage</option>
                    <option value="Other">Other Infraction</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severity</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-semibold cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Incident Date</label>
                <input
                  type="date"
                  required
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Details / Description</label>
                <textarea
                  required
                  rows="4"
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="Describe the complaint (e.g. GPS speed limit alarm triggered on Highway 8, exceeding 100km/h)..."
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={incLoading || drivers.length === 0}
                className="w-full py-3 rounded-xl bg-red-650 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-red-650/10"
              >
                <span>{incLoading ? 'Reporting...' : 'Submit Report'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Active Complaints Log Table */}
        <div className={`${userRole === 'Safety Officer' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4`}>
          <div>
            <h3 className="text-slate-900 font-heading font-bold text-lg">Active Incident Log</h3>
            <p className="text-xs text-slate-450 mt-0.5 font-medium">Complaints and behavior logs for company operators.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-650">
              <thead className="text-slate-450 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Driver</th>
                  <th className="py-2.5">Infraction</th>
                  <th className="py-2.5">Severity</th>
                  <th className="py-2.5">Status</th>
                  {userRole === 'Safety Officer' && <th className="py-2.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono">{inc.date}</td>
                    <td className="py-3 text-slate-900 font-bold">{inc.driverName}</td>
                    <td className="py-3">
                      <div className="font-semibold text-slate-800">{inc.category}</div>
                      <div className="text-[10px] text-slate-450 font-normal truncate max-w-[180px]" title={inc.description}>
                        {inc.description}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${inc.severity === 'Critical'
                          ? 'bg-red-50 text-red-650 border-red-100'
                          : inc.severity === 'High'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : inc.severity === 'Medium'
                              ? 'bg-violet-50 text-violet-600 border-violet-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${inc.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : inc.status === 'Investigating'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            : 'bg-red-55 text-red-600 border-red-200'
                        }`}>
                        {inc.status}
                      </span>
                    </td>
                    {userRole === 'Safety Officer' && (
                      <td className="py-3 text-right">
                        {inc.status !== 'Resolved' && (
                          <button
                            onClick={() => handleResolveIncident(inc.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-250 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 font-bold transition-all cursor-pointer active:scale-95"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={userRole === 'Safety Officer' ? "6" : "5"} className="py-8 text-center text-slate-400 font-normal">No safety complaints or violations reported.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

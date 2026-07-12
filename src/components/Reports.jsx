import React, { useState, useEffect } from 'react';
import { DownloadSimple, ArrowUpRight, PresentationChart, TrendUp, GasPump, Wrench } from '@phosphor-icons/react';
import { getVehicles, getTrips, getFuelLogs, getExpenses } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { isDemoMode } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [v, t, f, e] = await Promise.all([
          getVehicles(isDemoMode),
          getTrips(isDemoMode),
          getFuelLogs(isDemoMode),
          getExpenses(isDemoMode)
        ]);
        setVehicles(v);
        setTrips(t);
        setFuelLogs(f);
        setExpenses(e);
      } catch (err) {
        console.error("Failed to compile operational report", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isDemoMode]);

  // Compile stats for each vehicle
  const reportData = vehicles.map(vehicle => {
    const vehicleTrips = trips.filter(t => t.vehicleId === vehicle.id && t.status === 'Completed');
    const totalRevenue = vehicleTrips.reduce((sum, t) => sum + (Number(t.revenue) || 0), 0);
    const totalDistance = vehicleTrips.reduce((sum, t) => sum + (Number(t.plannedDistance) || 0), 0);

    const vehicleFuelLogs = fuelLogs.filter(log => log.vehicleId === vehicle.id);
    const totalFuelCost = vehicleFuelLogs.reduce((sum, log) => sum + (Number(log.cost) || 0), 0);
    const totalFuelLiters = vehicleFuelLogs.reduce((sum, log) => sum + (Number(log.liters) || 0), 0);

    const vehicleMaintenanceCost = expenses
      .filter(exp => exp.vehicleId === vehicle.id && exp.type === 'Maintenance')
      .reduce((sum, exp) => sum + (Number(exp.cost) || 0), 0);

    const totalOperationalCost = totalFuelCost + vehicleMaintenanceCost;

    const fuelEfficiency = totalFuelLiters > 0 
      ? (totalDistance / totalFuelLiters).toFixed(2) 
      : '0.00';

    const netEarnings = totalRevenue - totalOperationalCost;
    const roiVal = vehicle.acquisitionCost > 0 
      ? ((netEarnings / vehicle.acquisitionCost) * 100).toFixed(1) 
      : '0.0';

    return {
      id: vehicle.id,
      regNumber: vehicle.regNumber,
      name: vehicle.name,
      type: vehicle.type,
      acquisitionCost: vehicle.acquisitionCost,
      totalRevenue,
      totalFuelCost,
      totalFuelLiters,
      vehicleMaintenanceCost,
      totalOperationalCost,
      fuelEfficiency,
      roi: roiVal
    };
  });

  const avgRoi = reportData.length > 0
    ? (reportData.reduce((sum, data) => sum + Number(data.roi), 0) / reportData.length).toFixed(1)
    : '0.0';

  const totalRevenueAll = reportData.reduce((sum, data) => sum + data.totalRevenue, 0);
  const totalCostAll = reportData.reduce((sum, data) => sum + data.totalOperationalCost, 0);

  const handleExportCSV = () => {
    const headers = ['Reg Number', 'Model', 'Type', 'Acquisition Cost (₹)', 'Total Revenue (₹)', 'Fuel Cost (₹)', 'Maintenance Cost (₹)', 'Operational Cost (₹)', 'Fuel Efficiency (km/L)', 'ROI (%)'];
    
    const rows = reportData.map(data => [
      data.regNumber,
      data.name,
      data.type,
      data.acquisitionCost,
      data.totalRevenue,
      data.totalFuelCost,
      data.vehicleMaintenanceCost,
      data.totalOperationalCost,
      data.fuelEfficiency,
      data.roi
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_fleet_roi_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoiColor = (roi) => {
    const num = Number(roi);
    if (num > 0) return 'text-emerald-600';
    if (num < 0) return 'text-red-600';
    return 'text-slate-500';
  };

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Reports & ROI Analytics</h2>
          <p className="text-slate-555 text-sm font-medium">Review vehicle profitability metrics, operational costs, and fuel economy.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-600/10 cursor-pointer"
        >
          <DownloadSimple size={16} weight="bold" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Global Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fleet Revenue */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fleet Net Revenue</span>
            <span className="text-2xl font-bold text-slate-800 block mt-1">₹{totalRevenueAll.toLocaleString()}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendUp size={20} className="text-emerald-600" />
          </div>
        </div>

        {/* Fleet Operational Cost */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fleet Operational Cost</span>
            <span className="text-2xl font-bold text-slate-800 block mt-1">₹{totalCostAll.toLocaleString()}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
            <Wrench size={20} className="text-red-650" />
          </div>
        </div>

        {/* Average ROI */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Return on Investment</span>
            <span className={`text-2xl font-bold block mt-1 ${getRoiColor(avgRoi)}`}>{avgRoi}%</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <PresentationChart size={20} className="text-violet-650" />
          </div>
        </div>
      </div>

      {/* ROI & Operational Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-650"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4 text-right">Acquisition</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                  <th className="px-6 py-4 text-right">Fuel Cost</th>
                  <th className="px-6 py-4 text-right">Maintenance Cost</th>
                  <th className="px-6 py-4 text-right">Op Cost</th>
                  <th className="px-6 py-4 text-right">Fuel Efficiency</th>
                  <th className="px-6 py-4 text-right">ROI (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {reportData.map((data) => (
                  <tr key={data.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-bold font-mono text-xs">{data.regNumber}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{data.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-medium">₹{data.acquisitionCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-900">₹{data.totalRevenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-medium">₹{data.totalFuelCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-medium">₹{data.vehicleMaintenanceCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-red-600">₹{data.totalOperationalCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-650">
                        <GasPump size={12} className="text-slate-400" />
                        <span>{data.fuelEfficiency} km/L</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-bold font-mono text-xs ${getRoiColor(data.roi)}`}>
                        <ArrowUpRight size={14} className={Number(data.roi) > 0 ? "text-emerald-600" : "hidden"} />
                        <span>{data.roi}%</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No data available to compile reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

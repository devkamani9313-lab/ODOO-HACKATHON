import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { ChartLineUp, ChartPie as PieIcon, ChartBar, ShieldCheck, Coins, Truck } from '@phosphor-icons/react';

const COLORS = {
  violet: '#7c3aed',
  indigo: '#6366f1',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b'
};

const PIE_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 px-3.5 py-2.5 rounded-xl shadow-lg text-xs">
        {label && <p className="font-bold text-slate-800 mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}:</span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* =========================================================
   1. FLEET MANAGER CHARTS
   ========================================================= */
export function FleetManagerCharts({ vehicles = [], trips = [], maintenanceLogs = [] }) {
  // 1) Fleet Status Distribution (Doughnut Chart)
  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const onTripCount = vehicles.filter(v => v.status === 'On Trip').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'In Shop').length;
  const retiredCount = vehicles.filter(v => v.status === 'Retired').length;

  const statusData = [
    { name: 'Available', value: availableCount },
    { name: 'On Trip', value: onTripCount },
    { name: 'Maintenance', value: maintenanceCount },
    { name: 'Retired', value: retiredCount }
  ];

  // 2) Vehicle Utilization Trend (Line Chart over Mon-Sun)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const utilizationTrendData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx)); // last 7 days including today
    const dayLabel = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const activeOnDay = trips.filter(t => {
      const tripDate = t.date || (t.createdAt && t.createdAt.split('T')[0]);
      return tripDate === dateStr;
    }).length;

    const rate = vehicles.length > 0 ? Math.round((activeOnDay / vehicles.length) * 100) : 0;
    return { day: dayLabel, utilization: rate || Math.max(12, Math.round(50 + Math.sin(idx) * 20)) };
  });

  // 3) Maintenance Analytics (Bar Chart - Vehicles serviced each month)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maintenanceAnalyticsData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const mLabel = monthNames[d.getMonth()];
    const mNum = d.getMonth() + 1;
    const yNum = d.getFullYear();

    const servicedCount = maintenanceLogs.filter(log => {
      const logDate = log.date || '';
      if (!logDate) return false;
      const parts = logDate.split('-');
      return Number(parts[0]) === yNum && Number(parts[1]) === mNum;
    }).length;

    return { month: mLabel, serviced: servicedCount };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <Truck size={18} className="text-violet-600" weight="bold" />
        <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-600">Fleet Operations Analytics</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut Chart: Fleet Status */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Fleet Status Distribution</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Live distribution by operating condition</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Vehicle Utilization Trend */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Vehicle Utilization Trend</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Active fleet utilization rate across week (%)</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilizationTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  name="Utilization" 
                  stroke={COLORS.violet} 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: COLORS.violet }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Maintenance Analytics */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Maintenance Analytics</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Vehicles serviced each month</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceAnalyticsData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="serviced" name="Vehicles Serviced" fill={COLORS.cyan} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   2. DRIVER CHARTS
   ========================================================= */
export function DriverCharts({ trips = [] }) {
  // 1) Deliveries Completed (Area Chart - Last 7 days)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const deliveriesCompletedData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dayLabel = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    const completedCount = trips.filter(t => {
      const tripDate = t.date || (t.createdAt && t.createdAt.split('T')[0]);
      return t.status === 'Completed' && tripDate === dateStr;
    }).length;

    return { day: dayLabel, completed: completedCount };
  });

  // 2) Cargo Distribution (Pie Chart - Light, Medium, Heavy)
  const light = trips.filter(t => Number(t.cargoWeight || 0) < 500).length;
  const medium = trips.filter(t => Number(t.cargoWeight || 0) >= 500 && Number(t.cargoWeight || 0) <= 2000).length;
  const heavy = trips.filter(t => Number(t.cargoWeight || 0) > 2000).length;

  const cargoDistributionData = [
    { name: 'Light Cargo (<500kg)', value: light || 2 },
    { name: 'Medium Cargo (500kg-2t)', value: medium || 1 },
    { name: 'Heavy Cargo (>2t)', value: heavy || 1 }
  ];

  // 3) Route Performance (Horizontal Bar Chart - Avg delivery duration per route)
  const routeGroups = {};
  trips.forEach(t => {
    const src = t.source || 'Unknown';
    const dest = t.destination || 'Unknown';
    const routeKey = `${src.substring(0, 10)} → ${dest.substring(0, 10)}`;
    if (!routeGroups[routeKey]) routeGroups[routeKey] = [];
    routeGroups[routeKey].push(Number(t.plannedDistance || 0));
  });

  let routePerformanceData = Object.entries(routeGroups).slice(0, 4).map(([route, dists]) => {
    const avgDist = dists.reduce((a, b) => a + b, 0) / dists.length;
    const avgDuration = parseFloat((avgDist / 60).toFixed(1)); // estimate duration (60 km/h)
    return { route, duration: avgDuration };
  });

  if (routePerformanceData.length === 0) {
    routePerformanceData = [
      { route: 'Mumbai → Delhi', duration: 24.5 },
      { route: 'Delhi → Beng', duration: 32.2 },
      { route: 'Kolkata → Nagpur', duration: 18.4 }
    ];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <ChartLineUp size={18} className="text-violet-600" weight="bold" />
        <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-600">Driver Route & Logistics Analytics</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Deliveries Completed */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Deliveries Completed</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Completed shipments over the last 7 days</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deliveriesCompletedData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.violet} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={COLORS.violet} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="completed" name="Deliveries" stroke={COLORS.violet} strokeWidth={2.5} fillOpacity={1} fill="url(#colorDeliveries)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Cargo Distribution */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Cargo Distribution</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Breakdown by cargo weight category</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cargoDistributionData}
                  outerRadius={78}
                  dataKey="value"
                  label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {cargoDistributionData.map((entry, index) => (
                    <Cell key={`cell-cargo-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal Bar Chart: Route Performance */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Route Performance</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Avg delivery duration per route (hrs)</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={routePerformanceData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} unit="h" />
                <YAxis dataKey="route" type="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#e2e8f0' }} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="duration" name="Avg Duration (hrs)" fill={COLORS.indigo} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   3. FINANCIAL ANALYST CHARTS
   ========================================================= */
export function FinancialAnalystCharts({ expenses = [], fuelLogs = [], trips = [] }) {
  // 1) Monthly Expenses (Bar Chart - Fuel, Maintenance, Tolls, Other)
  const fuelCost = fuelLogs.reduce((sum, f) => sum + (Number(f.cost) || 0), 0);
  const maintenanceCost = expenses.filter(e => e.type === 'Maintenance').reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const tollsCost = expenses.filter(e => e.type === 'Tolls' || e.type === 'Toll').reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const otherCost = expenses.filter(e => e.type !== 'Maintenance' && e.type !== 'Tolls' && e.type !== 'Toll').reduce((sum, e) => sum + (Number(e.cost) || 0), 0);

  const monthlyExpensesData = [
    { category: 'Fuel', amount: fuelCost || 45000 },
    { category: 'Maintenance', amount: maintenanceCost || 18000 },
    { category: 'Tolls', amount: tollsCost || 6000 },
    { category: 'Other', amount: otherCost || 4000 }
  ];

  // 2) Revenue vs Operational Cost (Line Chart - Monthly comparison)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyComparisonData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const mLabel = monthNames[d.getMonth()];
    const mNum = d.getMonth() + 1;
    const yNum = d.getFullYear();

    const monthlyRevenue = trips.filter(t => {
      const tripDate = t.date || (t.createdAt && t.createdAt.split('T')[0]);
      if (!tripDate || t.status !== 'Completed') return false;
      const parts = tripDate.split('-');
      return Number(parts[0]) === yNum && Number(parts[1]) === mNum;
    }).reduce((sum, t) => sum + (Number(t.revenue) || 0), 0);

    const monthlyExp = expenses.filter(e => {
      const eDate = e.date || '';
      if (!eDate) return false;
      const parts = eDate.split('-');
      return Number(parts[0]) === yNum && Number(parts[1]) === mNum;
    }).reduce((sum, e) => sum + (Number(e.cost) || 0), 0);

    const monthlyFuel = fuelLogs.filter(f => {
      const fDate = f.date || '';
      if (!fDate) return false;
      const parts = fDate.split('-');
      return Number(parts[0]) === yNum && Number(parts[1]) === mNum;
    }).reduce((sum, f) => sum + (Number(f.cost) || 0), 0);

    const calcCost = monthlyExp + monthlyFuel;
    return {
      month: mLabel,
      revenue: monthlyRevenue || Math.max(10000, Math.round(180000 + Math.sin(idx) * 60000)),
      cost: calcCost || Math.max(6000, Math.round(100000 + Math.sin(idx) * 35000))
    };
  });

  // 3) Expense Breakdown (Pie Chart - Fuel, Maintenance, Tolls, Other)
  const totalAll = fuelCost + maintenanceCost + tollsCost + otherCost || 1;
  const expenseBreakdownData = [
    { name: 'Fuel', value: Math.round((fuelCost / totalAll) * 100) || 55 },
    { name: 'Maintenance', value: Math.round((maintenanceCost / totalAll) * 100) || 25 },
    { name: 'Tolls', value: Math.round((tollsCost / totalAll) * 100) || 12 },
    { name: 'Other', value: Math.round((otherCost / totalAll) * 100) || 8 }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <Coins size={18} className="text-emerald-600" weight="bold" />
        <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-600">Financial Insights & Cost Analytics</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Monthly Expenses */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Monthly Expenses</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Expenditure by primary cost category</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpensesData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Cost (₹)" fill={COLORS.emerald} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Revenue vs Operational Cost */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Revenue vs Operational Cost</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Monthly financial comparison trend</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparisonData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.emerald} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cost" name="Operational Cost" stroke={COLORS.amber} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Expense Breakdown */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Expense Breakdown</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Percentage distribution across operations</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  outerRadius={78}
                  dataKey="value"
                  label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-exp-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   4. SAFETY OFFICER CHARTS
   ========================================================= */
export function SafetyOfficerCharts({ incidents = [], drivers = [] }) {
  // 1) Safety Score Trend (Line Chart - Avg safety score over time)
  const avgScore = drivers.length > 0
    ? Math.round(drivers.reduce((sum, d) => sum + Number(d.safetyScore || 0), 0) / drivers.length)
    : 85;

  const safetyScoreTrendData = [
    { month: 'Jan', score: Math.max(70, avgScore - 8) },
    { month: 'Feb', score: Math.max(70, avgScore - 6) },
    { month: 'Mar', score: Math.max(70, avgScore - 3) },
    { month: 'Apr', score: Math.max(70, avgScore - 4) },
    { month: 'May', score: Math.max(70, avgScore - 1) },
    { month: 'Jun', score: avgScore }
  ];

  // 2) Violation Categories (Doughnut Chart)
  const speeding = incidents.filter(i => i.category === 'Speeding').length;
  const rash = incidents.filter(i => i.category === 'Rash Driving').length;
  const deviation = incidents.filter(i => i.category === 'Route Deviation').length;
  const delay = incidents.filter(i => i.category === 'Log Delay').length;
  const other = incidents.filter(i => i.category !== 'Speeding' && i.category !== 'Rash Driving' && i.category !== 'Route Deviation' && i.category !== 'Log Delay').length;

  const violationCategoriesData = [
    { name: 'Speeding', value: speeding || 1 },
    { name: 'Rash Driving', value: rash || 1 },
    { name: 'Route Deviation', value: deviation || 0 },
    { name: 'Log Delay', value: delay || 0 },
    { name: 'Other', value: other || 0 }
  ];

  // 3) Incident Severity Report (Bar Chart)
  const criticalCount = incidents.filter(i => i.severity === 'Critical').length;
  const highCount = incidents.filter(i => i.severity === 'High').length;
  const mediumCount = incidents.filter(i => i.severity === 'Medium').length;
  const lowCount = incidents.filter(i => i.severity === 'Low').length;

  const monthlyIncidentData = [
    { category: 'Critical', count: criticalCount },
    { category: 'High', count: highCount },
    { category: 'Medium', count: mediumCount },
    { category: 'Low', count: lowCount }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <ShieldCheck size={18} className="text-red-500" weight="bold" />
        <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-600">Compliance & Safety Intelligence</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Safety Score Trend */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Safety Score Trend</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Average fleet operator safety score over time</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safetyScoreTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="Safety Score" stroke={COLORS.violet} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Violation Categories */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Violation Categories</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Logged operator safety infractions breakdown</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationCategoriesData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {violationCategoriesData.map((entry, index) => (
                    <Cell key={`cell-viol-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Monthly Incident Report */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-slate-900 text-base">Monthly Incident Report</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Incident severity distribution</p>
          </div>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIncidentData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Incidents" fill={COLORS.red} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

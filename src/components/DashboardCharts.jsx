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
export function FleetManagerCharts({ vehicles = [] }) {
  // 1) Fleet Status Distribution (Doughnut Chart)
  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const onTripCount = vehicles.filter(v => v.status === 'On Trip').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'In Shop').length;
  const retiredCount = vehicles.filter(v => v.status === 'Retired').length;

  const statusData = [
    { name: 'Available', value: availableCount || 8 },
    { name: 'On Trip', value: onTripCount || 14 },
    { name: 'Maintenance', value: maintenanceCount || 4 },
    { name: 'Retired', value: retiredCount || 1 }
  ];

  // 2) Vehicle Utilization Trend (Line Chart over Mon-Sun)
  const utilizationTrendData = [
    { day: 'Mon', utilization: 72 },
    { day: 'Tue', utilization: 78 },
    { day: 'Wed', utilization: 84 },
    { day: 'Thu', utilization: 81 },
    { day: 'Fri', utilization: 89 },
    { day: 'Sat', utilization: 68 },
    { day: 'Sun', utilization: 64 }
  ];

  // 3) Maintenance Analytics (Bar Chart - Vehicles serviced each month)
  const maintenanceAnalyticsData = [
    { month: 'Jan', serviced: 5 },
    { month: 'Feb', serviced: 8 },
    { month: 'Mar', serviced: 6 },
    { month: 'Apr', serviced: 9 },
    { month: 'May', serviced: 7 },
    { month: 'Jun', serviced: 11 }
  ];

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
export function DriverCharts() {
  // 1) Deliveries Completed (Area Chart - Last 7 days)
  const deliveriesCompletedData = [
    { day: 'Mon', completed: 6 },
    { day: 'Tue', completed: 8 },
    { day: 'Wed', completed: 7 },
    { day: 'Thu', completed: 10 },
    { day: 'Fri', completed: 9 },
    { day: 'Sat', completed: 5 },
    { day: 'Sun', completed: 4 }
  ];

  // 2) Cargo Distribution (Pie Chart - Light, Medium, Heavy)
  const cargoDistributionData = [
    { name: 'Light Cargo', value: 35 },
    { name: 'Medium Cargo', value: 45 },
    { name: 'Heavy Cargo', value: 20 }
  ];

  // 3) Route Performance (Horizontal Bar Chart - Avg delivery duration per route)
  const routePerformanceData = [
    { route: 'Route A-102', duration: 4.2 },
    { route: 'Route B-204', duration: 2.8 },
    { route: 'Route C-309', duration: 5.5 },
    { route: 'Route D-412', duration: 3.1 }
  ];

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
export function FinancialAnalystCharts() {
  // 1) Monthly Expenses (Bar Chart - Fuel, Maintenance, Repairs, Other)
  const monthlyExpensesData = [
    { category: 'Fuel', amount: 145000 },
    { category: 'Maintenance', amount: 62000 },
    { category: 'Repairs', amount: 34000 },
    { category: 'Other', amount: 18500 }
  ];

  // 2) Revenue vs Operational Cost (Line Chart - Monthly comparison)
  const monthlyComparisonData = [
    { month: 'Jan', revenue: 320000, cost: 210000 },
    { month: 'Feb', revenue: 380000, cost: 235000 },
    { month: 'Mar', revenue: 410000, cost: 245000 },
    { month: 'Apr', revenue: 395000, cost: 230000 },
    { month: 'May', revenue: 460000, cost: 260000 },
    { month: 'Jun', revenue: 510000, cost: 275000 }
  ];

  // 3) Expense Breakdown (Pie Chart - Fuel, Maintenance, Tolls, Miscellaneous)
  const expenseBreakdownData = [
    { name: 'Fuel', value: 55 },
    { name: 'Maintenance', value: 24 },
    { name: 'Tolls', value: 12 },
    { name: 'Miscellaneous', value: 9 }
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
export function SafetyOfficerCharts() {
  // 1) Safety Score Trend (Line Chart - Avg safety score over time)
  const safetyScoreTrendData = [
    { month: 'Jan', score: 86 },
    { month: 'Feb', score: 88 },
    { month: 'Mar', score: 91 },
    { month: 'Apr', score: 89 },
    { month: 'May', score: 93 },
    { month: 'Jun', score: 94 }
  ];

  // 2) Violation Categories (Doughnut Chart - Speeding, Harsh Braking, Overloading, Late Reporting, Other)
  const violationCategoriesData = [
    { name: 'Speeding', value: 38 },
    { name: 'Harsh Braking', value: 27 },
    { name: 'Overloading', value: 15 },
    { name: 'Late Reporting', value: 12 },
    { name: 'Other', value: 8 }
  ];

  // 3) Monthly Incident Report (Bar Chart - Critical, Major, Minor, Resolved)
  const monthlyIncidentData = [
    { category: 'Critical', count: 2 },
    { category: 'Major', count: 5 },
    { category: 'Minor', count: 14 },
    { category: 'Resolved', count: 19 }
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

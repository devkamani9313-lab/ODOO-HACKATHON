import React, { useState, useEffect } from 'react';
import { Plus, Trash, X, Check, Warning, Phone, Cardholder, User } from '@phosphor-icons/react';
import { getDrivers, addDriver, updateDriver, deleteDriver, isLicenseExpired, logSafetyIncident } from '../services/dataManager';
import { useAuth } from '../context/AuthContext';

export default function Drivers() {
  const { isDemoMode, userRole } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Filtering
  const [filterRole, setFilterRole] = useState('All');
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeDriverId, setActiveDriverId] = useState(null);
  const [activeDriverName, setActiveDriverName] = useState('');
  const [error, setError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('Driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Commercial');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState('100');
  const [status, setStatus] = useState('Available');

  // Incident Form Fields
  const [incidentSeverity, setIncidentSeverity] = useState('Minor');
  const [incidentReason, setIncidentReason] = useState('');

  const isManager = userRole === 'Manager';
  const isSafetyOfficer = userRole === 'Safety Officer';

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await getDrivers(isDemoMode);
      setDrivers(data);
    } catch (err) {
      console.error("Failed to load staff profiles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [isDemoMode]);

  const openAddModal = () => {
    setError('');
    setEditMode(false);
    setName('');
    setRole('Driver');
    setEmail('');
    setPassword('');
    setLicenseNumber('');
    setLicenseCategory('Commercial');
    setLicenseExpiryDate('');
    setContactNumber('');
    setSafetyScore('100');
    setStatus('Available');
    setModalOpen(true);
  };

  const openEditModal = (driver) => {
    setError('');
    setEditMode(true);
    setActiveDriverId(driver.id);
    setName(driver.name);
    setRole(driver.role || 'Driver');
    setEmail(driver.email || '');
    setPassword(driver.password || '');
    setLicenseNumber(driver.licenseNumber || '');
    setLicenseCategory(driver.licenseCategory || 'Commercial');
    setLicenseExpiryDate(driver.licenseExpiryDate || '');
    setContactNumber(driver.contactNumber);
    setSafetyScore((driver.safetyScore ?? 100).toString());
    setStatus(driver.status);
    setModalOpen(true);
  };

  const openIncidentModal = (driver) => {
    setError('');
    setActiveDriverId(driver.id);
    setActiveDriverName(driver.name);
    setIncidentSeverity('Minor');
    setIncidentReason('');
    setIncidentModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !contactNumber) {
      setError('Please enter Name and Contact Number.');
      return;
    }

    if (!editMode && (!email || !password)) {
      setError('Email and Password are required for login credentials.');
      return;
    }

    if (!editMode && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (role === 'Driver' && (!licenseNumber || !licenseExpiryDate)) {
      setError('License details are mandatory for drivers.');
      return;
    }

    const driverData = {
      name: name.trim(),
      role,
      email: email.trim().toLowerCase(),
      password: password,
      licenseNumber: role === 'Driver' ? licenseNumber.trim() : 'N/A',
      licenseCategory: role === 'Driver' ? licenseCategory : 'N/A',
      licenseExpiryDate: role === 'Driver' ? licenseExpiryDate : 'N/A',
      contactNumber: contactNumber.trim(),
      safetyScore: role === 'Driver' ? Number(safetyScore) : 100,
      status
    };

    try {
      if (editMode) {
        await updateDriver(isDemoMode, activeDriverId, driverData);
      } else {
        await addDriver(isDemoMode, driverData);
      }
      setModalOpen(false);
      loadDrivers();
    } catch (err) {
      setError(err.message || 'An error occurred while saving.');
    }
  };

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!incidentReason) {
      setError('Please describe the infraction.');
      return;
    }

    try {
      await logSafetyIncident(isDemoMode, activeDriverId, incidentSeverity, incidentReason);
      setIncidentModalOpen(false);
      loadDrivers();
    } catch (err) {
      setError(err.message || 'Failed to log infraction.');
    }
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this staff profile?')) {
      try {
        await deleteDriver(isDemoMode, driverId);
        loadDrivers();
      } catch (err) {
        alert(err.message || 'Failed to delete profile.');
      }
    }
  };

  const getStatusColor = (dStatus) => {
    switch (dStatus) {
      case 'Available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'On Trip': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'Off Duty': return 'bg-slate-100 text-slate-655 border-slate-200';
      case 'Suspended': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getRoleBadgeColor = (staffRole) => {
    switch (staffRole) {
      case 'Driver': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'Safety Officer': return 'bg-red-50 text-red-600 border-red-100';
      case 'Financial Analyst': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-655';
    if (score >= 70) return 'text-amber-650';
    return 'text-red-650';
  };

  // Filters profiles by selected tab
  const filteredDrivers = drivers.filter(d => {
    const r = d.role || 'Driver';
    if (filterRole === 'All') return true;
    return r === filterRole;
  });

  return (
    <div className="p-8 md:p-10 space-y-8 w-full max-w-[1450px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Staff Registry</h2>
          <p className="text-slate-505 text-sm font-medium">Monitor employee profiles, duty status, compliance, and operator scoring.</p>
        </div>
        {(isManager || isSafetyOfficer) && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-violet-600/10 cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2.5 bg-slate-100/50 p-2.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm w-fit">
        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider px-2">Role Filter</span>
        {['All', 'Driver', 'Safety Officer', 'Financial Analyst'].map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              filterRole === r 
                ? 'bg-white text-violet-600 shadow-sm border border-slate-200/40' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {r === 'All' ? 'All Roles' : `${r}s`}
          </button>
        ))}
      </div>

      {/* Compliance Warnings Bar (only for drivers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drivers
          .filter(d => (d.role || 'Driver') === 'Driver' && isLicenseExpired(d.licenseExpiryDate))
          .map(driver => (
            <div key={driver.id} className="p-4 rounded-xl border border-red-200 bg-red-55 flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <Warning size={20} className="text-red-500" />
                <div>
                  <h4 className="text-sm font-bold text-red-955">License Expired: {driver.name}</h4>
                  <p className="text-xs text-red-650 mt-0.5 font-medium">Driver license expired on {driver.licenseExpiryDate}. Blocked from dispatch.</p>
                </div>
              </div>
              {isSafetyOfficer && (
                <button 
                  onClick={() => openEditModal(driver)}
                  className="text-xs text-red-750 hover:text-red-850 font-bold underline cursor-pointer"
                >
                  Update License
                </button>
              )}
            </div>
          ))}
      </div>

      {/* Grid of Staff Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map(staff => {
            const isDriverRole = (staff.role || 'Driver') === 'Driver';
            const hasExpiredLicense = isDriverRole && isLicenseExpired(staff.licenseExpiryDate);
            
            return (
              <div 
                key={staff.id} 
                className={`p-6 rounded-2xl border bg-white flex flex-col justify-between transition-all duration-300 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5 shadow-sm ${
                  hasExpiredLicense ? 'border-red-200' : 'border-slate-200/85'
                }`}
              >
                <div className="space-y-4">
                  {/* Name and role badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-slate-900 font-heading font-bold text-lg leading-snug">{staff.name}</h3>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border uppercase tracking-wider mt-1.5 ${getRoleBadgeColor(staff.role || 'Driver')}`}>
                        {staff.role || 'Driver'}
                      </span>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getStatusColor(staff.status)}`}>
                      {staff.status}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2 border-t border-b border-slate-100 py-3.5 text-xs text-slate-650">
                    {isDriverRole ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Cardholder size={16} className="text-slate-400" />
                          <span className="font-mono font-semibold text-slate-800">{staff.licenseNumber}</span>
                          <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">License ({staff.licenseCategory})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Warning size={16} className={hasExpiredLicense ? "text-red-500" : "text-slate-400"} />
                          <span className={hasExpiredLicense ? "text-red-650 font-bold" : "font-medium"}>
                            License Expiry: {staff.licenseExpiryDate}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-500">Employee ID: </span>
                        <span className="font-mono font-bold text-slate-800">EMP-{staff.id?.substring(0, 5).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-400" />
                      <span className="font-medium">{staff.contactNumber}</span>
                    </div>
                  </div>

                  {/* Driver Safety Score meter (Driver ONLY) */}
                  {isDriverRole && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Safety Score</span>
                        <span className={`font-bold font-mono ${getScoreColor(staff.safetyScore)}`}>
                          {staff.safetyScore}/100
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            staff.safetyScore >= 90 ? 'bg-emerald-500' : staff.safetyScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${staff.safetyScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Operations buttons */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                  {/* Safety Incident Log button (Driver only) */}
                  {isSafetyOfficer && isDriverRole && (
                    <button
                      onClick={() => openIncidentModal(staff)}
                      disabled={staff.status === 'Suspended'}
                      className="flex-grow py-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-655 hover:text-red-655 text-xs font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center bg-white shadow-sm"
                    >
                      Log Infraction
                    </button>
                  )}
                  {isManager && (
                    <>
                      <button
                        onClick={() => openEditModal(staff)}
                        className="flex-grow py-2 rounded-xl border border-slate-200 hover:border-slate-350 bg-slate-55 hover:bg-slate-100 text-slate-700 text-xs font-bold tracking-wide transition-all active:scale-[0.98] cursor-pointer text-center shadow-sm"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => handleDelete(staff.id)}
                        className="p-2 rounded-xl border border-slate-200 hover:border-red-200 bg-slate-55 hover:bg-red-50 text-slate-400 hover:text-red-650 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                        title="Delete Profile"
                      >
                        <Trash size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filteredDrivers.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-450 font-medium">
              No staff members registered with role: {filterRole}
            </div>
          )}
        </div>
      )}

      {/* CRUD Staff Profile Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-55 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900">
                {editMode ? 'Edit Staff Profile' : 'Add New Staff Member'}
              </h3>
              <p className="text-xs text-slate-505 mt-1">Configure duty specifications, contact information, and role levels.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Number</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +1 555-0192"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Login Credentials (only when adding new) */}
              {!editMode && (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Login Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. staff@company.com"
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Login Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* System Role */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={editMode}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold disabled:opacity-50"
                  >
                    <option value="Driver">Driver / Operator</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>

                {/* Duty Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duty Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Conditional License & Safety Form Sections (Driver ONLY) */}
              {role === 'Driver' && (
                <>
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    {/* License Number */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">License Number</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. DL-98214"
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-mono font-bold"
                      />
                    </div>

                    {/* License Category */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</label>
                      <select
                        value={licenseCategory}
                        onChange={(e) => setLicenseCategory(e.target.value)}
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                      >
                        <option value="Commercial">Commercial</option>
                        <option value="Heavy Vehicle">Heavy Vehicle</option>
                        <option value="Light Carrier">Light Carrier</option>
                      </select>
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expiry Date</label>
                      <input
                        type="date"
                        value={licenseExpiryDate}
                        onChange={(e) => setLicenseExpiryDate(e.target.value)}
                        className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white cursor-pointer font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Safety Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={safetyScore}
                      onChange={(e) => setSafetyScore(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-505 font-bold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-violet-600/10"
                >
                  <Check size={16} weight="bold" />
                  <span>Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Incident Logging Modal (Safety Officer ONLY) */}
      {incidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIncidentModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-850 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
                <Warning size={22} className="text-red-500 animate-pulse" />
                <span>Log Safety Infraction</span>
              </h3>
              <p className="text-xs text-slate-505 mt-1">Deduct points from <span className="text-slate-800 font-bold">{activeDriverName}</span> based on infraction severity.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-650 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleIncidentSubmit} className="space-y-4 text-xs">
              {/* Severity Level */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Violation Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Minor', 'Major', 'Critical'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setIncidentSeverity(level)}
                      className={`py-2.5 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                        incidentSeverity === level
                          ? level === 'Minor' 
                            ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm shadow-amber-500/5'
                            : 'bg-red-50 text-red-700 border-red-300 shadow-sm shadow-red-500/5'
                          : 'bg-slate-50 border-slate-200 text-slate-550 hover:border-slate-350'
                      }`}
                    >
                      {level}
                      <span className="block text-[8.5px] text-gray-400 font-bold font-mono mt-0.5">
                        {level === 'Minor' ? '-5 pts' : level === 'Major' ? '-15 pts' : '-30 pts'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Reason */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Incident Details</label>
                <textarea
                  value={incidentReason}
                  onChange={(e) => setIncidentReason(e.target.value)}
                  placeholder="Describe the speeding, hard braking, or safety event..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIncidentModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-55 text-slate-505 font-bold cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-550 text-white font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-red-600/10"
                >
                  <Warning size={16} weight="bold" />
                  <span>Log Infraction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

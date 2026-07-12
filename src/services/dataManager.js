import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db, secondaryAuth } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Helper to check if a license is expired
export const isLicenseExpired = (expiryDateString) => {
  if (!expiryDateString) return true;
  const expiry = new Date(expiryDateString);
  const today = new Date();
  // Clear time components for pure date comparison
  today.setHours(0, 0, 0, 0);
  return expiry < today;
};
// One-time reset of dummy data from previous sessions
if (typeof window !== 'undefined' && window.localStorage) {
  if (!localStorage.getItem('transitops_cleaned_dummy_v3')) {
    localStorage.removeItem('transitops_vehicles');
    localStorage.removeItem('transitops_drivers');
    localStorage.removeItem('transitops_trips');
    localStorage.removeItem('transitops_maintenance');
    localStorage.removeItem('transitops_fuel_logs');
    localStorage.removeItem('transitops_expenses');
    localStorage.setItem('transitops_cleaned_dummy_v3', 'true');
  }
}
// Fallback collections start completely empty
const defaultVehicles = [];
const defaultDrivers = [];
const defaultTrips = [];
const defaultMaintenance = [];
const defaultFuelLogs = [];
const defaultExpenses = [];

// LocalStorage Helper functions
const getLocalData = (key, fallback) => {
  const data = localStorage.getItem(`transitops_${key}`);
  if (!data) {
    localStorage.setItem(`transitops_${key}`, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(data);
};

const saveLocalData = (key, data) => {
  localStorage.setItem(`transitops_${key}`, JSON.stringify(data));
};

export const getVehicles = async (isDemo) => {
  if (isDemo) return getLocalData('vehicles', defaultVehicles);
  const snap = await getDocs(collection(db, 'vehicles'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDrivers = async (isDemo) => {
  if (isDemo) return getLocalData('drivers', defaultDrivers);
  const snap = await getDocs(collection(db, 'drivers'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTrips = async (isDemo) => {
  if (isDemo) return getLocalData('trips', defaultTrips);
  const snap = await getDocs(collection(db, 'trips'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getMaintenanceLogs = async (isDemo) => {
  if (isDemo) return getLocalData('maintenance', defaultMaintenance);
  const snap = await getDocs(collection(db, 'maintenance'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getFuelLogs = async (isDemo) => {
  if (isDemo) return getLocalData('fuel_logs', defaultFuelLogs);
  const snap = await getDocs(collection(db, 'fuel_logs'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getExpenses = async (isDemo) => {
  if (isDemo) return getLocalData('expenses', defaultExpenses);
  const snap = await getDocs(collection(db, 'expenses'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// CRUD operations with integrated business logic
export const addVehicle = async (isDemo, vehicle) => {
  // Validate unique registration number
  const list = await getVehicles(isDemo);
  const duplicate = list.find(v => v.regNumber.toLowerCase() === vehicle.regNumber.toLowerCase());
  if (duplicate) throw new Error('Registration number must be unique.');

  const payload = {
    ...vehicle,
    maxCapacity: Number(vehicle.maxCapacity),
    odometer: Number(vehicle.odometer),
    acquisitionCost: Number(vehicle.acquisitionCost),
    status: vehicle.status || 'Available'
  };

  if (isDemo) {
    const list = getLocalData('vehicles', defaultVehicles);
    const newVehicle = { id: 'v_' + Date.now(), ...payload };
    list.push(newVehicle);
    saveLocalData('vehicles', list);
    return newVehicle;
  }
  const ref = await addDoc(collection(db, 'vehicles'), payload);
  return { id: ref.id, ...payload };
};

export const updateVehicle = async (isDemo, vehicleId, updates) => {
  const payload = { ...updates };
  if (updates.maxCapacity !== undefined) payload.maxCapacity = Number(updates.maxCapacity);
  if (updates.odometer !== undefined) payload.odometer = Number(updates.odometer);
  if (updates.acquisitionCost !== undefined) payload.acquisitionCost = Number(updates.acquisitionCost);

  if (isDemo) {
    const list = getLocalData('vehicles', defaultVehicles);
    const index = list.findIndex(v => v.id === vehicleId);
    if (index !== -1) {
      list[index] = { ...list[index], ...payload };
      saveLocalData('vehicles', list);
    }
    return;
  }
  const ref = doc(db, 'vehicles', vehicleId);
  await updateDoc(ref, payload);
};

export const deleteVehicle = async (isDemo, vehicleId) => {
  if (isDemo) {
    const list = getLocalData('vehicles', defaultVehicles);
    const filtered = list.filter(v => v.id !== vehicleId);
    saveLocalData('vehicles', filtered);
    return;
  }
  await deleteDoc(doc(db, 'vehicles', vehicleId));
};

export const addDriver = async (isDemo, driver) => {
  const payload = {
    name: driver.name,
    role: driver.role,
    email: driver.email,
    licenseNumber: driver.licenseNumber,
    licenseCategory: driver.licenseCategory,
    licenseExpiryDate: driver.licenseExpiryDate,
    contactNumber: driver.contactNumber,
    safetyScore: Number(driver.safetyScore) || 100,
    status: driver.status || 'Available'
  };

  if (isDemo) {
    const list = getLocalData('drivers', defaultDrivers);
    const newDriver = { id: 'd_' + Date.now(), ...payload };
    list.push(newDriver);
    saveLocalData('drivers', list);
    return newDriver;
  }

  // 1. Create a Firebase Authentication User for this staff member so they can log in
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, driver.email, driver.password);
    
    // 2. Set their System Role in the users collection
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: driver.email,
      role: driver.role
    });

    // 3. Store their profile in the drivers collection (with matching ID)
    const newDriverPayload = { id: credential.user.uid, ...payload };
    await setDoc(doc(db, 'drivers', credential.user.uid), newDriverPayload);
    
    // 4. Sign out the secondary app connection so it doesn't linger
    await signOut(secondaryAuth);
    
    return newDriverPayload;
  } catch (authError) {
    console.error("Firebase Auth staff creation failed:", authError);
    throw new Error(`Failed to create login account: ${authError.message}`);
  }
};

export const updateDriver = async (isDemo, driverId, updates) => {
  const payload = { ...updates };
  if (updates.safetyScore !== undefined) {
    payload.safetyScore = Number(updates.safetyScore);
    // Auto suspend if safety score drops below 50
    if (payload.safetyScore < 50) {
      payload.status = 'Suspended';
    }
  }

  if (isDemo) {
    const list = getLocalData('drivers', defaultDrivers);
    const index = list.findIndex(d => d.id === driverId);
    if (index !== -1) {
      list[index] = { ...list[index], ...payload };
      saveLocalData('drivers', list);
    }
    return;
  }
  const ref = doc(db, 'drivers', driverId);
  await updateDoc(ref, payload);
};

export const deleteDriver = async (isDemo, driverId) => {
  if (isDemo) {
    const list = getLocalData('drivers', defaultDrivers);
    const filtered = list.filter(d => d.id !== driverId);
    saveLocalData('drivers', filtered);
    return;
  }
  await deleteDoc(doc(db, 'drivers', driverId));
};

// Log Safety Incident (Deduct score and check for suspension)
export const logSafetyIncident = async (isDemo, driverId, severity, reason) => {
  const driversList = await getDrivers(isDemo);
  const driver = driversList.find(d => d.id === driverId);
  if (!driver) throw new Error('Driver not found');

  let deduction = 5; // minor
  if (severity === 'Major') deduction = 15;
  if (severity === 'Critical') deduction = 30;

  const nextScore = Math.max(0, (driver.safetyScore || 100) - deduction);
  const nextStatus = nextScore < 50 ? 'Suspended' : driver.status;

  await updateDriver(isDemo, driverId, {
    safetyScore: nextScore,
    status: nextStatus
  });

  // Log incident as an expense/compliance log if needed (Optional)
};

// Create Trip with Business Rules Validation
export const createTrip = async (isDemo, tripData) => {
  const vehicles = await getVehicles(isDemo);
  const drivers = await getDrivers(isDemo);

  const vehicle = vehicles.find(v => v.id === tripData.vehicleId);
  const driver = drivers.find(d => d.id === tripData.driverId);

  if (!vehicle) throw new Error('Selected vehicle not found.');
  if (!driver) throw new Error('Selected driver not found.');

  // Rule 1: Retired or In Shop vehicles blocked
  if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
    throw new Error('This vehicle is currently unavailable (Retired or In Shop).');
  }

  // Ensure vehicle is not under active maintenance log
  const logs = await getMaintenanceLogs(isDemo);
  const activeMaintenance = logs.some(log => log.vehicleId === tripData.vehicleId && log.status === 'Active');
  if (activeMaintenance) {
    throw new Error('Selected vehicle is currently under maintenance.');
  }

  // Rule 2: Driver suspended or expired license
  if (driver.status === 'Suspended') {
    throw new Error('Selected driver is Suspended.');
  }
  if (isLicenseExpired(driver.licenseExpiryDate)) {
    throw new Error('Selected driver has an expired license.');
  }

  // Rule 3: Already on trip
  if (vehicle.status === 'On Trip') {
    throw new Error('Selected vehicle is already On Trip.');
  }
  if (driver.status === 'On Trip') {
    throw new Error('Selected driver is already On Trip.');
  }

  // Rule 4: Capacity Limit check
  if (Number(tripData.cargoWeight) > Number(vehicle.maxCapacity)) {
    throw new Error(`Cargo weight (${tripData.cargoWeight} kg) exceeds maximum capacity of vehicle (${vehicle.maxCapacity} kg).`);
  }

  const payload = {
    ...tripData,
    cargoWeight: Number(tripData.cargoWeight),
    plannedDistance: Number(tripData.plannedDistance),
    revenue: Number(tripData.revenue) || 0,
    status: 'Draft',
    actualOdometer: 0,
    fuelConsumed: 0,
    createdAt: new Date().toISOString()
  };

  if (isDemo) {
    const list = getLocalData('trips', defaultTrips);
    const newTrip = { id: 't_' + Date.now(), ...payload };
    list.push(newTrip);
    saveLocalData('trips', list);
    return newTrip;
  }
  const ref = await addDoc(collection(db, 'trips'), payload);
  return { id: ref.id, ...payload };
};

// Dispatch Trip (Automatic Transitions)
export const dispatchTrip = async (isDemo, tripId) => {
  const trips = await getTrips(isDemo);
  const trip = trips.find(t => t.id === tripId);
  if (!trip) throw new Error('Trip not found');

  // Change Trip Status -> Dispatched
  if (isDemo) {
    const list = getLocalData('trips', defaultTrips);
    const index = list.findIndex(t => t.id === tripId);
    if (index !== -1) {
      list[index].status = 'Dispatched';
      saveLocalData('trips', list);
    }
  } else {
    await updateDoc(doc(db, 'trips', tripId), { status: 'Dispatched' });
  }

  // Change Vehicle & Driver Status -> On Trip
  await updateVehicle(isDemo, trip.vehicleId, { status: 'On Trip' });
  await updateDriver(isDemo, trip.driverId, { status: 'On Trip' });
};

// Cancel Trip (Automatic Transitions)
export const cancelTrip = async (isDemo, tripId) => {
  const trips = await getTrips(isDemo);
  const trip = trips.find(t => t.id === tripId);
  if (!trip) throw new Error('Trip not found');

  // Change Trip Status -> Cancelled
  if (isDemo) {
    const list = getLocalData('trips', defaultTrips);
    const index = list.findIndex(t => t.id === tripId);
    if (index !== -1) {
      list[index].status = 'Cancelled';
      saveLocalData('trips', list);
    }
  } else {
    await updateDoc(doc(db, 'trips', tripId), { status: 'Cancelled' });
  }

  // Restore Vehicle & Driver -> Available
  await updateVehicle(isDemo, trip.vehicleId, { status: 'Available' });
  await updateDriver(isDemo, trip.driverId, { status: 'Available' });
};

// Complete Trip (Automatic Transitions, Odometer, Fuel)
export const completeTrip = async (isDemo, tripId, actualOdometer, fuelConsumed, fuelCost) => {
  const trips = await getTrips(isDemo);
  const trip = trips.find(t => t.id === tripId);
  if (!trip) throw new Error('Trip not found');

  // Update Trip Status -> Completed
  if (isDemo) {
    const list = getLocalData('trips', defaultTrips);
    const index = list.findIndex(t => t.id === tripId);
    if (index !== -1) {
      list[index].status = 'Completed';
      list[index].actualOdometer = Number(actualOdometer);
      list[index].fuelConsumed = Number(fuelConsumed);
      list[index].fuelCost = Number(fuelCost);
      saveLocalData('trips', list);
    }
  } else {
    await updateDoc(doc(db, 'trips', tripId), { 
      status: 'Completed',
      actualOdometer: Number(actualOdometer),
      fuelConsumed: Number(fuelConsumed),
      fuelCost: Number(fuelCost)
    });
  }

  // Restore Vehicle & Driver -> Available, Update Odometer
  await updateVehicle(isDemo, trip.vehicleId, { 
    status: 'Available', 
    odometer: Number(actualOdometer)
  });
  await updateDriver(isDemo, trip.driverId, { status: 'Available' });

  // Add Fuel Log
  await addFuelLog(isDemo, {
    vehicleId: trip.vehicleId,
    vehicleName: trip.vehicleName,
    liters: Number(fuelConsumed),
    cost: Number(fuelCost),
    date: new Date().toISOString().split('T')[0]
  });
};

// Fuel Log CRUD
export const addFuelLog = async (isDemo, fuelData) => {
  const payload = {
    ...fuelData,
    liters: Number(fuelData.liters),
    cost: Number(fuelData.cost)
  };

  if (isDemo) {
    const list = getLocalData('fuel_logs', defaultFuelLogs);
    const newLog = { id: 'f_' + Date.now(), ...payload };
    list.push(newLog);
    saveLocalData('fuel_logs', list);
    return newLog;
  }
  const ref = await addDoc(collection(db, 'fuel_logs'), payload);
  return { id: ref.id, ...payload };
};

// Expenses CRUD
export const addExpense = async (isDemo, expenseData) => {
  const payload = {
    ...expenseData,
    cost: Number(expenseData.cost)
  };

  if (isDemo) {
    const list = getLocalData('expenses', defaultExpenses);
    const newExpense = { id: 'e_' + Date.now(), ...payload };
    list.push(newExpense);
    saveLocalData('expenses', list);
    return newExpense;
  }
  const ref = await addDoc(collection(db, 'expenses'), payload);
  return { id: ref.id, ...payload };
};

// Maintenance Logs with Locking
export const startMaintenance = async (isDemo, logData) => {
  const payload = {
    ...logData,
    cost: Number(logData.cost),
    status: 'Active',
    startDate: logData.startDate || new Date().toISOString().split('T')[0]
  };

  // Lock Vehicle -> In Shop
  await updateVehicle(isDemo, logData.vehicleId, { status: 'In Shop' });

  if (isDemo) {
    const list = getLocalData('maintenance', defaultMaintenance);
    const newLog = { id: 'm_' + Date.now(), ...payload };
    list.push(newLog);
    saveLocalData('maintenance', list);
    return newLog;
  }
  const ref = await addDoc(collection(db, 'maintenance'), payload);
  return { id: ref.id, ...payload };
};

export const closeMaintenance = async (isDemo, logId, endDate, finalCost) => {
  const logs = await getMaintenanceLogs(isDemo);
  const log = logs.find(l => l.id === logId);
  if (!log) throw new Error('Maintenance ticket not found');

  // Close ticket
  if (isDemo) {
    const list = getLocalData('maintenance', defaultMaintenance);
    const index = list.findIndex(l => l.id === logId);
    if (index !== -1) {
      list[index].status = 'Closed';
      list[index].endDate = endDate;
      list[index].cost = Number(finalCost);
      saveLocalData('maintenance', list);
    }
  } else {
    await updateDoc(doc(db, 'maintenance', logId), { 
      status: 'Closed',
      endDate,
      cost: Number(finalCost)
    });
  }

  // Restore Vehicle -> Available (check if not retired)
  const vehicles = await getVehicles(isDemo);
  const vehicle = vehicles.find(v => v.id === log.vehicleId);
  if (vehicle && vehicle.status !== 'Retired') {
    await updateVehicle(isDemo, log.vehicleId, { status: 'Available' });
  }

  // Log as Maintenance Expense
  await addExpense(isDemo, {
    vehicleId: log.vehicleId,
    vehicleName: log.vehicleName,
    type: 'Maintenance',
    cost: Number(finalCost),
    date: endDate,
    description: `Closed maintenance: ${log.description}`
  });
};

// Incidents & Driver Complaints Registry
export const getIncidents = async (isDemo) => {
  if (isDemo) {
    return getLocalData('incidents', []);
  }
  const querySnapshot = await getDocs(collection(db, 'incidents'));
  const list = [];
  querySnapshot.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() });
  });
  return list.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const addIncident = async (isDemo, incidentData) => {
  const payload = {
    ...incidentData,
    status: incidentData.status || 'Active', // Active, Investigating, Resolved
    createdAt: new Date().toISOString()
  };

  // Calculate safety score penalty
  let penalty = 5;
  if (payload.severity === 'Critical') penalty = 20;
  else if (payload.severity === 'High') penalty = 15;
  else if (payload.severity === 'Medium') penalty = 10;

  // Retrieve driver and apply penalty
  try {
    const drivers = await getDrivers(isDemo);
    const driver = drivers.find(d => d.id === payload.driverId);
    if (driver) {
      const currentScore = Number(driver.safetyScore !== undefined ? driver.safetyScore : 100);
      const newScore = Math.max(0, currentScore - penalty);
      await updateDriver(isDemo, payload.driverId, { safetyScore: newScore });
    }
  } catch (err) {
    console.error("Failed to update driver safety score upon incident logging", err);
  }

  if (isDemo) {
    const list = getLocalData('incidents', []);
    const newLog = { id: 'inc_' + Date.now(), ...payload };
    list.push(newLog);
    saveLocalData('incidents', list);
    return newLog;
  }
  const ref = await addDoc(collection(db, 'incidents'), payload);
  return { id: ref.id, ...payload };
};

export const updateIncidentStatus = async (isDemo, incidentId, newStatus) => {
  if (isDemo) {
    const list = getLocalData('incidents', []);
    const index = list.findIndex(i => i.id === incidentId);
    if (index !== -1) {
      list[index].status = newStatus;
      saveLocalData('incidents', list);
    }
  } else {
    await updateDoc(doc(db, 'incidents', incidentId), { status: newStatus });
  }
};



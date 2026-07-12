import { 
  getVehicles, 
  getDrivers, 
  getTrips, 
  getMaintenanceLogs, 
  getExpenses 
} from './dataManager';

export async function getFleetContext(isDemoMode) {
  try {
    const [vehicles, drivers, trips, maintenance, expenses] = await Promise.all([
      getVehicles(isDemoMode),
      getDrivers(isDemoMode),
      getTrips(isDemoMode),
      getMaintenanceLogs(isDemoMode),
      getExpenses(isDemoMode)
    ]);

    // Format a concise version for the LLM
    const vehiclesSummary = vehicles.map(v => 
      `- ${v.regNumber}: ${v.brand} ${v.model} (${v.type}, Status: ${v.status}, Fuel: ${v.fuelType})`
    ).join('\n');

    const driversSummary = drivers.map(d => 
      `- ${d.name} (${d.role}, Contact: ${d.contactNumber}, Status: ${d.status}, Safety Score: ${d.safetyScore})`
    ).join('\n');

    const tripsSummary = trips.map(t => 
      `- Route: ${t.startLocation} to ${t.endLocation} (Vehicle Registration ID/Ref: ${t.vehicleId || 'Unassigned'}, Driver ID/Ref: ${t.driverId || 'Unassigned'}, Status: ${t.status}, Distance: ${t.distance || '0'} km)`
    ).join('\n');

    const maintenanceSummary = maintenance.map(m => 
      `- Vehicle Registration ID/Ref: ${m.vehicleId}, Task: ${m.taskDescription}, Cost: ₹${m.cost}, Date: ${m.date}, Status: ${m.status}`
    ).join('\n');

    const expensesSummary = expenses.map(e => 
      `- Category: ${e.category}, Amount: ₹${e.amount}, Date: ${e.date}, Desc: ${e.description}`
    ).join('\n');

    return `
=== SYSTEM FLEET STATE ===
[Vehicles Count: ${vehicles.length}]
${vehiclesSummary || 'No vehicles registered.'}

[Staff / Drivers Count: ${drivers.length}]
${driversSummary || 'No staff registered.'}

[Trips Count: ${trips.length}]
${tripsSummary || 'No trips scheduled.'}

[Maintenance Logs Count: ${maintenance.length}]
${maintenanceSummary || 'No maintenance logs.'}

[Expenses Count: ${expenses.length}]
${expensesSummary || 'No expenses logged.'}
==========================
`;
  } catch (error) {
    console.error("Failed to gather fleet context:", error);
    return "Error: Unable to load fleet data.";
  }
}

export async function askGroq(userPrompt, fleetContext) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Groq API Key is not configured. Please add VITE_GROQ_API_KEY to your .env file.");
  }

  const systemMessage = {
    role: "system",
    content: `You are TransitOps AI, a premium and intelligent assistant for a fleet operations and transit management system. 
You are given the current live data of the fleet below. Answer the manager or operator's query professionally, concisely, and offer actionable suggestions based on this data. Use bullet points and clean formatting.

${fleetContext}`
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        systemMessage,
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

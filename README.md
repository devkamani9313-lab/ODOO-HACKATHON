# TransitOps - AI-Powered Fleet Intelligence Command Center

TransitOps is an enterprise-grade fleet operations and transit management system built for the modern logistics landscape. It combines real-time route dispatching, safety compliance audits, maintenance operations, operational financial reports, and an AI-powered fleet assistant with advanced eco-friendly carbon emission tracking.

---

## 🌟 Key Features

### 📊 Executive Operations Dashboard
- **Live Fleet Metrics**: Real-time status monitoring (Active, Available, In Shop, Retired vehicles) and overall fleet utilization ratios.
- **Interactive Analytics**: Graphical charts representing fuel costs, maintenance overhead, and per-vehicle profit margins (using Recharts).
- **Active Deliveries Map**: Embedded Leaflet map tracking current dispatched routes, shipment cargo, and dispatch status.

### 🍃 CO2 & Sustainability Tracker (New)
- **Eco-Driving Score**: Real-time driver scoring calculated dynamically using safety score compliance and fuel burn efficiency.
- **Carbon Footprint Audit**: Automatic CO2 emission tracking per trip based on fuel consumed and vehicle type factor (2.68 kg CO2/L for Diesel trucks/containers; 2.31 kg CO2/L for Gasoline vans/cars).
- **Carbon Forest Offset**: Visual representation of the exact number of mature trees required to offset a driver's travel footprint.
- **Eco Insights Carousel**: Interactive slider with fuel-saving recommendations and eco-driving tips.

### 👥 Staff Registry & Driver Compliance
- **Safety Infraction Registry**: Safety Officers can log driving infractions (Minor/Major/Critical), automatically deducting safety points.
- **Auto-Suspension System**: Drivers are automatically suspended from dispatch if their safety score falls below 50.
- **Compliance Warnings**: Instant notifications for expired commercial licenses with auto-blocks preventing illegal dispatch.

### 🗺️ Wizard Trip Management
- **Interactive Route Planning**: OpenStreetMap geocoding via Leaflet to search source and destination hubs, auto-calculate geodesic distance, and predict route revenues.
- **Dispatch Validation Rules**: Multi-layer validations checking cargo capacity limits, driver suspensions, vehicle availability, and maintenance holds.

### 🔧 Maintenance & Asset Locking
- **In-Shop Locking**: Vehicles sent for service are locked to "In Shop" status, preventing them from being scheduled for active dispatch.
- **Cost Accumulation**: Closed maintenance logs automatically log cost histories into the fleet's financial expenses database.

### 💵 ROI & Exportable Reports
- **CSV & PDF Export**: Compile detailed operational charts, fuel efficiency statistics, and net ROI calculations, with one-click print exports.

### 🤖 Groq AI Fleet Assistant
- **Context-Aware LLM**: Integrated chat portal powered by Groq (Llama-3.3-70b-versatile) that evaluates the live database schema (vehicles, staff, active trips, fuel expenses) to provide instant optimizations.

---

## 🛠️ Technology Stack
- **Core UI**: React 19, Vite 8, Tailwind CSS, Phosphor Icons
- **Real-Time Data**: Firebase Firestore, Firebase Authentication
- **Data Visualization**: Recharts
- **Interactive Maps**: Leaflet API (Geocoding via Nominatim OpenStreetMap)
- **Document Export**: jsPDF

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/devkamani9313-lab/ODOO-HACKATHON.git
cd ODOO-HACKATHON
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory. You can copy the structure from the `.env.example` file:
```bash
cp .env.example .env
```
Fill in the credentials for your Firebase App and Groq API developer key:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
...
```

### 4. Running Locally
Start the development server locally:
```bash
npm run dev
```
Open your browser to [http://localhost:5173/](http://localhost:5173/) to launch the app.

---

## 🔑 Access Control Roles
TransitOps implements role-based layouts tailored to four operational roles:
1. **Fleet Manager**: Full CRUD permissions to register vehicles, manage staff, schedule trips, and audit maintenance schedules.
2. **Driver**: Personal portal to monitor assigned dispatch orders, complete routes with actual fuel/odometer parameters, and track their personal CO2 footprint and safety metrics.
3. **Safety Officer**: Portal focused on expired licenses and driver infractions.
4. **Financial Analyst**: Analytical overview of fuel logs, vehicle ROI matrices, and expense logs.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'ksp_crime.db');

// Ensure data folder exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Remove old database to ensure fresh seeding
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new DatabaseSync(dbPath);

// 1. Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS police_stations (
    station_id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name TEXT NOT NULL,
    district TEXT NOT NULL,
    coordinates TEXT NOT NULL, -- "lat, lng"
    division TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS crimes (
    crime_id TEXT PRIMARY KEY,
    station_id INTEGER,
    crime_type TEXT NOT NULL,
    date_filed TEXT NOT NULL,
    status TEXT NOT NULL, -- "Under Investigation", "Charge Sheeted", "Trial Pending", "Disposed"
    description TEXT NOT NULL,
    ipc_sections TEXT NOT NULL, -- JSON array of IPC sections
    priority TEXT NOT NULL, -- "Low", "Medium", "High"
    victim_demographics TEXT NOT NULL, -- JSON object
    FOREIGN KEY (station_id) REFERENCES police_stations(station_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS criminals (
    criminal_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    alias TEXT,
    age INTEGER,
    gender TEXT,
    known_gang TEXT,
    primary_crime_type TEXT,
    status TEXT NOT NULL -- "Active", "In Custody", "Absconding"
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS suspects (
    crime_id TEXT,
    criminal_id TEXT,
    involvement TEXT, -- "Primary Suspect", "Co-conspirator", "Witness"
    PRIMARY KEY (crime_id, criminal_id),
    FOREIGN KEY (crime_id) REFERENCES crimes(crime_id),
    FOREIGN KEY (criminal_id) REFERENCES criminals(criminal_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS relationships (
    relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
    criminal_1_id TEXT,
    criminal_2_id TEXT,
    connection_type TEXT, -- "Accomplice", "Gang Member", "Relative"
    association_score REAL,
    FOREIGN KEY (criminal_1_id) REFERENCES criminals(criminal_id),
    FOREIGN KEY (criminal_2_id) REFERENCES criminals(criminal_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS demographics (
    district TEXT PRIMARY KEY,
    literacy_rate REAL,
    unemployment_rate REAL,
    poverty_index REAL,
    police_density REAL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_role TEXT NOT NULL,
    query_text TEXT NOT NULL,
    parsed_sql TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    confidence_score REAL NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("✅ Database schema initialized.");

// 2. Insert Police Stations
const stations = [
  { name: "Koramangala PS", district: "Bengaluru City", coords: "12.9352, 77.6244", division: "South" },
  { name: "Indiranagar PS", district: "Bengaluru City", coords: "12.9784, 77.6408", division: "East" },
  { name: "Peenya PS", district: "Bengaluru City", coords: "13.0329, 77.5273", division: "North-West" },
  { name: "Whitefield PS", district: "Bengaluru City", coords: "12.9698, 77.7500", division: "Whitefield" },
  { name: "Majestic PS", district: "Bengaluru City", coords: "12.9779, 77.5724", division: "West" },
  { name: "Lashkar PS", district: "Mysuru", coords: "12.3168, 76.6558", division: "Mysuru Town" },
  { name: "Vidyaranyapuram PS", district: "Mysuru", coords: "12.2890, 76.6491", division: "Mysuru South" },
  { name: "Gokul Road PS", district: "Dharwad", coords: "15.3647, 75.0934", division: "Hubballi City" },
  { name: "Dharwad Town PS", district: "Dharwad", coords: "15.4589, 75.0078", division: "Dharwad City" },
  { name: "Pandeshwar PS", district: "Dakshina Kannada", coords: "12.8624, 74.8398", division: "Mangaluru South" },
  { name: "Urwa PS", district: "Dakshina Kannada", coords: "12.8887, 74.8312", division: "Mangaluru North" },
  { name: "Khade Bazar PS", district: "Belagavi", coords: "15.8497, 74.5126", division: "Belagavi Town" },
  { name: "Chowk PS", district: "Kalaburagi", coords: "17.3291, 76.8344", division: "Kalaburagi City" }
];

const stmtStation = db.prepare(`INSERT INTO police_stations (station_name, district, coordinates, division) VALUES (?, ?, ?, ?)`);
stations.forEach(s => stmtStation.run(s.name, s.district, s.coords, s.division));
console.log("✅ Police stations seeded.");

// 3. Insert Demographics
const demoData = [
  { district: "Bengaluru City", literacy: 88.48, unemployment: 4.8, poverty: 0.05, density: 4.5 },
  { district: "Mysuru", literacy: 72.79, unemployment: 5.2, poverty: 0.12, density: 2.1 },
  { district: "Dharwad", literacy: 80.00, unemployment: 5.9, poverty: 0.15, density: 1.9 },
  { district: "Dakshina Kannada", literacy: 88.57, unemployment: 3.9, poverty: 0.04, density: 2.4 },
  { district: "Belagavi", literacy: 73.48, unemployment: 6.5, poverty: 0.22, density: 1.6 },
  { district: "Kalaburagi", literacy: 64.85, unemployment: 8.4, poverty: 0.35, density: 1.1 }
];

const stmtDemo = db.prepare(`INSERT INTO demographics (district, literacy_rate, unemployment_rate, poverty_index, police_density) VALUES (?, ?, ?, ?, ?)`);
demoData.forEach(d => stmtDemo.run(d.district, d.literacy, d.unemployment, d.poverty, d.density));
console.log("✅ Demographics seeded.");

// 4. Insert Criminals
const criminals = [
  { id: "CRM-001", name: "Somesh Gowda", alias: "Silent Somu", age: 34, gender: "Male", gang: "Koramangala Syndicate", crime: "Dacoity", status: "Active" },
  { id: "CRM-002", name: "Kiran Naik", alias: "Blade Kiran", age: 29, gender: "Male", gang: "Koramangala Syndicate", crime: "Theft", status: "In Custody" },
  { id: "CRM-003", name: "Shabana Begum", alias: "Amma", age: 45, gender: "Female", gang: "Kalaburagi Network", crime: "Cheating", status: "Active" },
  { id: "CRM-004", name: "Ramesh Kumar", alias: "Double Ramesh", age: 38, gender: "Male", gang: "None", crime: "Murder", status: "Absconding" },
  { id: "CRM-005", name: "Vikas Hegde", alias: "Tech Vikas", age: 27, gender: "Male", gang: "West Coast Hackers", crime: "Cyber Fraud", status: "Active" },
  { id: "CRM-006", name: "Anand Shekar", alias: "Appu", age: 31, gender: "Male", gang: "Koramangala Syndicate", crime: "Assault", status: "Active" },
  { id: "CRM-007", name: "Jagadish Murthy", alias: "Jagga", age: 42, gender: "Male", gang: "Kalaburagi Network", crime: "Dacoity", status: "In Custody" },
  { id: "CRM-008", name: "Mamatha Reddy", alias: "Didi", age: 39, gender: "Female", gang: "None", crime: "Cheating", status: "Active" }
];

const stmtCriminal = db.prepare(`INSERT INTO criminals (criminal_id, name, alias, age, gender, known_gang, primary_crime_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
criminals.forEach(c => stmtCriminal.run(c.id, c.name, c.alias, c.age, c.gender, c.gang, c.crime, c.status));
console.log("✅ Criminal profiles seeded.");

// 5. Insert Relationships
const relationships = [
  { c1: "CRM-001", c2: "CRM-002", type: "Accomplice", score: 0.85 },
  { c1: "CRM-001", c2: "CRM-006", type: "Gang Member", score: 0.90 },
  { c1: "CRM-002", c2: "CRM-006", type: "Accomplice", score: 0.75 },
  { c1: "CRM-003", c2: "CRM-007", type: "Gang Member", score: 0.80 },
  { c1: "CRM-004", c2: "CRM-001", type: "Accomplice", score: 0.40 },
  { c1: "CRM-008", c2: "CRM-003", type: "Accomplice", score: 0.65 }
];

const stmtRel = db.prepare(`INSERT INTO relationships (criminal_1_id, criminal_2_id, connection_type, association_score) VALUES (?, ?, ?, ?)`);
relationships.forEach(r => stmtRel.run(r.c1, r.c2, r.type, r.score));
console.log("✅ Relationships seeded.");

// 6. Insert Crimes
const crimes = [
  {
    id: "KSP-2025-0012",
    station_id: 1, // Koramangala
    type: "Dacoity",
    date: "2025-11-12",
    status: "Trial Pending",
    desc: "Armed robbery at a jewellery outlet in Koramangala 4th block. Weapons were brandished, and valuable gems worth 45 Lakhs were looted.",
    ipc: JSON.stringify(["IPC 395", "IPC 397"]),
    priority: "High",
    victims: JSON.stringify({ count: 3, age_range: "25-40", injury: "Minor" })
  },
  {
    id: "KSP-2026-0041",
    station_id: 1, // Koramangala
    type: "Theft",
    date: "2026-02-14",
    status: "Under Investigation",
    desc: "Daylight burglary at a locked residence. Gold ornaments and electronic equipment worth 8 Lakhs stolen.",
    ipc: JSON.stringify(["IPC 379", "IPC 380"]),
    priority: "Medium",
    victims: JSON.stringify({ count: 1, age_range: "50-60", injury: "None" })
  },
  {
    id: "KSP-2026-0089",
    station_id: 4, // Whitefield
    type: "Cyber Fraud",
    date: "2026-04-03",
    status: "Under Investigation",
    desc: "Phishing campaign targeted at tech professionals, stealing bank credentials and siphoning off 1.2 Crores across various accounts.",
    ipc: JSON.stringify(["IPC 420", "IT Act 66D"]),
    priority: "High",
    victims: JSON.stringify({ count: 12, age_range: "22-35", injury: "None" })
  },
  {
    id: "KSP-2025-0902",
    station_id: 13, // Chowk PS, Kalaburagi
    type: "Cheating",
    date: "2025-08-25",
    status: "Charge Sheeted",
    desc: "Land acquisition fraud. Fake registry documents were prepared and sold to unsuspecting buyers, defrauding them of 80 Lakhs.",
    ipc: JSON.stringify(["IPC 420", "IPC 468", "IPC 471"]),
    priority: "Medium",
    victims: JSON.stringify({ count: 4, age_range: "45-70", injury: "None" })
  },
  {
    id: "KSP-2026-0102",
    station_id: 5, // Majestic
    type: "Murder",
    date: "2026-05-18",
    status: "Under Investigation",
    desc: "Furious gang brawl near the railway station leading to a homicide. Victim was stabbed multiple times due to previous enmity.",
    ipc: JSON.stringify(["IPC 302", "IPC 120B", "IPC 34"]),
    priority: "High",
    victims: JSON.stringify({ count: 1, age_range: "28", injury: "Fatal" })
  },
  {
    id: "KSP-2026-0155",
    station_id: 6, // Lashkar PS, Mysuru
    type: "Assault",
    date: "2026-05-22",
    status: "Disposed",
    desc: "Physical altercation at a commercial complex over parking slot. Suspect physically assaulted the building watchman.",
    ipc: JSON.stringify(["IPC 323", "IPC 324"]),
    priority: "Low",
    victims: JSON.stringify({ count: 1, age_range: "45", injury: "Medium" })
  }
];

const stmtCrime = db.prepare(`
  INSERT INTO crimes (crime_id, station_id, crime_type, date_filed, status, description, ipc_sections, priority, victim_demographics)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
crimes.forEach(c => stmtCrime.run(c.id, c.station_id, c.type, c.date, c.status, c.desc, c.ipc, c.priority, c.victims));
console.log("✅ Crimes seeded.");

// 7. Insert Suspect mapping
const suspects = [
  { crime: "KSP-2025-0012", criminal: "CRM-001", involvement: "Primary Suspect" },
  { crime: "KSP-2025-0012", criminal: "CRM-002", involvement: "Co-conspirator" },
  { crime: "KSP-2026-0041", criminal: "CRM-002", involvement: "Primary Suspect" },
  { crime: "KSP-2025-0902", criminal: "CRM-003", involvement: "Primary Suspect" },
  { crime: "KSP-2026-0089", criminal: "CRM-005", involvement: "Primary Suspect" },
  { crime: "KSP-2026-0102", criminal: "CRM-004", involvement: "Primary Suspect" },
  { crime: "KSP-2026-0102", criminal: "CRM-001", involvement: "Co-conspirator" },
  { crime: "KSP-2026-0155", criminal: "CRM-006", involvement: "Primary Suspect" }
];

const stmtSuspect = db.prepare(`INSERT INTO suspects (crime_id, criminal_id, involvement) VALUES (?, ?, ?)`);
suspects.forEach(s => stmtSuspect.run(s.crime, s.criminal, s.involvement));
console.log("✅ Suspect mapping seeded.");

console.log("🎉 Database seeding fully complete!");
db.close();

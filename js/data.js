// ============ DATA STORE ============
// All records stored in localStorage so data persists across pages

const STORAGE_KEY = 'recordguard_records';

const defaultRecords = [
  { id: 1, name: 'Tata Steel – Vendor Supply Contract', cat: 'Vendor Contract', owner: 'Rahul Mehta', vendor: 'Tata Steel Ltd', expiry: '2024-06-10', notes: 'Annual renewal required. Contact procurement.' },
  { id: 2, name: 'ISO 9001 Quality Compliance Certificate', cat: 'Compliance', owner: 'Sunita Rao', vendor: 'Bureau Veritas', expiry: '2025-12-31', notes: '' },
  { id: 3, name: 'Annual Boiler Inspection Certificate', cat: 'Inspection', owner: 'Dev Pillai', vendor: 'IBR Authority', expiry: '2025-07-05', notes: 'Schedule inspection 45 days before expiry.' },
  { id: 4, name: 'Pollution Control Board License', cat: 'License', owner: 'Anjali Gupta', vendor: 'CPCB', expiry: '2025-08-22', notes: '' },
  { id: 5, name: 'Factory Fire Safety Certificate', cat: 'Safety', owner: 'Sameer Khan', vendor: 'Fire Dept', expiry: '2025-07-18', notes: 'Fire drill must be conducted before renewal.' },
  { id: 6, name: 'Property & Asset Insurance Policy', cat: 'Insurance', owner: 'Priya Sharma', vendor: 'New India Assurance', expiry: '2026-01-14', notes: '' },
  { id: 7, name: 'IT Infrastructure – AWS Agreement', cat: 'Vendor Contract', owner: 'Vivek Joshi', vendor: 'Amazon AWS', expiry: '2026-09-30', notes: '' },
  { id: 8, name: 'OHSAS 18001 Safety Training Certificate', cat: 'Safety', owner: 'Nisha Bhat', vendor: 'NSCI', expiry: '2025-07-01', notes: '' },
  { id: 9, name: 'GST Compliance Audit Document', cat: 'Compliance', owner: 'Anjali Gupta', vendor: 'GSTN', expiry: '2025-06-30', notes: '' },
  { id: 10, name: 'Electrical Installation Inspection', cat: 'Inspection', owner: 'Dev Pillai', vendor: 'CEIG', expiry: '2026-03-10', notes: '' },
  { id: 11, name: 'Group Health Insurance Policy', cat: 'Insurance', owner: 'Priya Sharma', vendor: 'ICICI Lombard', expiry: '2025-07-31', notes: 'Includes family coverage for all employees.' },
  { id: 12, name: 'FSSAI Food Safety License', cat: 'License', owner: 'Rahul Mehta', vendor: 'FSSAI', expiry: '2025-12-15', notes: '' }
];

function getRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRecords));
  return defaultRecords;
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getNextId() {
  const records = getRecords();
  return records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
}

function addRecord(record) {
  const records = getRecords();
  record.id = getNextId();
  records.push(record);
  saveRecords(records);
  return record;
}

function updateRecord(id, updatedData) {
  const records = getRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updatedData };
    saveRecords(records);
    return records[index];
  }
  return null;
}

function deleteRecord(id) {
  const records = getRecords().filter(r => r.id !== id);
  saveRecords(records);
}

function getRecordById(id) {
  return getRecords().find(r => r.id === id) || null;
}

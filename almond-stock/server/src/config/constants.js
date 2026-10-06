// Edit these to match the client's real products.
// Grades are fixed in code so reports stay consistent.
export const GRADES = ['Whole', 'Broken', 'Sliced'];

// Stock below this level (in kg) is flagged as low.
export const LOW_STOCK_KG = { Whole: 300, Broken: 100, Sliced: 150 };

// Prefilled sale rate per kg (INR). Staff can change it for each sale.
export const DEFAULT_RATE = { Whole: 780, Broken: 640, Sliced: 900 };

export const ROLES = ['admin', 'staff'];

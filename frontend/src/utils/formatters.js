/**
 * Standard Indian Rupee (INR) currency formatter.
 * Formats according to en-IN locale with commas: e.g., ₹1,25,000
 */
export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const INDIAN_DESTINATIONS = [
  'Indore', 'Bhopal', 'Ujjain', 'Gwalior',
  'Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer',
  'Mumbai', 'Pune', 'Nagpur',
  'Delhi', 'Agra', 'Varanasi',
  'Bengaluru', 'Hyderabad', 'Chennai', 'Kochi',
  'Goa', 'Manali', 'Shimla', 'Rishikesh', 'Srinagar',
  'Kolkata', 'Darjeeling', 'Guwahati'
];

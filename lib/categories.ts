export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  groceries: ['coles', 'woolworths', 'woolies', 'iga', 'supermarket'],
  transport: ['ptv', 'uber', 'didi', 'ola', 'taxi', 'public transport'],
  utilities: ['energy', 'water', 'gas', 'internet', 'telstra', 'optus', 'vodafone', 'electricity'],
  rent: ['rent', 'real estate'],
  education: ['university', 'tafe', 'school', 'education'],
  shopping: ['kmart', 'target', 'big w', 'shopping', 'myer', 'david jones'],
  food: ['restaurant', 'cafe', 'mcdonalds', 'hungry jacks', 'kfc', 'snack bar', 'food', 'pizza', 'burger', 'sushi', 'noodle', 'bakery', 'coffee', 'tea', 'drink', 'ice cream', 'dessert', 'lunch', 'dinner', 'breakfast'],
  entertainment: ['entertainment', 'cinema', 'eventbrite', 'ticketmaster', 'netflix', 'spotify'],
  healthcare: ['health', 'pharmacy', 'chemist', 'doctor', 'hospital'],
  friends: ['friends', 'mobile banking payment', 'transfer to', 'transfer from', 'pay anyone', 'osko', 'pay id'],
};

export const CATEGORY_COLORS: Record<string, string> = {
  groceries: 'bg-green-100 text-green-800',
  transport: 'bg-blue-100 text-blue-800',
  utilities: 'bg-yellow-100 text-yellow-800',
  rent: 'bg-red-100 text-red-800',
  education: 'bg-purple-100 text-purple-800',
  shopping: 'bg-pink-100 text-pink-800',
  food: 'bg-orange-100 text-orange-800',
  entertainment: 'bg-indigo-100 text-indigo-800',
  healthcare: 'bg-cyan-100 text-cyan-800',
  friends: 'bg-teal-100 text-teal-800',
  misc: 'bg-gray-100 text-gray-800',
};

export function getCategoryFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  for (const category in CATEGORY_KEYWORDS) {
    if (CATEGORY_KEYWORDS[category].some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  
  return 'misc';
}

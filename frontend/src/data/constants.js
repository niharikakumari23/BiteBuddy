import { Flame, Utensils, Leaf } from 'lucide-react';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', icon: Flame },
  { key: 'lunch', label: 'Lunch', icon: Utensils },
  { key: 'dinner', label: 'Dinner', icon: Leaf },
];

export const ITEM_COSTS = {
  'Oats': 45, 'Mixed Berries': 120, 'Chicken Breast': 320, 'Salmon Fillet': 480, 'Eggs': 90, 'Avocado': 60,
  'Mixed Greens': 55, 'Lentils': 80, 'Greek Yogurt': 110, 'Quinoa': 160, 'Pasta': 70, 'Cherry Tomatoes': 50,
  'Bacon': 280, 'Ribeye Steak': 750, 'Cheese': 220, 'Heavy Cream': 130, 'Almonds': 190, 'Zucchini': 40, 'Butter': 65,
  'Chickpeas': 60, 'Tofu': 85, 'Chia Seeds': 170, 'Almond Milk': 130, 'Mixed Veggies': 90, 'Coconut Milk': 75, 'Peanut Butter': 200,
  'Tuna Cans': 180, 'Beef (Lean)': 580, 'Whey Protein': 2200, 'Cottage Cheese': 95, 'Turkey Breast': 420, 'Broccoli': 45,
};

export const DEFAULT_ITEM_COST = 80;

export function getItemCost(itemName) {
  return ITEM_COSTS[itemName] ?? DEFAULT_ITEM_COST;
}

export const PLATFORMS = [
  {
    id: 'blinkit',
    label: 'Blinkit',
    color: '#f8c12c',
    textColor: '#1a1a1a',
    emoji: '⚡',
    getUrl: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'zepto',
    label: 'Zepto',
    color: '#8b5cf6',
    textColor: '#ffffff',
    emoji: '🟣',
    getUrl: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
  },
  {
    id: 'swiggy',
    label: 'Instamart',
    color: '#fc8019',
    textColor: '#ffffff',
    emoji: '🧡',
    getUrl: (q) => `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(q)}`,
  },
];

export const AI_SUGGESTIONS = [
  'Suggest a low-carb breakfast', 'What can I eat for protein?',
  'Give me a vegan dinner idea', 'How many calories should I eat?',
];

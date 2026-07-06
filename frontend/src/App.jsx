import { useState, useRef, useEffect, useCallback } from 'react'
import React from "react";
import {
  Camera,
  Utensils, MessageSquare, Send, X, Sparkles, ChevronLeft,
  ChevronRight, Clock, Flame, Droplets, Dumbbell, Check,
  ShoppingCart, Calendar, Target, Plus, RefreshCw, Leaf,
  ExternalLink, IndianRupee
} from 'lucide-react'
import './App.css'

// ─── DATA ───────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', icon: Flame },
  { key: 'lunch', label: 'Lunch', icon: Utensils },
  { key: 'dinner', label: 'Dinner', icon: Leaf },
]

const MEAL_PLANS = {
  balanced: {
    Mon: { breakfast: { name: 'Oatmeal & Berries', kcal: 320, tag: 'healthy' }, lunch: { name: 'Grilled Chicken Wrap', kcal: 480, tag: 'quick' }, dinner: { name: 'Salmon & Veggies', kcal: 550, tag: 'healthy' } },
    Tue: { breakfast: { name: 'Avocado Toast + Egg', kcal: 380, tag: 'quick' }, lunch: { name: 'Lentil Soup', kcal: 390, tag: 'vegan' }, dinner: { name: 'Stir-Fry Tofu', kcal: 430, tag: 'vegan' } },
    Wed: { breakfast: { name: 'Greek Yogurt Parfait', kcal: 290, tag: 'healthy' }, lunch: { name: 'Caesar Salad', kcal: 410, tag: 'quick' }, dinner: { name: 'Beef Tacos', kcal: 590, tag: null } },
    Thu: { breakfast: { name: 'Banana Smoothie', kcal: 310, tag: 'quick' }, lunch: { name: 'Quinoa Bowl', kcal: 450, tag: 'vegan' }, dinner: { name: 'Grilled Turkey', kcal: 520, tag: 'healthy' } },
    Fri: { breakfast: { name: 'Scrambled Eggs', kcal: 340, tag: 'quick' }, lunch: { name: 'Tuna Sandwich', kcal: 460, tag: null }, dinner: { name: 'Pasta Primavera', kcal: 510, tag: 'vegan' } },
    Sat: { breakfast: { name: 'Pancakes & Maple', kcal: 450, tag: null }, lunch: { name: 'BBQ Chicken', kcal: 520, tag: null }, dinner: { name: 'Veggie Pizza', kcal: 580, tag: 'vegan' } },
    Sun: { breakfast: { name: 'Fruit Bowl', kcal: 260, tag: 'healthy' }, lunch: { name: 'Chicken Soup', kcal: 430, tag: 'healthy' }, dinner: { name: 'Garlic Butter Pasta', kcal: 570, tag: 'quick' } },
  },
  keto: {
    Mon: { breakfast: { name: 'Bacon & Eggs', kcal: 450, tag: 'keto' }, lunch: { name: 'Cobb Salad', kcal: 520, tag: 'keto' }, dinner: { name: 'Ribeye Steak', kcal: 680, tag: 'keto' } },
    Tue: { breakfast: { name: 'Keto Waffles', kcal: 380, tag: 'keto' }, lunch: { name: 'Avocado Tuna', kcal: 490, tag: 'keto' }, dinner: { name: 'Butter Chicken', kcal: 620, tag: 'keto' } },
    Wed: { breakfast: { name: 'Cream Cheese Omelette', kcal: 420, tag: 'keto' }, lunch: { name: 'BLT Lettuce Wrap', kcal: 390, tag: 'keto' }, dinner: { name: 'Pork Belly', kcal: 660, tag: 'keto' } },
    Thu: { breakfast: { name: 'Bulletproof Coffee', kcal: 280, tag: 'keto' }, lunch: { name: 'Keto Bowl', kcal: 530, tag: 'keto' }, dinner: { name: 'Lamb Chops', kcal: 590, tag: 'keto' } },
    Fri: { breakfast: { name: 'Smoked Salmon', kcal: 350, tag: 'keto' }, lunch: { name: 'Egg Salad', kcal: 400, tag: 'keto' }, dinner: { name: 'Grilled Salmon', kcal: 560, tag: 'keto' } },
    Sat: { breakfast: { name: 'Keto Pancakes', kcal: 330, tag: 'keto' }, lunch: { name: 'Zucchini Noodles', kcal: 370, tag: 'keto' }, dinner: { name: 'Steak & Asparagus', kcal: 640, tag: 'keto' } },
    Sun: { breakfast: { name: 'Almond Smoothie', kcal: 290, tag: 'keto' }, lunch: { name: 'Greek Salad', kcal: 380, tag: 'keto' }, dinner: { name: 'Chicken Thighs', kcal: 580, tag: 'keto' } },
  },
  vegan: {
    Mon: { breakfast: { name: 'Chia Pudding', kcal: 280, tag: 'vegan' }, lunch: { name: 'Falafel Wrap', kcal: 450, tag: 'vegan' }, dinner: { name: 'Lentil Dal', kcal: 420, tag: 'vegan' } },
    Tue: { breakfast: { name: 'Acai Bowl', kcal: 340, tag: 'vegan' }, lunch: { name: 'Buddha Bowl', kcal: 490, tag: 'vegan' }, dinner: { name: 'Tofu Stir-Fry', kcal: 400, tag: 'vegan' } },
    Wed: { breakfast: { name: 'Overnight Oats', kcal: 310, tag: 'vegan' }, lunch: { name: 'Veggie Burrito', kcal: 510, tag: 'vegan' }, dinner: { name: 'Chickpea Curry', kcal: 450, tag: 'vegan' } },
    Thu: { breakfast: { name: 'Green Smoothie', kcal: 260, tag: 'vegan' }, lunch: { name: 'Tomato Soup', kcal: 320, tag: 'vegan' }, dinner: { name: 'Mushroom Risotto', kcal: 470, tag: 'vegan' } },
    Fri: { breakfast: { name: 'Peanut Butter Toast', kcal: 340, tag: 'vegan' }, lunch: { name: 'Lentil Salad', kcal: 390, tag: 'vegan' }, dinner: { name: 'Veggie Pasta', kcal: 430, tag: 'vegan' } },
    Sat: { breakfast: { name: 'Banana Pancakes', kcal: 360, tag: 'vegan' }, lunch: { name: 'Avocado Sushi', kcal: 420, tag: 'vegan' }, dinner: { name: 'Black Bean Tacos', kcal: 460, tag: 'vegan' } },
    Sun: { breakfast: { name: 'Fruit Smoothie Bowl', kcal: 290, tag: 'vegan' }, lunch: { name: 'Stuffed Peppers', kcal: 400, tag: 'vegan' }, dinner: { name: 'Cauliflower Curry', kcal: 380, tag: 'vegan' } },
  },
  'high-protein': {
    Mon: { breakfast: { name: 'Protein Pancakes', kcal: 420, tag: 'healthy' }, lunch: { name: 'Chicken Breast', kcal: 520, tag: 'healthy' }, dinner: { name: 'Tuna Steak', kcal: 580, tag: 'healthy' } },
    Tue: { breakfast: { name: '5-Egg Omelette', kcal: 470, tag: 'healthy' }, lunch: { name: 'Turkey Burger', kcal: 540, tag: null }, dinner: { name: 'Beef Meatballs', kcal: 620, tag: null } },
    Wed: { breakfast: { name: 'Cottage Cheese Bowl', kcal: 350, tag: 'healthy' }, lunch: { name: 'Tuna Salad', kcal: 460, tag: 'healthy' }, dinner: { name: 'Salmon Fillet', kcal: 570, tag: 'healthy' } },
    Thu: { breakfast: { name: 'Whey Smoothie', kcal: 380, tag: 'quick' }, lunch: { name: 'Grilled Chicken', kcal: 500, tag: 'healthy' }, dinner: { name: 'Shrimp & Broccoli', kcal: 490, tag: 'healthy' } },
    Fri: { breakfast: { name: 'Greek Yogurt & Nuts', kcal: 360, tag: 'quick' }, lunch: { name: 'Protein Bowl', kcal: 530, tag: 'healthy' }, dinner: { name: 'Steak & Eggs', kcal: 660, tag: null } },
    Sat: { breakfast: { name: 'Egg White Omelette', kcal: 290, tag: 'healthy' }, lunch: { name: 'Chicken Wrap', kcal: 480, tag: 'quick' }, dinner: { name: 'Pork Tenderloin', kcal: 540, tag: 'healthy' } },
    Sun: { breakfast: { name: 'Ricotta Crepes', kcal: 390, tag: null }, lunch: { name: 'Canned Tuna Salad', kcal: 380, tag: 'quick' }, dinner: { name: 'Turkey Meatloaf', kcal: 530, tag: 'healthy' } },
  },
}

const SHOPPING_LISTS = {
  balanced: [
    { name: 'Oats', qty: '500g' }, { name: 'Mixed Berries', qty: '200g' }, { name: 'Chicken Breast', qty: '1kg' },
    { name: 'Salmon Fillet', qty: '400g' }, { name: 'Eggs', qty: '12' }, { name: 'Avocado', qty: '3' },
    { name: 'Mixed Greens', qty: '300g' }, { name: 'Lentils', qty: '400g' }, { name: 'Greek Yogurt', qty: '500g' },
    { name: 'Quinoa', qty: '300g' }, { name: 'Pasta', qty: '500g' }, { name: 'Cherry Tomatoes', qty: '250g' },
  ],
  keto: [
    { name: 'Bacon', qty: '300g' }, { name: 'Ribeye Steak', qty: '600g' }, { name: 'Eggs', qty: '18' },
    { name: 'Avocado', qty: '5' }, { name: 'Cheese', qty: '300g' }, { name: 'Heavy Cream', qty: '250ml' },
    { name: 'Almonds', qty: '200g' }, { name: 'Zucchini', qty: '400g' }, { name: 'Butter', qty: '200g' },
  ],
  vegan: [
    { name: 'Chickpeas', qty: '400g' }, { name: 'Lentils', qty: '600g' }, { name: 'Tofu', qty: '400g' },
    { name: 'Chia Seeds', qty: '150g' }, { name: 'Almond Milk', qty: '1L' }, { name: 'Quinoa', qty: '400g' },
    { name: 'Mixed Veggies', qty: '800g' }, { name: 'Coconut Milk', qty: '400ml' }, { name: 'Peanut Butter', qty: '250g' },
  ],
  'high-protein': [
    { name: 'Chicken Breast', qty: '1.5kg' }, { name: 'Eggs', qty: '24' }, { name: 'Tuna Cans', qty: '4' },
    { name: 'Beef (Lean)', qty: '800g' }, { name: 'Whey Protein', qty: '1 tub' }, { name: 'Greek Yogurt', qty: '1kg' },
    { name: 'Cottage Cheese', qty: '400g' }, { name: 'Turkey Breast', qty: '600g' }, { name: 'Broccoli', qty: '600g' },
  ],
}

// ─── PLATFORM REDIRECT HELPERS ──────────────────────────────────────────────

// Estimated INR costs per item (realistic Indian market prices)
const ITEM_COSTS = {
  // Balanced
  'Oats': 45,
  'Mixed Berries': 120,
  'Chicken Breast': 320,
  'Salmon Fillet': 480,
  'Eggs': 90,
  'Avocado': 60,
  'Mixed Greens': 55,
  'Lentils': 80,
  'Greek Yogurt': 110,
  'Quinoa': 160,
  'Pasta': 70,
  'Cherry Tomatoes': 50,
  // Keto
  'Bacon': 280,
  'Ribeye Steak': 750,
  'Cheese': 220,
  'Heavy Cream': 130,
  'Almonds': 190,
  'Zucchini': 40,
  'Butter': 65,
  // Vegan
  'Chickpeas': 60,
  'Tofu': 85,
  'Chia Seeds': 170,
  'Almond Milk': 130,
  'Mixed Veggies': 90,
  'Coconut Milk': 75,
  'Peanut Butter': 200,
  // High-Protein
  'Tuna Cans': 180,
  'Beef (Lean)': 580,
  'Whey Protein': 2200,
  'Cottage Cheese': 95,
  'Turkey Breast': 420,
  'Broccoli': 45,
}

const DEFAULT_ITEM_COST = 80  // fallback ₹ per item

function getItemCost(itemName) {
  return ITEM_COSTS[itemName] ?? DEFAULT_ITEM_COST
}

// Build search URLs for each quick-commerce platform
const PLATFORMS = [
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
]

const RECIPE_DETAILS = {
  'Oatmeal & Berries': {
    tags: ['healthy'], time: '10 mins', difficulty: 'Easy',
    ingredients: ['1 cup rolled oats', '2 cups almond milk', '1 cup mixed berries', '1 tbsp honey', 'Pinch of cinnamon'],
    steps: ['Bring milk to a boil in a saucepan over medium heat.', 'Add oats and stir constantly for 5 minutes until thickened.', 'Top with fresh berries, drizzle honey, and sprinkle cinnamon.'],
  },
  'Grilled Chicken Wrap': {
    tags: ['quick'], time: '15 mins', difficulty: 'Easy',
    ingredients: ['1 chicken breast', '1 large tortilla', '1/2 cup mixed greens', '2 tbsp hummus', '1 tomato, sliced', 'Lemon juice, salt, pepper'],
    steps: ['Season chicken with salt, pepper, and lemon juice. Grill 6-7 min per side.', 'Slice the cooked chicken into thin strips.', 'Spread hummus on tortilla, add greens, chicken, and tomato. Roll tightly.'],
  },
  'Salmon & Veggies': {
    tags: ['healthy'], time: '25 mins', difficulty: 'Medium',
    ingredients: ['1 salmon fillet (200g)', '1 cup broccoli florets', '1 zucchini, sliced', '2 tbsp olive oil', 'Garlic, lemon, herbs'],
    steps: ['Preheat oven to 200°C. Toss veggies in olive oil, garlic, salt.', 'Place salmon on baking sheet, rub with olive oil and herbs.', 'Bake salmon 15-18 min, vegetables 20 min until tender.'],
  },
}

const AI_SUGGESTIONS = [
  'Suggest a low-carb breakfast', 'What can I eat for protein?',
  'Give me a vegan dinner idea', 'How many calories should I eat?',
]

const MACRO_GOALS = { balanced: { protein: 140, carbs: 220, fat: 65 }, keto: { protein: 160, carbs: 25, fat: 180 }, vegan: { protein: 90, carbs: 280, fat: 60 }, 'high-protein': { protein: 220, carbs: 150, fat: 70 } }
const GOAL_CALORIE_RANGES = { balanced: 2000, keto: 1900, vegan: 1750, 'high-protein': 2200 }

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getTodayDayIndex() {
  const d = new Date().getDay() // 0=Sun,1=Mon...
  return d === 0 ? 6 : d - 1   // Mon=0 ... Sun=6
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

import MealScanner from './components/MealScanner.jsx';

export default function App() {
  // Goal & Diet
  const [diet, setDiet] = useState('balanced')
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [weightGoal, setWeightGoal] = useState('maintain')

  // Planner
  const weekOffset = 0
  const todayIdx = getTodayDayIndex()

  // Recipe modal
  const [selectedMeal, setSelectedMeal] = useState(null) // { mealName, day, type }

  // Shopping list
  const [checkedItems, setCheckedItems] = useState(new Set())

  // AI Assistant Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Active tab
  const [activeTab, setActiveTab] = useState('planner')
  const [selectedImage, setSelectedImage] = useState(null);

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const plan = MEAL_PLANS[diet]
  const shopping = SHOPPING_LISTS[diet]
  const macroGoals = MACRO_GOALS[diet]

  // Compute consumed calories from plan (Mon-today)
  const consumedCals = DAYS.slice(0, todayIdx + 1).reduce((sum, day) => {
    const d = plan[day]
    return sum + (d.breakfast?.kcal || 0) + (d.lunch?.kcal || 0) + (d.dinner?.kcal || 0)
  }, 0)

  const dailyCals = Object.values(plan[DAYS[todayIdx]]).reduce((s, m) => s + (m?.kcal || 0), 0)
  const calPct = Math.min(100, Math.round((dailyCals / calorieGoal) * 100))

  // Scroll AI messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Send message to AI backend
  const sendMessage = useCallback(async (text) => {
    const msgText = text || aiInput.trim()
    if (!msgText) return
    setAiInput('')
    const userMsg = { role: 'user', content: msgText }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setIsTyping(true)

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please make sure the backend server is running on port 8000! 🥗" }])
    } finally {
      setIsTyping(false)
    }
  }, [aiInput, messages])

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  const toggleShoppingItem = (idx) => {
    setCheckedItems(prev => {
      const n = new Set(prev)
      n.has(idx) ? n.delete(idx) : n.add(idx)
      return n
    })
  }

  const getMealDetail = (mealName) => RECIPE_DETAILS[mealName] || null

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ── TOP NAV ── */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="nav-logo-mark">
            <Utensils />
          </div>
          <span className="nav-brand-name">Bite<span>Buddy</span></span>
        </div>

        <div className="nav-center">
          <div className="nav-tabs">
            {[
              { id: 'planner', label: 'Meal Planner', icon: Calendar },
              { id: 'macros', label: 'Macros', icon: Target },
              { id: 'shop', label: 'Shopping', icon: ShoppingCart },
              { id: 'scanner', label: 'Food Scanner', icon: Camera },
            ].map(tab => (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="nav-right">
          <button
            id="btn-open-ai"
            className={`nav-ai-btn ${drawerOpen ? 'active' : ''}`}
            onClick={() => setDrawerOpen(v => !v)}
          >
            <Sparkles />
            {drawerOpen ? 'Close AI' : 'Ask AI'}
          </button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="app-main">

        {/* Stats Bar */}
        <div className="stats-bar">
          <StatCard color="green" icon={Flame} label="Today's Calories" value={dailyCals} unit="kcal" pct={calPct} />
          <StatCard color="blue" icon={Dumbbell} label="Protein Goal" value={`${macroGoals.protein}`} unit="g" pct={75} />
          <StatCard color="amber" icon={Droplets} label="Carbs Goal" value={`${macroGoals.carbs}`} unit="g" pct={60} />
          <StatCard color="purple" icon={Target} label="Calorie Goal" value={calorieGoal} unit="kcal" pct={calPct} />
        </div>

        {/* PLANNER TAB */}
        {activeTab === 'planner' && (
          <div className="dashboard-grid">
            {/* Weekly Meal Planner */}
            <div>
              <div className="panel planner-panel" id="planner-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <div className="panel-title-icon"><Calendar /></div>
                    Weekly Meal Plan
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="panel-badge">{diet.charAt(0).toUpperCase() + diet.slice(1)}</span>
                    <div className="planner-week-nav">
                      <button className="week-nav-btn" id="btn-prev-week"><ChevronLeft /></button>
                      <span className="week-label">This Week</span>
                      <button className="week-nav-btn" id="btn-next-week"><ChevronRight /></button>
                    </div>
                  </div>
                </div>
                <div className="planner-body">
                  <div className="planner-table">
                    {/* Header row: spacer + day labels */}
                    <div />
                    {DAYS.map((day, di) => (
                      <div key={day} className={`planner-day-label ${di === todayIdx ? 'today' : ''}`}>
                        {day}
                        {di === todayIdx && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', margin: '3px auto 0' }} />}
                      </div>
                    ))}

                    {/* Rows for each meal type */}
                    {MEAL_TYPES.map(({ key, label, icon: Icon }) => (
                      <React.Fragment key={key}>
                        <div key={`label-${key}`} className="planner-row-label">
                          <Icon />
                          {label}
                        </div>
                        {DAYS.map((day, di) => {
                          const meal = plan[day]?.[key]
                          return (
                            <div
                              key={`${day}-${key}`}
                              id={`cell-${day}-${key}`}
                              className={`meal-cell ${di === todayIdx ? 'today' : ''}`}
                              onClick={() => meal && setSelectedMeal({ ...meal, day, type: label })}
                            >
                              {meal ? (
                                <>
                                  <div className="meal-cell-name">{meal.name}</div>
                                  <div>
                                    <div className="meal-cell-meta">
                                      <Flame />{meal.kcal} kcal
                                    </div>
                                    {meal.tag && <div className={`meal-cell-tag ${meal.tag}`}>{meal.tag}</div>}
                                  </div>
                                </>
                              ) : (
                                <div className="meal-cell-empty"><Plus /></div>
                              )}
                            </div>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>



            {/* Goal Setup */}
            <div className="panel goal-panel" id="goal-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <div className="panel-title-icon"><Target /></div>
                  My Goals & Diet
                </div>
              </div>
              <div className="goal-body">
                <div className="goal-group">
                  <div className="goal-label">Diet Type</div>
                  <div className="goal-chips">
                    {[['balanced', 'Balanced'], ['keto', 'Keto'], ['vegan', 'Vegan'], ['high-protein', 'High-Protein']].map(([val, lbl]) => (
                      <button
                        key={val}
                        id={`chip-diet-${val}`}
                        className={`goal-chip ${diet === val ? 'active' : ''}`}
                        onClick={() => { setDiet(val); setCalorieGoal(GOAL_CALORIE_RANGES[val]) }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="goal-group">
                  <div className="goal-label">Weight Goal</div>
                  <div className="goal-chips">
                    {[['lose', 'Lose Weight'], ['maintain', 'Maintain'], ['gain', 'Build Muscle']].map(([val, lbl]) => (
                      <button key={val} id={`chip-goal-${val}`} className={`goal-chip ${weightGoal === val ? 'active' : ''}`} onClick={() => setWeightGoal(val)}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="goal-group">
                  <div className="goal-label">Daily Calories</div>
                  <input
                    id="input-calorie-goal"
                    type="number"
                    className="goal-number-input"
                    value={calorieGoal}
                    min={800}
                    max={5000}
                    step={50}
                    onChange={e => setCalorieGoal(Number(e.target.value))}
                  />
                </div>

                <div className="goal-group">
                  <button
                    id="btn-regenerate"
                    className="goal-apply-btn"
                    onClick={() => { setCheckedItems(new Set()) }}
                  >
                    <RefreshCw /> Regenerate Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="right-sidebar">
              {/* Stats Bar */}
              <div className="stats-bar">
                <StatCard color="green" icon={Flame} label="Today's Calories" value={dailyCals} unit="kcal" pct={calPct} />
                <StatCard color="blue" icon={Dumbbell} label="Protein Goal" value={`${macroGoals.protein}`} unit="g" pct={75} />
                <StatCard color="amber" icon={Droplets} label="Carbs Goal" value={`${macroGoals.carbs}`} unit="g" pct={60} />
                <StatCard color="purple" icon={Target} label="Calorie Goal" value={calorieGoal} unit="kcal" pct={calPct} />
              </div>

              {/* Macros Panel */}
              <div className="panel macros-panel" id="macros-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <div className="panel-title-icon"><Dumbbell /></div>
                    Today's Macros
                  </div>
                </div>
                <div className="macros-body">
                  {[
                    { key: 'cal', label: 'Calories', value: dailyCals, goal: calorieGoal, unit: 'kcal', color: 'cal' },
                    { key: 'protein', label: 'Protein', value: macroGoals.protein, goal: macroGoals.protein, unit: 'g', color: 'protein' },
                    { key: 'carbs', label: 'Carbs', value: macroGoals.carbs, goal: macroGoals.carbs, unit: 'g', color: 'carbs' },
                    { key: 'fat', label: 'Fat', value: macroGoals.fat, goal: macroGoals.fat, unit: 'g', color: 'fat' },
                  ].map(m => (
                    <div key={m.key} className="macro-row">
                      <div className="macro-row-header">
                        <div className="macro-name">
                          <div className={`macro-dot ${m.color}`} />
                          {m.label}
                        </div>
                        <div className="macro-value">{m.value}{m.unit !== 'kcal' ? `g` : ` kcal`}</div>
                      </div>
                      <div className="macro-bar-bg">
                        <div className={`macro-bar-fill ${m.color}`} style={{ width: `${Math.min(100, Math.round((m.value / m.goal) * 100))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shopping List */}
              <div className="panel" id="shopping-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <div className="panel-title-icon"><ShoppingCart /></div>
                    Shopping List
                  </div>
                  <span className="panel-badge">{shopping.length - checkedItems.size} left</span>
                </div>
                <div className="shopping-body">
                  {shopping.map((item, i) => (
                    <div
                      key={i}
                      id={`shop-item-${i}`}
                      className={`shopping-item ${checkedItems.has(i) ? 'is-checked' : ''}`}
                    >
                      <div
                        className={`shopping-check ${checkedItems.has(i) ? 'checked' : ''}`}
                        onClick={() => toggleShoppingItem(i)}
                      >
                        {checkedItems.has(i) && <Check />}
                      </div>
                      <div className="shopping-item-content" onClick={() => toggleShoppingItem(i)}>
                        <div className="shopping-item-top">
                          <span className={`shopping-item-name ${checkedItems.has(i) ? 'checked' : ''}`}>{item.name}</span>
                          <span className="shopping-item-qty">{item.qty}</span>
                          <span className="shopping-item-cost">~₹{getItemCost(item.name)}</span>
                        </div>
                      </div>
                      <div className="shop-platforms" onClick={e => e.stopPropagation()}>
                        {PLATFORMS.map(p => (
                          <a
                            key={p.id}
                            id={`shop-item-${i}-${p.id}`}
                            href={p.getUrl(item.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shop-platform-btn"
                            style={{ '--pbg': p.color, '--pfg': p.textColor }}
                            title={`Buy on ${p.label}`}
                          >
                            <span className="shop-platform-emoji">{p.emoji}</span>
                            <span className="shop-platform-label">{p.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="shop-total">
                  <IndianRupee className="shop-total-icon" />
                  <span className="shop-total-label">Est. Total</span>
                  <span className="shop-total-value">
                    ₹{shopping.reduce((sum, item, i) => checkedItems.has(i) ? sum : sum + getItemCost(item.name), 0).toLocaleString('en-IN')}
                  </span>
                  <span className="shop-total-sub">{shopping.length - checkedItems.size} items</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MACROS TAB */}
        {activeTab === 'macros' && (
          <div className="panel" id="macros-tab-panel" style={{ maxWidth: 700 }}>
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-title-icon"><Target /></div>
                Macro Breakdown
              </div>
            </div>
            <div className="macros-body" style={{ padding: '24px 28px', gap: 20 }}>
              {[
                { key: 'cal', label: 'Calories', value: dailyCals, goal: calorieGoal, unit: 'kcal', color: 'cal', desc: 'Total energy from today\'s meals' },
                { key: 'protein', label: 'Protein', value: macroGoals.protein, goal: macroGoals.protein, unit: 'g', color: 'protein', desc: 'Builds & repairs muscle tissue' },
                { key: 'carbs', label: 'Carbohydrates', value: macroGoals.carbs, goal: macroGoals.carbs, unit: 'g', color: 'carbs', desc: 'Primary fuel source for energy' },
                { key: 'fat', label: 'Healthy Fats', value: macroGoals.fat, goal: macroGoals.fat, unit: 'g', color: 'fat', desc: 'Supports hormones & brain health' },
              ].map(m => (
                <div key={m.key} className="macro-row" style={{ gap: 10 }}>
                  <div className="macro-row-header">
                    <div className="macro-name" style={{ fontSize: 15 }}>
                      <div className={`macro-dot ${m.color}`} style={{ width: 10, height: 10 }} />
                      {m.label}
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>{m.desc}</span>
                    </div>
                    <div className="macro-value" style={{ fontSize: 16 }}>
                      {m.value} <span style={{ fontWeight: 400, fontSize: 12 }}>{m.unit}</span>
                    </div>
                  </div>
                  <div className="macro-bar-bg" style={{ height: 10 }}>
                    <div className={`macro-bar-fill ${m.color}`} style={{ width: `${Math.min(100, Math.round((m.value / m.goal) * 100))}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{Math.round((m.value / m.goal) * 100)}% of goal</span>
                    <span>Goal: {m.goal} {m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHOPPING TAB */}
        {activeTab === 'shop' && (
          <div className="panel" id="shopping-tab-panel" style={{ maxWidth: 680 }}>
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-title-icon"><ShoppingCart /></div>
                Weekly Shopping List
              </div>
              <span className="panel-badge">{shopping.length - checkedItems.size} remaining</span>
            </div>


            {/* Platform Legend */}
            <div className="shop-tab-legend">
              <span className="shop-legend-label">Buy instantly on:</span>
              {PLATFORMS.map(p => (
                <span key={p.id} className="shop-legend-badge" style={{ background: p.color, color: p.textColor }}>
                  {p.emoji} {p.label}
                </span>
              ))}
            </div>

            <div className="shopping-body" style={{ maxHeight: 'none', padding: '8px 20px 16px' }}>
              {shopping.map((item, i) => (
                <div key={i} id={`shop-tab-item-${i}`} className={`shopping-item shopping-item-full ${checkedItems.has(i) ? 'is-checked' : ''}`}>
                  <div
                    className={`shopping-check ${checkedItems.has(i) ? 'checked' : ''}`}
                    onClick={() => toggleShoppingItem(i)}
                  >
                    {checkedItems.has(i) && <Check />}
                  </div>

                  <div className="shopping-item-content" onClick={() => toggleShoppingItem(i)}>
                    <div className="shopping-item-top">
                      <span className={`shopping-item-name ${checkedItems.has(i) ? 'checked' : ''}`}>{item.name}</span>
                      <span className="shopping-item-qty">{item.qty}</span>
                      <span className="shopping-item-cost">~₹{getItemCost(item.name)}</span>
                    </div>
                  </div>

                  <div className="shop-platforms" onClick={e => e.stopPropagation()}>
                    {PLATFORMS.map(p => (
                      <a
                        key={p.id}
                        id={`shop-tab-item-${i}-${p.id}`}
                        href={p.getUrl(item.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shop-platform-btn"
                        style={{ '--pbg': p.color, '--pfg': p.textColor }}
                        title={`Buy ${item.name} on ${p.label}`}
                      >
                        <span className="shop-platform-emoji">{p.emoji}</span>
                        <span className="shop-platform-label">{p.label}</span>
                        <ExternalLink className="shop-platform-ext" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Cost Bar */}
            <div className="shop-total shop-total-full">
              <IndianRupee className="shop-total-icon" />
              <div className="shop-total-text">
                <span className="shop-total-label">Estimated Total</span>
                <span className="shop-total-sub">{shopping.length - checkedItems.size} of {shopping.length} items remaining</span>
              </div>
              <span className="shop-total-value">
                ₹{shopping.reduce((sum, item, i) => checkedItems.has(i) ? sum : sum + getItemCost(item.name), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        )}
      </main>
      {/* AI SCANNER */}
      {activeTab === 'scanner' && <MealScanner />}


      {/* ── RECIPE DETAIL MODAL ── */}
      {selectedMeal && (
        <div className="modal-overlay" id="recipe-modal-overlay" onClick={() => setSelectedMeal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-hero">
              <Utensils className="modal-hero-icon" />
              <button className="modal-close" id="btn-modal-close" onClick={() => setSelectedMeal(null)}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <div className="modal-tags">
                  {(getMealDetail(selectedMeal.name)?.tags || []).map((t, i) => (
                    <span key={i} className={`modal-tag ${t}`}>{t}</span>
                  ))}
                  <span className="modal-tag default">{selectedMeal.type}</span>
                  <span className="modal-tag default">{selectedMeal.day}</span>
                </div>
                <h2 className="modal-title" style={{ marginTop: 10 }}>{selectedMeal.name}</h2>
                <div className="modal-meta" style={{ marginTop: 8 }}>
                  <div className="modal-meta-item"><Clock />{getMealDetail(selectedMeal.name)?.time || '20 mins'}</div>
                  <div className="modal-meta-item"><Flame />{selectedMeal.kcal} kcal</div>
                  <div className="modal-meta-item"><Target />{getMealDetail(selectedMeal.name)?.difficulty || 'Easy'}</div>
                </div>
              </div>

              {getMealDetail(selectedMeal.name) ? (
                <>
                  <div>
                    <div className="modal-section-title">Ingredients</div>
                    <ul className="ingredient-list">
                      {getMealDetail(selectedMeal.name).ingredients.map((ing, i) => (
                        <li key={i} className="ingredient-item">
                          <input type="checkbox" id={`modal-ing-${i}`} />
                          <label htmlFor={`modal-ing-${i}`}>{ing}</label>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="modal-section-title">Preparation Steps</div>
                    <div className="steps-list">
                      {getMealDetail(selectedMeal.name).steps.map((step, i) => (
                        <div key={i} className="step-item">
                          <div className="step-num">{i + 1}</div>
                          <p className="step-text">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  <Sparkles style={{ width: 32, height: 32, color: 'var(--primary)', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, marginBottom: 12 }}>Full recipe not in library.</p>
                  <button
                    className="goal-apply-btn"
                    style={{ margin: '0 auto' }}
                    onClick={() => { setDrawerOpen(true); sendMessage(`Give me the full recipe for: ${selectedMeal.name}`); setSelectedMeal(null) }}
                  >
                    <Sparkles /> Ask AI for Recipe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AI ASSISTANT DRAWER ── */}
      {drawerOpen && (
        <>
          <div className="ai-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="ai-drawer" id="ai-assistant-drawer">
            <div className="ai-drawer-header">
              <div className="ai-drawer-icon"><Sparkles /></div>
              <div className="ai-drawer-title">
                <h3>AI Food Assistant</h3>
                <p>Ask about recipes, nutrition, meal swaps…</p>
              </div>
              <button className="ai-drawer-close" id="btn-close-ai-drawer" onClick={() => setDrawerOpen(false)}>
                <X />
              </button>
            </div>

            <div className="ai-drawer-messages">
              {messages.length === 0 ? (
                <div className="ai-welcome">
                  <div className="ai-welcome-icon"><Sparkles /></div>
                  <h4>Hey there! 👋</h4>
                  <p>I'm your smart food assistant. Ask me anything about nutrition, recipes, meal swaps, or dietary advice!</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`message-bubble ${msg.role}`}>{msg.content}</div>
                ))
              )}
              {isTyping && (
                <div className="typing-bubble">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-suggestions">
              {AI_SUGGESTIONS.map((sug, i) => (
                <button key={i} id={`ai-suggestion-${i}`} className="ai-suggestion-pill" onClick={() => sendMessage(sug)} disabled={isTyping}>
                  {sug}
                </button>
              ))}
            </div>

            <div className="ai-input-row">
              <input
                id="ai-chat-input"
                type="text"
                className="ai-text-input"
                placeholder="Ask about nutrition, recipes, diets…"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                id="ai-send-btn"
                className="ai-send-btn"
                onClick={() => sendMessage()}
                disabled={isTyping || !aiInput.trim()}
              >
                <Send />
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

// ─── StatCard component ──────────────────────────────────────────────────────
function StatCard({ color, icon: Icon, label, value, unit, pct }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon /></div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {value}<span className="stat-unit">{unit}</span>
        </div>
        <div className="stat-progress-bar">
          <div className={`stat-progress-fill ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}


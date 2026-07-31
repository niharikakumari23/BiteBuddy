import React, { useState } from 'react';
import { ShoppingCart, Check, Plus, Search, Trash2, Edit3, Save, Sparkles, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import { PLATFORMS, getItemCost } from '../data/constants';
import './Shopping.css';

export const Shopping = ({ profile, plan, shopping, setShoppingItems, checkedItems, setCheckedItems, API_BASE }) => {
  const { addToast } = useToast();
  const [savingShop, setSavingShop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  
  const saveShoppingList = async () => {
    addToast('Shopping List Saved! 🛒', 'Your list progress has been saved locally.', 'success');
  };

  const toggleShoppingItem = (idx) => {
    setCheckedItems(prev => {
      const n = new Set(prev);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  };

  const addShoppingItem = () => {
    const currentItems = [...shopping];
    currentItems.push({ name: 'New Item', qty: '1' });
    setShoppingItems(currentItems);
    setEditingItemIdx(currentItems.length - 1);
  };

  const removeShoppingItem = (idx, e) => {
    e.stopPropagation();
    const currentItems = [...shopping];
    currentItems.splice(idx, 1);
    setShoppingItems(currentItems);
    
    // Update checked items
    const newChecked = new Set();
    checkedItems.forEach(i => {
      if (i < idx) newChecked.add(i);
      else if (i > idx) newChecked.add(i - 1);
    });
    setCheckedItems(newChecked);
    setEditingItemIdx(null);
  };

  const updateShoppingItem = (idx, field, value) => {
    const currentItems = [...shopping];
    currentItems[idx] = { ...currentItems[idx], [field]: value };
    setShoppingItems(currentItems);
  };

  // Filter items
  const filteredItems = shopping.map((item, index) => ({ item, index }))
    .filter(({ item }) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalCost = shopping.reduce((sum, item, i) => checkedItems.has(i) ? sum : sum + getItemCost(item.name), 0);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header shopping-header">
        <div>
          <h1 className="page-title">Shopping List</h1>
          <p className="page-subtitle">Get the ingredients you need for your meal plan.</p>
        </div>
        <div className="shopping-actions">
          <Button variant="outline" onClick={addShoppingItem}>
            <Plus size={18} style={{ marginRight: 8 }} /> Add Item
          </Button>
          <Button onClick={saveShoppingList} disabled={savingShop}>
            <Save size={18} style={{ marginRight: 8 }} />
            {savingShop ? 'Saving...' : 'Save List'}
          </Button>
        </div>
      </div>

      <div className="shopping-grid">
        <div className="shopping-main">
          <Card className="shopping-card">
            <div className="shopping-search">
              <Search size={18} color="var(--muted)" />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shopping-search-input"
              />
            </div>

            {filteredItems.length > 0 ? (
              <div className="shopping-list">
                {filteredItems.map(({ item, index }) => (
                  <div 
                    key={index} 
                    className={`shopping-item ${checkedItems.has(index) ? 'is-checked' : ''}`}
                    onClick={() => { if (editingItemIdx !== index) toggleShoppingItem(index); }}
                  >
                    <div className={`shopping-check ${checkedItems.has(index) ? 'checked' : ''}`}>
                      {checkedItems.has(index) && <Check size={14} />}
                    </div>
                    
                    <div className="shopping-item-content">
                      {editingItemIdx === index ? (
                        <div className="shopping-item-edit-mode" onClick={e => e.stopPropagation()}>
                          <Input 
                            value={item.name} 
                            onChange={(e) => updateShoppingItem(index, 'name', e.target.value)}
                            autoFocus
                          />
                          <Input 
                            value={item.qty} 
                            onChange={(e) => updateShoppingItem(index, 'qty', e.target.value)}
                            style={{ width: '80px' }}
                          />
                          <Button size="sm" onClick={() => setEditingItemIdx(null)}>Done</Button>
                        </div>
                      ) : (
                        <>
                          <div className="shopping-item-name">{item.name}</div>
                          <div className="shopping-item-qty">{item.qty}</div>
                        </>
                      )}
                    </div>
                    
                    {editingItemIdx !== index && (
                      <div className="shopping-item-actions">
                        <span className="shopping-item-cost">~₹{getItemCost(item.name)}</span>
                        <div className="shopping-item-btn-group" onClick={e => e.stopPropagation()}>
                          <button className="shopping-icon-btn" onClick={() => setEditingItemIdx(index)}>
                            <Edit3 size={16} />
                          </button>
                          <button className="shopping-icon-btn destructive" onClick={(e) => removeShoppingItem(index, e)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={ShoppingCart}
                title="No items found"
                description={searchQuery ? "No items match your search." : "Your shopping list is empty."}
              />
            )}
          </Card>
        </div>

        <div className="shopping-sidebar">
          {/* Quick Commerce */}
          <Card className="qcommerce-card">
            <h3 className="card-title">Order Instantly</h3>
            <p className="card-subtitle">Get your remaining items delivered in 10 minutes.</p>
            
            <div className="qcommerce-total">
              <span className="qcommerce-total-label">Est. Total:</span>
              <span className="qcommerce-total-value">₹{totalCost.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="qcommerce-platforms">
              {PLATFORMS.map(p => {
                // Generate a search string for unchecked items
                const searchStr = shopping.filter((_, i) => !checkedItems.has(i)).map(i => i.name).join(' ');
                
                return (
                  <a
                    key={p.id}
                    href={p.getUrl(searchStr || 'groceries')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="qcommerce-btn"
                    style={{ '--pbg': p.color, '--pfg': p.textColor }}
                  >
                    <span className="qcommerce-emoji">{p.emoji}</span>
                    <span className="qcommerce-label">{p.label}</span>
                    <ExternalLink size={14} className="qcommerce-external" />
                  </a>
                );
              })}
            </div>
          </Card>

          {/* AI Helper */}
          <Card className="shop-ai-card">
            <div className="shop-ai-header">
              <Sparkles size={20} color="var(--primary)" />
              <h3 className="card-title">AI Powered</h3>
            </div>
            <p className="shop-ai-text">
              Your smart shopping list is automatically generated and synced with your personalized AI meal plan!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

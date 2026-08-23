import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, PackageCheck } from 'lucide-react';
import { getPolarChecklist, savePolarChecklist } from '../utils/polarstepsStorage';
import { uuid } from '../utils/storage';

export default function PolarstepsChecklist({ tripId }) {
  const [categories, setCategories] = useState(() => getPolarChecklist(tripId));
  const [newItemText, setNewItemText] = useState({});

  function updateChecklist(newCats) {
    setCategories(newCats);
    savePolarChecklist(tripId, newCats);
  }

  function toggleItem(catId, itemId) {
    const updated = categories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item),
      };
    });
    updateChecklist(updated);
  }

  function addItem(catId) {
    const text = newItemText[catId]?.trim();
    if (!text) return;

    const updated = categories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: [...cat.items, { id: uuid(), text, checked: false }],
      };
    });

    updateChecklist(updated);
    setNewItemText(prev => ({ ...prev, [catId]: '' }));
  }

  function deleteItem(catId, itemId) {
    const updated = categories.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.filter(item => item.id !== itemId),
      };
    });
    updateChecklist(updated);
  }

  // Calculate totals
  const allItems = categories.flatMap(c => c.items);
  const checkedCount = allItems.filter(i => i.checked).length;
  const pct = allItems.length ? Math.round((checkedCount / allItems.length) * 100) : 0;

  return (
    <div className="ps-checklist-root">
      {/* Header Progress */}
      <div className="ps-card ps-checklist-header">
        <div className="ps-checklist-header-top">
          <div className="ps-checklist-title-wrap">
            <PackageCheck size={22} color="var(--em)" />
            <div>
              <div className="ps-card-title">Trip Packing & Gear Checklist</div>
              <div className="ps-card-sub">{checkedCount} of {allItems.length} items packed ({pct}%)</div>
            </div>
          </div>
          <div className="ps-checklist-pct-badge">{pct}% Packed</div>
        </div>
        <div className="ps-checklist-progress-bar">
          <div className="ps-checklist-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Category Cards */}
      <div className="ps-checklist-grid">
        {categories.map(cat => (
          <div key={cat.id} className="ps-card ps-cat-card">
            <div className="ps-cat-header">{cat.category}</div>
            <div className="ps-cat-items">
              {cat.items.map(item => (
                <div
                  key={item.id}
                  className={`ps-cat-item-row ${item.checked ? 'checked' : ''}`}
                  onClick={() => toggleItem(cat.id, item.id)}
                >
                  {item.checked ? <CheckSquare size={16} color="var(--em)" /> : <Square size={16} color="var(--t3)" />}
                  <span className="ps-cat-item-text">{item.text}</span>
                  <button
                    className="ps-icon-del"
                    onClick={e => { e.stopPropagation(); deleteItem(cat.id, item.id); }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add item inline */}
            <div className="ps-add-item-row">
              <input
                className="ps-input-sm"
                placeholder="+ Add item…"
                value={newItemText[cat.id] || ''}
                onChange={e => setNewItemText({ ...newItemText, [cat.id]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addItem(cat.id)}
              />
              <button className="ps-btn-ghost-sm" onClick={() => addItem(cat.id)}>
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

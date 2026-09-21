import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import {
  getPolarExpenses, savePolarExpenses, CURRENCIES, formatCurrency,
} from '../utils/polarstepsStorage';
import { uuid } from '../utils/storage';

export default function PolarstepsExpenses({ tripId }) {
  const [expData, setExpData] = useState(() => getPolarExpenses(tripId));
  const [desc, setDesc]       = useState('');
  const [amount, setAmount]   = useState('');
  const [payer, setPayer]     = useState('Me');
  const [curr, setCurr]       = useState(expData.currency || 'INR');

  function updateData(newData) {
    setExpData(newData);
    savePolarExpenses(tripId, newData);
  }

  function handleCurrencyChange(c) {
    setCurr(c);
    updateData({ ...expData, currency: c });
  }

  function addExpense(e) {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    const exp = {
      id: uuid(),
      description: desc.trim(),
      amount: Number(amount) || 0,
      paidBy: payer,
      date: new Date().toISOString().split('T')[0],
    };
    updateData({ ...expData, expenses: [exp, ...expData.expenses] });
    setDesc('');
    setAmount('');
  }

  function deleteExpense(id) {
    const expenses = expData.expenses.filter(x => x.id !== id);
    updateData({ ...expData, expenses });
  }

  const totalSpent = expData.expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  return (
    <div className="ps-expenses-root">
      {/* Total Card */}
      <div style={{ background: '#fff', border: '1.5px solid #D1FAE5', borderRadius: 18, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(16,185,129,0.08)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>Total Expenses</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#10B981', letterSpacing: '-0.03em', marginBottom: 10 }}>
          {formatCurrency(totalSpent, curr)}
        </div>
        {/* Category pills */}
        {(() => {
          const cats = {};
          expData.expenses.forEach(e => {
            const k = e.category || 'Other';
            cats[k] = (cats[k] || 0) + (Number(e.amount) || 0);
          });
          const icons = { Stay:'🏨', Food:'🍽️', Activity:'🎯', Flight:'✈️', Transport:'🚗', Shopping:'🛍️', Other:'📍' };
          return Object.keys(cats).length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {Object.entries(cats).map(([k, v]) => (
                <div key={k} style={{ background: '#F0FDF4', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#065F46' }}>
                  {icons[k] || '📍'} {k} {formatCurrency(v, curr)}
                </div>
              ))}
            </div>
          ) : null;
        })()}
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{expData.expenses.length} transaction{expData.expenses.length !== 1 ? 's' : ''} logged</div>
        {/* Currency selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
          {Object.keys(CURRENCIES).map(c => (
            <button key={c} onClick={() => handleCurrencyChange(c)}
              style={{ padding: '4px 12px', borderRadius: 99, border: curr === c ? '1.5px solid #10B981' : '1.5px solid #E5E7EB', background: curr === c ? '#F0FDF4' : '#fff', color: curr === c ? '#10B981' : '#6B7280', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {CURRENCIES[c].symbol} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Add Expense Form */}
      <form className="ps-card ps-expense-form" onSubmit={addExpense}>
        <div className="ps-section-title"><DollarSign size={16} /> Log Expense</div>
        <div className="ps-form-grid">
          <input className="ps-input" placeholder="What did you spend on? (e.g. Dinner, Cab)" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="ps-input-wrap">
            <span className="ps-input-prefix">{CURRENCIES[curr]?.symbol}</span>
            <input className="ps-input" type="number" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <motion.button className="ps-btn-primary" type="submit" whileTap={{ scale: 0.98 }}>
            <Plus size={16} /> Add
          </motion.button>
        </div>
      </form>

      {/* Expense List */}
      <div className="ps-card ps-expense-list">
        <div className="ps-section-title">All Expenses</div>
        {expData.expenses.length === 0 ? (
          <div className="ps-empty-hint">No expenses logged yet</div>
        ) : (
          expData.expenses.map(e => (
            <div key={e.id} className="ps-expense-row">
              <div className="ps-expense-info">
                <div className="ps-expense-desc">{e.description}</div>
                <div className="ps-expense-sub">{e.date}</div>
              </div>
              <div className="ps-expense-amt">{formatCurrency(e.amount, curr)}</div>
              <button className="ps-icon-del" onClick={() => deleteExpense(e.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
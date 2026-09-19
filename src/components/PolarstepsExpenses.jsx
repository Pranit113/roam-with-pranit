import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, DollarSign, Users, ArrowRightLeft } from 'lucide-react';
import {
  getPolarExpenses, savePolarExpenses, calcBalances, CURRENCIES, formatCurrency, convertCurrency,
} from '../utils/polarstepsStorage';
import { uuid } from '../utils/storage';

export default function PolarstepsExpenses({ tripId }) {
  const [expData, setExpData] = useState(() => getPolarExpenses(tripId));
  const [desc, setDesc]       = useState('');
  const [amount, setAmount]   = useState('');
  const [payer, setPayer]     = useState('Me');
  const [curr, setCurr]       = useState(expData.currency || 'INR');
  const [newMember, setNewMember] = useState('');

  function updateData(newData) {
    setExpData(newData);
    savePolarExpenses(tripId, newData);
  }

  function handleCurrencyChange(c) {
    setCurr(c);
    updateData({ ...expData, currency: c });
  }

  function addMember() {
    if (!newMember.trim() || expData.members.includes(newMember.trim())) return;
    const members = [...expData.members, newMember.trim()];
    updateData({ ...expData, members });
    setNewMember('');
  }

  function addExpense(e) {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    const exp = {
      id: uuid(),
      description: desc.trim(),
      amount: Number(amount) || 0,
      paidBy: payer,
      splitAmong: [...expData.members],
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

  const balances = calcBalances(expData);
  const totalSpent = expData.expenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  return (
    <div className="ps-expenses-root">
      {/* ── Prominent Total Card at very top ── */}
      <div style={{ background: '#fff', border: '1.5px solid #D1FAE5', borderRadius: 18, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(16,185,129,0.08)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 4 }}>Total Expenses</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#10B981', letterSpacing: '-0.03em', marginBottom: 12 }}>
          {formatCurrency(totalSpent, curr)}
        </div>
        {/* Category breakdown */}
        {(() => {
          const cats = {};
          expData.expenses.forEach(e => {
            const k = e.category || 'Other';
            cats[k] = (cats[k] || 0) + (Number(e.amount) || 0);
          });
          const icons = { Stay:'🏨', Food:'🍽️', Activity:'🎯', Flight:'✈️', Transport:'🚗', Shopping:'🛍️', Other:'📍' };
          return Object.keys(cats).length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(cats).map(([k, v]) => (
                <div key={k} style={{ background: '#F0FDF4', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {icons[k] || '📍'} {k} {formatCurrency(v, curr)}
                </div>
              ))}
            </div>
          ) : null;
        })()}
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>{expData.expenses.length} transaction{expData.expenses.length !== 1 ? 's' : ''} logged</div>

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


      {/* Splitwise Balances Summary */}
      <div className="ps-card ps-balances-card">
        <div className="ps-section-title"><Users size={16} /> Group Balances ("Who owes whom")</div>
        <div className="ps-balances-grid">
          {Object.entries(balances).map(([member, bal]) => {
            const isOwed = bal > 0.01;
            const owes   = bal < -0.01;
            const converted = convertCurrency(Math.abs(bal), 'INR', curr);

            return (
              <div key={member} className={`ps-balance-chip ${isOwed ? 'owed' : owes ? 'owes' : 'settled'}`}>
                <div className="ps-balance-name">{member}</div>
                <div className="ps-balance-amt">
                  {isOwed && `Gets back ${formatCurrency(converted, curr)}`}
                  {owes && `Owes ${formatCurrency(converted, curr)}`}
                  {!isOwed && !owes && 'Settled up ✓'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Member inline */}
        <div className="ps-add-member-row">
          <input
            className="ps-input-sm"
            placeholder="+ Add traveler name…"
            value={newMember}
            onChange={e => setNewMember(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
          />
          <button className="ps-btn-ghost-sm" onClick={addMember}>Add</button>
        </div>
      </div>

      {/* Add Expense Form */}
      <form className="ps-card ps-expense-form" onSubmit={addExpense}>
        <div className="ps-section-title"><DollarSign size={16} /> Log New Expense</div>
        <div className="ps-form-grid">
          <input
            className="ps-input"
            placeholder="Expense description (e.g. Flight, Dinner, Cab)"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <div className="ps-input-wrap">
            <span className="ps-input-prefix">{CURRENCIES[curr]?.symbol}</span>
            <input
              className="ps-input"
              type="number"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <select className="ps-input" value={payer} onChange={e => setPayer(e.target.value)}>
            {expData.members.map(m => (
              <option key={m} value={m}>Paid by {m}</option>
            ))}
          </select>
          <motion.button
            className="ps-btn-primary"
            type="submit"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <Plus size={16} /> Add Expense
          </motion.button>
        </div>
      </form>

      {/* Expense List */}
      <div className="ps-card ps-expense-list">
        <div className="ps-section-title">Expense History</div>
        {expData.expenses.length === 0 ? (
          <div className="ps-empty-hint">No expenses logged yet</div>
        ) : (
          expData.expenses.map(e => (
            <div key={e.id} className="ps-expense-row">
              <div className="ps-expense-info">
                <div className="ps-expense-desc">{e.description}</div>
                <div className="ps-expense-sub">Paid by {e.paidBy} · {e.date}</div>
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

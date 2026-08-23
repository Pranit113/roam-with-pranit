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
      {/* Top Header & Currency Selector */}
      <div className="ps-card ps-expenses-header">
        <div className="ps-expenses-summary">
          <div className="ps-stat-label">Total Trip Expenses</div>
          <div className="ps-stat-value">{formatCurrency(totalSpent, curr)}</div>
          <div className="ps-stat-sub">{expData.expenses.length} transactions logged</div>
        </div>

        <div className="ps-currency-selector">
          <label className="ps-label"><ArrowRightLeft size={13} /> Currency</label>
          <div className="ps-curr-pills">
            {Object.keys(CURRENCIES).map(c => (
              <button
                key={c}
                className={`ps-curr-pill ${curr === c ? 'active' : ''}`}
                onClick={() => handleCurrencyChange(c)}
              >
                {CURRENCIES[c].symbol} {c}
              </button>
            ))}
          </div>
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

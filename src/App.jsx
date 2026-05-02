import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitAmong, setExpSplitAmong] = useState([]);

  useEffect(() => {
    const m = localStorage.getItem('splitmate_members');
    const e = localStorage.getItem('splitmate_expenses');
    const c = localStorage.getItem('splitmate_currency');
    if (m) setMembers(JSON.parse(m));
    if (e) setExpenses(JSON.parse(e));
    if (c) setCurrency(c);
  }, []);

  useEffect(() => { localStorage.setItem('splitmate_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('splitmate_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('splitmate_currency', currency); }, [currency]);

  const addMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      alert('Member already exists!');
      return;
    }
    setMembers([...members, { id: Date.now(), name }]);
    setNewMemberName('');
  };

  const removeMember = (id) => {
    const member = members.find((m) => m.id === id);
    if (expenses.some((e) => e.paidBy === member.name || e.splitAmong.includes(member.name))) {
      if (!confirm(`${member.name} appears in expenses. Remove anyway?`)) return;
    }
    setMembers(members.filter((m) => m.id !== id));
  };

  const toggleSplitMember = (name) => {
    if (expSplitAmong.includes(name)) {
      setExpSplitAmong(expSplitAmong.filter((n) => n !== name));
    } else {
      setExpSplitAmong([...expSplitAmong, name]);
    }
  };

  const addExpense = () => {
    if (!expDescription.trim()) return alert('Please enter a description');
    const amount = parseFloat(expAmount);
    if (!amount || amount <= 0) return alert('Please enter a valid amount');
    if (!expPaidBy) return alert('Please select who paid');
    if (expSplitAmong.length === 0) return alert('Please select who to split among');

    setExpenses([{
      id: Date.now(),
      description: expDescription.trim(),
      amount,
      paidBy: expPaidBy,
      splitAmong: [...expSplitAmong],
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    }, ...expenses]);
    setExpDescription('');
    setExpAmount('');
    setExpPaidBy('');
    setExpSplitAmong([]);
  };

  const deleteExpense = (id) => {
    if (confirm('Delete this expense?')) setExpenses(expenses.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    if (confirm('Delete ALL members and expenses?')) {
      setMembers([]);
      setExpenses([]);
    }
  };

  const calculateBalances = () => {
    const balances = {};
    members.forEach((m) => (balances[m.name] = 0));
    expenses.forEach((exp) => {
      if (balances[exp.paidBy] !== undefined) balances[exp.paidBy] += exp.amount;
      const share = exp.amount / exp.splitAmong.length;
      exp.splitAmong.forEach((person) => {
        if (balances[person] !== undefined) balances[person] -= share;
      });
    });
    return balances;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances();
    const creditors = [], debtors = [];
    Object.entries(balances).forEach(([name, balance]) => {
      if (balance > 0.01) creditors.push({ name, amount: balance });
      else if (balance < -0.01) debtors.push({ name, amount: -balance });
    });
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    const settlements = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
      settlements.push({ from: debtors[i].name, to: creditors[j].name, amount: settleAmount });
      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
    return settlements;
  };

  const balances = calculateBalances();
  const settlements = calculateSettlements();
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="app">
      <header>
        <h1>💰 SplitMate</h1>
        <p className="subtitle">Split expenses fairly with friends</p>
        <div className="currency-switcher">
          <span>Currency:</span>
          {['₹', '$', '€'].map((c) => (
            <button key={c} className={`curr-btn ${currency === c ? 'active' : ''}`} onClick={() => setCurrency(c)}>{c}</button>
          ))}
        </div>
      </header>

      <section className="card">
        <h2>👥 Members ({members.length})</h2>
        <div className="form-row">
          <input type="text" placeholder="Enter member name" value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()} />
          <button className="btn-primary" onClick={addMember}>Add</button>
        </div>
        {members.length > 0 ? (
          <div className="member-tags">
            {members.map((m) => (
              <span key={m.id} className="tag">{m.name}<button onClick={() => removeMember(m.id)}>✕</button></span>
            ))}
          </div>
        ) : (<p className="empty">Add at least 2 members to start splitting</p>)}
      </section>

      {members.length >= 2 && (
        <section className="card">
          <h2>💸 Add Expense</h2>
          <input type="text" placeholder="What was it for? (e.g., Dinner)" value={expDescription}
            onChange={(e) => setExpDescription(e.target.value)} />
          <input type="number" placeholder={`Amount (${currency})`} value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)} min="0" step="0.01" />
          <label className="label">Paid by:</label>
          <select value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)}>
            <option value="">-- Select who paid --</option>
            {members.map((m) => (<option key={m.id} value={m.name}>{m.name}</option>))}
          </select>
          <label className="label">Split among:</label>
          <div className="checkbox-group">
            {members.map((m) => (
              <label key={m.id} className="checkbox-item">
                <input type="checkbox" checked={expSplitAmong.includes(m.name)} onChange={() => toggleSplitMember(m.name)} />
                {m.name}
              </label>
            ))}
            <button className="btn-link" onClick={() => setExpSplitAmong(members.map((m) => m.name))}>Select all</button>
          </div>
          <button className="btn-primary full" onClick={addExpense}>Add Expense</button>
        </section>
      )}

      {expenses.length > 0 && (
        <section className="card summary">
          <h2>📊 Summary</h2>
          <p className="total">Total spent: <strong>{currency}{totalSpent.toFixed(2)}</strong></p>
          <div className="balance-list">
            {Object.entries(balances).map(([name, bal]) => (
              <div key={name} className="balance-item">
                <span>{name}</span>
                <span className={bal > 0.01 ? 'positive' : bal < -0.01 ? 'negative' : 'neutral'}>
                  {bal > 0.01 ? `gets back ${currency}${bal.toFixed(2)}` :
                   bal < -0.01 ? `owes ${currency}${(-bal).toFixed(2)}` : 'settled up'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {settlements.length > 0 && (
        <section className="card settlements">
          <h2>✅ How to Settle Up</h2>
          <ul>
            {settlements.map((s, i) => (
              <li key={i}><strong>{s.from}</strong> pays <strong>{s.to}</strong> <span className="amount">{currency}{s.amount.toFixed(2)}</span></li>
            ))}
          </ul>
        </section>
      )}

      {expenses.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h2>📜 Expense History</h2>
            <button className="btn-danger-link" onClick={clearAll}>Clear all</button>
          </div>
          <ul className="expense-list">
            {expenses.map((e) => (
              <li key={e.id} className="expense-item">
                <div className="expense-main">
                  <strong>{e.description}</strong>
                  <span className="expense-amount">{currency}{e.amount.toFixed(2)}</span>
                </div>
                <div className="expense-meta">
                  <span>Paid by <strong>{e.paidBy}</strong></span>
                  <span>•</span>
                  <span>Split among {e.splitAmong.length}: {e.splitAmong.join(', ')}</span>
                  <span>•</span>
                  <span>{e.date}</span>
                </div>
                <button className="delete-x" onClick={() => deleteExpense(e.id)}>✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer><p>Built with React • Deployed on Azure</p></footer>
    </div>
  );
}

export default App;

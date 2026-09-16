import React, { useState, useEffect } from 'react';

interface Account {
  id: string;
  account_number: string;
  name: string;
  classification: string;
  currency: string;
  balance?: number;
}

interface Posting {
  id: string;
  account_id: string;
  direction: string;
  amount: number;
}

interface JournalEntry {
  id: string;
  reference_number: string;
  entry_date: string;
  narration: string;
  posted_at: string;
  postings: Posting[];
}

interface NetWorthAnalytics {
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  accounts: Account[];
}

interface BudgetRecord {
  id: string;
  account_id: string;
  account_name: string;
  account_number: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_pct: number;
  alert_threshold_pct: number;
  period_start: string;
  period_end: string;
  status: 'HEALTHY' | 'WARNING' | 'BREACHED';
}

interface GoalRecord {
  id: string;
  name: string;
  account_id: string;
  account_name: string;
  target_amount: number;
  current_balance: number;
  progress_pct: number;
  target_date: string;
  days_remaining: number;
  required_monthly_contribution: number;
  status: 'ACHIEVED' | 'OVERDUE' | 'ON_TRACK';
}

interface RecurringScheduleRecord {
  id: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  frequency: string;
  next_execution_date: string;
  narration: string;
  is_active: boolean;
}

interface RunwayAnalytics {
  liquid_assets: number;
  average_monthly_burn: number;
  lookback_days: number;
  runway_months: number | null;
  projected_cash_zero_date: string | null;
}

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('token') || '');
  const [orgId, setOrgId] = useState<string>(() => localStorage.getItem('orgId') || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'networth' | 'budgets' | 'accounts' | 'journal' | 'goals' | 'automation'>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<NetWorthAnalytics | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [schedules, setSchedules] = useState<RecurringScheduleRecord[]>([]);
  const [runway, setRunway] = useState<RunwayAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Goal Form
  const [goalName, setGoalName] = useState('Emergency Reserve Fund');
  const [goalAccount, setGoalAccount] = useState('');
  const [goalTarget, setGoalTarget] = useState('200000.00');
  const [goalDate, setGoalDate] = useState('2027-03-31');

  // Recurring Schedule Form
  const [recNarration, setRecNarration] = useState('Cloud Infrastructure Subscription');
  const [recDebitAcc, setRecDebitAcc] = useState('');
  const [recCreditAcc, setRecCreditAcc] = useState('');
  const [recAmount, setRecAmount] = useState('2000.00');
  const [recFrequency, setRecFrequency] = useState('MONTHLY');
  const [recNextDate, setRecNextDate] = useState(new Date().toISOString().split('T')[0]);

  // Account Form
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('EXPENSE');

  // Journal Form
  const [refNumber, setRefNumber] = useState(`TXN-${Date.now().toString().slice(-4)}`);
  const [narration, setNarration] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [debitAcc, setDebitAcc] = useState('');
  const [creditAcc, setCreditAcc] = useState('');
  const [amount, setAmount] = useState('5000.00');

  // Budget Form
  const [budgetName, setBudgetName] = useState('Cloud Infrastructure Envelope');
  const [budgetAccount, setBudgetAccount] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('25000.00');
  const [budgetThreshold, setBudgetThreshold] = useState('80');
  const [periodStart, setPeriodStart] = useState('2026-09-01');
  const [periodEnd, setPeriodEnd] = useState('2026-09-30');

  useEffect(() => {
    if (token && orgId) {
      fetchData();
    }
  }, [token, orgId]);

  const fetchData = async () => {
    setLoading(true);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const accRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/accounts`, { headers });
      if (accRes.ok) {
        const accData: Account[] = await accRes.json();
        setAccounts(accData);
        const expAccs = accData.filter(a => a.classification === 'EXPENSE');
        if (expAccs.length > 0 && !budgetAccount) {
          setBudgetAccount(expAccs[0].id);
        }
      } else if (accRes.status === 401) {
        handleReset();
        return;
      }

      const entRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/ledger/entries`, { headers });
      if (entRes.ok) setEntries(await entRes.json());

      const nwRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/analytics/net-worth`, { headers });
      if (nwRes.ok) setAnalytics(await nwRes.json());

      const bgtRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/budgets`, { headers });
      if (bgtRes.ok) setBudgets(await bgtRes.json());

      const goalRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/goals`, { headers });
      if (goalRes.ok) setGoals(await goalRes.json());

      const schedRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/recurring-schedules`, { headers });
      if (schedRes.ok) setSchedules(await schedRes.json());

      const runwayRes = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/analytics/runway`, { headers });
      if (runwayRes.ok) setRunway(await runwayRes.json());
    } catch (e: any) {
      setStatusMsg(e.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setToken('');
    setOrgId('');
    setAccounts([]);
    setEntries([]);
    setAnalytics(null);
    setBudgets([]);
    setGoals([]);
    setSchedules([]);
    setRunway(null);
    localStorage.removeItem('token');
    localStorage.removeItem('orgId');
    setStatusMsg('Session refreshed. Please connect to Treasury.');
  };

  const handleBootstrap = async () => {
    setLoading(true);
    const uniqueEmail = `executive_${Date.now().toString().slice(-4)}@apple.fin`;
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail,
          password: 'Password123!',
          org_name: 'Titanium Treasury',
          org_type: 'BUSINESS'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      setToken(data.token);
      setOrgId(data.org_id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('orgId', data.org_id);
      setStatusMsg(`Connected to Treasury: ${data.org_id}`);
    } catch (e: any) {
      setStatusMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccNumber || !newAccName) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_number: newAccNumber,
          name: newAccName,
          classification: newAccType
        })
      });
      if (res.ok) {
        setNewAccNumber('');
        setNewAccName('');
        fetchData();
        setStatusMsg('Account secured in Chart of Accounts.');
      }
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handlePostEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitAcc || !creditAcc || debitAcc === creditAcc) {
      setStatusMsg('Select two distinct accounts to preserve double-entry balance.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/ledger/entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference_number: refNumber,
          entry_date: entryDate,
          narration: narration || 'Operational Posting',
          postings: [
            { account_id: debitAcc, direction: 'DEBIT', amount: parseFloat(amount) },
            { account_id: creditAcc, direction: 'CREDIT', amount: parseFloat(amount) }
          ]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Imbalance Detected');
      setStatusMsg(`Entry committed: ${data.entry_id}`);
      setRefNumber(`TXN-${Date.now().toString().slice(-4)}`);
      setNarration('');
      fetchData();
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAccountId = budgetAccount || accounts.find(a => a.classification === 'EXPENSE')?.id;
    if (!targetAccountId) {
      setStatusMsg('Please create and select an EXPENSE account before creating a budget.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/budgets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: targetAccountId,
          name: budgetName,
          allocated_amount: parseFloat(budgetLimit),
          alert_threshold_pct: parseFloat(budgetThreshold),
          period_start: periodStart,
          period_end: periodEnd
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to establish envelope');
      setStatusMsg('Budget envelope successfully established.');
      fetchData();
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAccountId = goalAccount || accounts.find(a => a.classification === 'ASSET')?.id;
    if (!targetAccountId) {
      setStatusMsg('Please create and select an ASSET account before creating a goal.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/goals`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: targetAccountId,
          name: goalName,
          target_amount: parseFloat(goalTarget),
          target_date: goalDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to establish goal');
      setStatusMsg('Milestone goal established.');
      fetchData();
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handleDeactivateGoal = async (goalId: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStatusMsg('Goal archived.');
      fetchData();
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recDebitAcc || !recCreditAcc || recDebitAcc === recCreditAcc) {
      setStatusMsg('Select two distinct accounts for the recurring schedule.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/recurring-schedules`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debit_account_id: recDebitAcc,
          credit_account_id: recCreditAcc,
          amount: parseFloat(recAmount),
          frequency: recFrequency,
          next_execution_date: recNextDate,
          narration: recNarration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to schedule automation');
      setStatusMsg('Recurring schedule armed.');
      fetchData();
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handleExecuteDue = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/recurring-schedules/execute-due`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStatusMsg(`Autonomous sweep posted ${data.processed} due schedule(s).`);
      fetchData();
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const handleDeactivateRecurring = async (scheduleId: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/organizations/${orgId}/recurring-schedules/${scheduleId}/deactivate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStatusMsg('Schedule deactivated.');
      fetchData();
    } catch (e: any) {
      setStatusMsg(e.message);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#F5F5F7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      WebkitFontSmoothing: 'antialiased',
      padding: '48px 24px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        
        {/* Navigation Bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(28, 28, 30, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '16px 28px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: '#86868B', textTransform: 'uppercase' }}>
              Autonomous Financial OS
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Titanium Core
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
            {(['overview', 'networth', 'budgets', 'goals', 'automation', 'accounts', 'journal'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: activeTab === tab ? '#FFFFFF' : '#86868B',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'networth' ? 'Net Worth' : tab}
              </button>
            ))}
          </div>

          {!token ? (
            <button
              onClick={handleBootstrap}
              disabled={loading}
              style={{
                background: '#0071E3',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '18px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 113, 227, 0.35)'
              }}
            >
              {loading ? 'Connecting...' : 'Initialize Treasury'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#30D158', boxShadow: '0 0 10px #30D158' }} />
                <span style={{ fontSize: '13px', color: '#86868B' }}>Verified</span>
              </div>
              <button
                onClick={handleReset}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#86868B', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
          )}
        </header>

        {statusMsg && (
          <div style={{
            background: 'rgba(44, 44, 46, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 20px',
            borderRadius: '16px',
            marginBottom: '32px',
            fontSize: '13px',
            color: '#E5E5EA',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg('')} style={{ background: 'none', border: 'none', color: '#86868B', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{
              background: 'radial-gradient(circle at 10% 20%, rgba(0, 113, 227, 0.15) 0%, rgba(28, 28, 30, 0.6) 70%)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '28px',
              padding: '36px',
              marginBottom: '32px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{ color: '#86868B', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Aggregate Enterprise Value
              </div>
              <div style={{ fontSize: '56px', fontWeight: 700, letterSpacing: '-0.04em', margin: '10px 0', color: '#FFFFFF' }}>
                {analytics ? formatINR(analytics.net_worth) : '₹0.00'}
              </div>
              <div style={{ display: 'flex', gap: '28px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#86868B' }}>Total Assets</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#30D158', marginTop: '2px' }}>
                    {analytics ? formatINR(analytics.total_assets) : '₹0.00'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#86868B' }}>Total Liabilities</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#FF453A', marginTop: '2px' }}>
                    {analytics ? formatINR(analytics.total_liabilities) : '₹0.00'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#86868B' }}>Total Equity Base</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#BF5AF2', marginTop: '2px' }}>
                    {analytics ? formatINR(analytics.total_equity) : '₹0.00'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: 'rgba(28,28,30,0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px' }}>
                <div style={{ color: '#86868B', fontSize: '13px', fontWeight: 500 }}>Active Budgets</div>
                <div style={{ fontSize: '38px', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '8px' }}>
                  {budgets.length}
                </div>
                <div style={{ fontSize: '13px', color: '#0A84FF', marginTop: '6px' }}>Envelopes Enforced</div>
              </div>

              <div style={{ background: 'rgba(28,28,30,0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px' }}>
                <div style={{ color: '#86868B', fontSize: '13px', fontWeight: 500 }}>Committed Postings</div>
                <div style={{ fontSize: '38px', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '8px' }}>
                  {entries.length}
                </div>
                <div style={{ fontSize: '13px', color: '#30D158', marginTop: '6px' }}>Zero Invariant Drift</div>
              </div>

              <div style={{ background: 'rgba(28,28,30,0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px' }}>
                <div style={{ color: '#86868B', fontSize: '13px', fontWeight: 500 }}>Accounting Invariant</div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginTop: '16px', color: '#30D158' }}>
                  A = L + E Verified
                </div>
                <div style={{ fontSize: '12px', color: '#86868B', marginTop: '6px' }}>Real-time Audit Active</div>
              </div>

              <div style={{ background: 'radial-gradient(circle at 90% 10%, rgba(191, 90, 242, 0.12) 0%, rgba(28,28,30,0.7) 70%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px' }}>
                <div style={{ color: '#86868B', fontSize: '13px', fontWeight: 500 }}>Autonomous Cash Runway</div>
                <div style={{ fontSize: '38px', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '8px', color: '#BF5AF2' }}>
                  {runway?.runway_months != null ? `${runway.runway_months} mo` : '∞'}
                </div>
                <div style={{ fontSize: '12px', color: '#86868B', marginTop: '6px' }}>
                  {runway ? `Burn ${formatINR(runway.average_monthly_burn)}/mo over ${runway.lookback_days}d` : 'Awaiting expense history'}
                </div>
                {runway?.projected_cash_zero_date && (
                  <div style={{ fontSize: '12px', color: '#FF9F0A', marginTop: '4px' }}>
                    Projected zero: {runway.projected_cash_zero_date}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(28, 28, 30, 0.5)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Ledger Activity Log</h3>
              {entries.length === 0 ? (
                <div style={{ color: '#86868B', fontSize: '14px' }}>No journal postings committed yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {entries.map(e => (
                    <div key={e.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '14px 20px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{e.reference_number}</span>
                        <span style={{ color: '#86868B', fontSize: '13px', marginLeft: '12px' }}>{e.narration}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#30D158', fontWeight: 600, fontSize: '15px' }}>
                          ₹{e.postings[0]?.amount?.toLocaleString() || '0'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#86868B' }}>{e.entry_date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: NET WORTH */}
        {activeTab === 'networth' && (
          <div style={{
            background: 'rgba(28, 28, 30, 0.6)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '28px',
            padding: '36px'
          }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>Balance Sheet Ledger Breakdown</h2>
            <p style={{ color: '#86868B', fontSize: '14px', margin: '0 0 32px 0' }}>
              Real-time balance calculated dynamically across immutable double-entry credit and debit postings.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: 'rgba(48, 209, 88, 0.04)', border: '1px solid rgba(48, 209, 88, 0.15)', borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: '#30D158', fontWeight: 600, textTransform: 'uppercase', fontSize: '12px' }}>Assets (Debit Normal)</span>
                  <span style={{ color: '#30D158', fontWeight: 700, fontSize: '16px' }}>{analytics ? formatINR(analytics.total_assets) : '₹0.00'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analytics?.accounts.filter(a => a.classification === 'ASSET').length === 0 ? (
                    <div style={{ color: '#86868B', fontSize: '13px', padding: '8px' }}>No active asset accounts.</div>
                  ) : (
                    analytics?.accounts.filter(a => a.classification === 'ASSET').map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '14px' }}>{a.account_number} — {a.name}</span>
                        <span style={{ fontWeight: 600, color: '#30D158' }}>{formatINR(a.balance || 0)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 69, 58, 0.04)', border: '1px solid rgba(255, 69, 58, 0.15)', borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: '#FF453A', fontWeight: 600, textTransform: 'uppercase', fontSize: '12px' }}>Liabilities (Credit Normal)</span>
                  <span style={{ color: '#FF453A', fontWeight: 700, fontSize: '16px' }}>{analytics ? formatINR(analytics.total_liabilities) : '₹0.00'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analytics?.accounts.filter(a => a.classification === 'LIABILITY').length === 0 ? (
                    <div style={{ color: '#86868B', fontSize: '13px', padding: '8px' }}>No debt liabilities present.</div>
                  ) : (
                    analytics?.accounts.filter(a => a.classification === 'LIABILITY').map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '14px' }}>{a.account_number} — {a.name}</span>
                        <span style={{ fontWeight: 600, color: '#FF453A' }}>{formatINR(a.balance || 0)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BUDGETS */}
        {activeTab === 'budgets' && (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '28px' }}>
            <form onSubmit={handleCreateBudget} style={{
              background: 'rgba(28, 28, 30, 0.65)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '24px',
              height: 'fit-content'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 600 }}>Establish Budget Envelope</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Envelope Label</label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={e => setBudgetName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Expense Account Target</label>
                <select
                  value={budgetAccount}
                  onChange={e => setBudgetAccount(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}
                >
                  <option value="">Select Expense Account</option>
                  {accounts.filter(a => a.classification === 'EXPENSE').map(a => (
                    <option key={a.id} value={a.id}>{a.account_number} — {a.name}</option>
                  ))}
                </select>
                {accounts.filter(a => a.classification === 'EXPENSE').length === 0 && (
                  <span style={{ fontSize: '11px', color: '#FF9F0A', marginTop: '4px', display: 'block' }}>
                    Tip: First create an 'EXPENSE' account in Accounts tab.
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Allocation (INR)</label>
                  <input
                    type="number"
                    step="100"
                    value={budgetLimit}
                    onChange={e => setBudgetLimit(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Alert Threshold (%)</label>
                  <input
                    type="number"
                    value={budgetThreshold}
                    onChange={e => setBudgetThreshold(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Cycle Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={e => setPeriodStart(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Cycle End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={e => setPeriodEnd(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#FFFFFF', color: '#000000', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Lock Envelope
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {budgets.length === 0 ? (
                <div style={{
                  background: 'rgba(28, 28, 30, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '36px',
                  textAlign: 'center',
                  color: '#86868B'
                }}>
                  No active budget envelopes configured. Establish one on the left.
                </div>
              ) : (
                budgets.map(b => (
                  <div key={b.id} style={{
                    background: 'rgba(28, 28, 30, 0.65)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '22px',
                    padding: '24px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <span style={{ fontSize: '17px', fontWeight: 600 }}>{b.name}</span>
                        <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>
                          Target: {b.account_number} — {b.account_name} ({b.period_start} to {b.period_end})
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background: b.status === 'HEALTHY' ? 'rgba(48,209,88,0.15)' : b.status === 'WARNING' ? 'rgba(255,159,10,0.15)' : 'rgba(255,69,58,0.2)',
                        color: b.status === 'HEALTHY' ? '#30D158' : b.status === 'WARNING' ? '#FF9F0A' : '#FF453A'
                      }}>
                        {b.status}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', margin: '14px 0' }}>
                      <div style={{
                        width: `${Math.min(100, b.utilization_pct)}%`,
                        height: '100%',
                        background: b.status === 'HEALTHY' ? '#30D158' : b.status === 'WARNING' ? '#FF9F0A' : '#FF453A',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px' }}>
                      <span style={{ color: '#86868B' }}>
                        Consumed: <b style={{ color: '#FFF' }}>{formatINR(b.spent_amount)}</b> ({b.utilization_pct}%)
                      </span>
                      <span style={{ color: '#86868B' }}>
                        Limit: <b style={{ color: '#FFF' }}>{formatINR(b.allocated_amount)}</b>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '28px' }}>
            <form onSubmit={handleCreateAccount} style={{
              background: 'rgba(28, 28, 30, 0.65)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '24px',
              height: 'fit-content'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 600 }}>Create Ledger Account</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Account Code</label>
                <input
                  type="text"
                  placeholder="e.g. 5001"
                  value={newAccNumber}
                  onChange={e => setNewAccNumber(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Infrastructure"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Classification</label>
                <select
                  value={newAccType}
                  onChange={e => setNewAccType(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                >
                  <option value="EXPENSE">EXPENSE</option>
                  <option value="ASSET">ASSET</option>
                  <option value="LIABILITY">LIABILITY</option>
                  <option value="EQUITY">EQUITY</option>
                  <option value="REVENUE">REVENUE</option>
                </select>
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#FFFFFF', color: '#000000', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Register Account
              </button>
            </form>

            <div style={{
              background: 'rgba(28, 28, 30, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '24px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 600 }}>Chart of Accounts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {accounts.map(acc => (
                  <div key={acc.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}>
                    <div>
                      <span style={{ color: '#86868B', fontFamily: 'monospace', marginRight: '10px' }}>{acc.account_number}</span>
                      <span style={{ fontWeight: 500 }}>{acc.name}</span>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: acc.classification === 'ASSET' ? 'rgba(48,209,88,0.15)' : acc.classification === 'EXPENSE' ? 'rgba(255,69,58,0.15)' : 'rgba(255,159,10,0.15)',
                      color: acc.classification === 'ASSET' ? '#30D158' : acc.classification === 'EXPENSE' ? '#FF453A' : '#FF9F0A'
                    }}>
                      {acc.classification}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: JOURNAL */}
        {activeTab === 'journal' && (
          <div style={{
            background: 'rgba(28, 28, 30, 0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '32px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>Balanced Transaction Builder</h3>
            <p style={{ color: '#86868B', fontSize: '13px', margin: '0 0 28px 0' }}>
              Every entry mathematically guarantees: Σ Debits = Σ Credits before commit.
            </p>

            <form onSubmit={handlePostEntry}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Reference Number</label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={e => setRefNumber(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Posting Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Narration</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly Cloud Server Invoice"
                    value={narration}
                    onChange={e => setNarration(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                <div style={{ background: 'rgba(48, 209, 88, 0.05)', padding: '20px', borderRadius: '18px', border: '1px solid rgba(48, 209, 88, 0.15)' }}>
                  <div style={{ color: '#30D158', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Debit Allocation (Expense / Asset)</div>
                  <select
                    value={debitAcc}
                    onChange={e => setDebitAcc(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}
                  >
                    <option value="">Select Destination Account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.account_number} — {a.name} ({a.classification})</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: 'rgba(255, 69, 58, 0.05)', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255, 69, 58, 0.15)' }}>
                  <div style={{ color: '#FF453A', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Credit Allocation (Bank / Cash)</div>
                  <select
                    value={creditAcc}
                    onChange={e => setCreditAcc(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }}
                  >
                    <option value="">Select Source Account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.account_number} — {a.name} ({a.classification})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '4px' }}>Transaction Volume (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFF',
                      fontSize: '18px',
                      fontWeight: 600
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#0071E3',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '14px 32px',
                    borderRadius: '16px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0, 113, 227, 0.4)'
                  }}
                >
                  Commit Invariant
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: GOALS */}
        {activeTab === 'goals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
            <form onSubmit={handleCreateGoal} style={{
              background: 'rgba(28, 28, 30, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '24px',
              height: 'fit-content'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 600 }}>Create Milestone Goal</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Goal Name</label>
                <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Linked ASSET Account</label>
                <select value={goalAccount} onChange={e => setGoalAccount(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}>
                  <option value="">Select destination account</option>
                  {accounts.filter(a => a.classification === 'ASSET').map(a => (
                    <option key={a.id} value={a.id}>{a.account_number} — {a.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Target Amount (INR)</label>
                <input type="number" step="0.01" value={goalTarget} onChange={e => setGoalTarget(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Target Date</label>
                <input type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ width: '100%', background: '#FFFFFF', color: '#000000', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Establish Goal
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {goals.length === 0 ? (
                <div style={{ color: '#86868B', fontSize: '14px', padding: '24px' }}>No milestone goals established yet.</div>
              ) : goals.map(g => (
                <div key={g.id} style={{
                  background: 'rgba(28, 28, 30, 0.65)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '22px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600 }}>{g.name}</div>
                      <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>Linked to {g.account_name} · Target {g.target_date}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                        background: g.status === 'ACHIEVED' ? 'rgba(48,209,88,0.15)' : g.status === 'OVERDUE' ? 'rgba(255,69,58,0.15)' : 'rgba(10,132,255,0.15)',
                        color: g.status === 'ACHIEVED' ? '#30D158' : g.status === 'OVERDUE' ? '#FF453A' : '#0A84FF'
                      }}>{g.status.replace('_', ' ')}</span>
                      <button onClick={() => handleDeactivateGoal(g.id)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#86868B', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>Archive</button>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${g.progress_pct}%`, height: '100%', background: 'linear-gradient(90deg, #0A84FF, #BF5AF2)', transition: 'width 0.4s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '13px' }}>
                    <span style={{ color: '#86868B' }}>{formatINR(g.current_balance)} of {formatINR(g.target_amount)} ({g.progress_pct}%)</span>
                    <span style={{ color: '#86868B' }}>Needs {formatINR(g.required_monthly_contribution)}/mo · {g.days_remaining}d left</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AUTOMATION (Recurring Schedules) */}
        {activeTab === 'automation' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
            <form onSubmit={handleCreateRecurring} style={{
              background: 'rgba(28, 28, 30, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '24px',
              height: 'fit-content'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 600 }}>Arm Recurring Schedule</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Narration</label>
                <input type="text" value={recNarration} onChange={e => setRecNarration(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Debit Account (Expense)</label>
                <select value={recDebitAcc} onChange={e => setRecDebitAcc(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}>
                  <option value="">Select account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} — {a.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Credit Account (Bank / Cash)</label>
                <select value={recCreditAcc} onChange={e => setRecCreditAcc(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}>
                  <option value="">Select account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.account_number} — {a.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Amount</label>
                  <input type="number" step="0.01" value={recAmount} onChange={e => setRecAmount(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Frequency</label>
                  <select value={recFrequency} onChange={e => setRecFrequency(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }}>
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', color: '#86868B', display: 'block', marginBottom: '6px' }}>Next Execution Date</label>
                <input type="date" value={recNextDate} onChange={e => setRecNextDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ width: '100%', background: '#FFFFFF', color: '#000000', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Arm Schedule
              </button>
            </form>

            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(28, 28, 30, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px', padding: '18px 22px', marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Autonomous Worker</div>
                  <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>Backend sweeps every 6 hours · trigger a manual sweep now</div>
                </div>
                <button onClick={handleExecuteDue} style={{ background: '#0071E3', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Run Due Schedules
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {schedules.length === 0 ? (
                  <div style={{ color: '#86868B', fontSize: '14px', padding: '12px' }}>No recurring schedules armed yet.</div>
                ) : schedules.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{s.narration}</div>
                      <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>{s.frequency} · Next run {s.next_execution_date} · {formatINR(s.amount)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                        background: s.is_active ? 'rgba(48,209,88,0.15)' : 'rgba(134,134,139,0.15)',
                        color: s.is_active ? '#30D158' : '#86868B'
                      }}>{s.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                      {s.is_active && (
                        <button onClick={() => handleDeactivateRecurring(s.id)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#86868B', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>Pause</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
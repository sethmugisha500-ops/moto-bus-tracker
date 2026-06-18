'use client';

const transactions = [
  { icon: '🏍️', name: 'Moto ride · CBD', date: 'Today, 8:22 AM', amount: -1800, type: 'neg' },
  { icon: '⬆️', name: 'MoMo top-up', date: 'Yesterday, 3:15 PM', amount: 10000, type: 'pos' },
  { icon: '🚌', name: 'Bus · Remera → Nyabugogo', date: 'Yesterday, 7:05 AM', amount: -700, type: 'neg' },
];

export default function WalletCard() {
  return (
    <div className="bg-gradient-to-br from-[#0D2018] to-[#1A3828] border border-green-500/15 rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute -top-15 -right-15 w-50 h-50 rounded-full bg-green-500/6 pointer-events-none" />
      
      <div className="text-xs text-muted font-light mb-2 uppercase tracking-wider">Wallet balance</div>
      <div className="font-head text-5xl font-extrabold tracking-tight mb-1">
        <span className="text-green-500">RWF</span> 24,500
      </div>
      <div className="text-sm text-muted mb-8">≈ $16.80 USD</div>
      
      <div className="flex gap-2.5">
        <button className="flex-1 bg-green-500 text-bg font-medium py-2.5 rounded-lg text-sm hover:bg-green-600 transition-transform hover:-translate-y-0.5">
          + Add funds
        </button>
        <button className="flex-1 bg-white/5 text-muted border border-border rounded-lg py-2.5 text-sm hover:border-border-hover transition-all">
          Send →
        </button>
      </div>
      
      <div className="mt-5 pt-4 border-t border-border">
        <div className="text-[11px] text-muted mb-2 uppercase tracking-wider">Recent transactions</div>
        {transactions.map((tx, idx) => (
          <div key={idx} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">{tx.icon}</div>
              <div>
                <div className="text-xs font-normal">{tx.name}</div>
                <div className="text-[11px] text-muted">{tx.date}</div>
              </div>
            </div>
            <span className={`text-xs font-medium ${tx.type === 'pos' ? 'text-green-500' : 'text-muted'}`}>
              {tx.type === 'pos' ? '+' : ''}{tx.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
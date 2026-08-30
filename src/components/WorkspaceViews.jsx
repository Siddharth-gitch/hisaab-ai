import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  FileDown,
  FileText,
  Filter,
  FolderOpen,
  IndianRupee,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  Paperclip,
  Plus,
  ReceiptIndianRupee,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  UploadCloud,
  UserRound,
  WalletCards,
  X,
  Zap
} from 'lucide-react';

const categoryColors = {
  Groceries: '#b8e3cf',
  'Food & dining': '#f7d7a8',
  Transport: '#c7d8f6',
  Shopping: '#ead1ef',
  'Bills & utilities': '#d9d3c9',
  Health: '#f5c9cc',
  Entertainment: '#d9cff6',
  Travel: '#bcdde5',
  Software: '#d0d6f6',
  Marketing: '#f7c9af',
  'Office supplies': '#cedfbb',
  'Professional services': '#ded0bd',
  Rent: '#e6d1b5',
  Other: '#d6d9d3'
};

const categoryIcons = {
  Groceries: '🛒',
  'Food & dining': '🍽️',
  Transport: '↗',
  Shopping: '✦',
  'Bills & utilities': '⌁',
  Health: '♡',
  Entertainment: '▸',
  Travel: '✈',
  Software: '⌘',
  Marketing: '◉',
  'Office supplies': '▤',
  'Professional services': '♧',
  Rent: '⌂',
  Other: '•'
};

function formatMoney(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatShortDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function formatLongDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'HS';
}

function getMerchantStyle(name = '') {
  const colors = ['#f7d9c5', '#d5e7d2', '#d6def3', '#ebd7ee', '#f2e4bf'];
  const index = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function EmptyState({ title = 'Nothing here yet', message = 'Add your first expense to see it here.', actionLabel = 'Add expense', onAction }) {
  return <div className="empty-state"><div className="empty-icon"><Search size={20} /></div><h3>{title}</h3><p>{message}</p>{onAction && <button className="button button-secondary empty-action" type="button" onClick={onAction}><Plus size={15} /> {actionLabel}</button>}</div>;
}

export function ExpenseRow({ expense, currency, onEdit, onDelete, onOpenReceipt }) {
  const receiptLabel = expense.receiptRetained && (expense.receiptPath || expense.receiptName);
  return <div className="expense-row">
    <div className="merchant-avatar" style={{ background: getMerchantStyle(expense.merchant) }}>{getInitials(expense.merchant)}</div>
    <div className="expense-main"><strong>{expense.merchant}</strong><span>{expense.category} <i /> {formatShortDate(expense.date)}</span></div>
    <div className="expense-meta">{expense.needsReview && <span className="review-pill"><Sparkles size={12} /> Review</span>}{receiptLabel && (onOpenReceipt ? <button className="receipt-pill receipt-pill-button" type="button" onClick={() => onOpenReceipt(expense)} title="Open private receipt"><Paperclip size={12} /> Receipt</button> : <span className="receipt-pill"><Paperclip size={12} /> Receipt</span>)}</div>
    <div className="expense-value"><strong>{formatMoney(expense.amount, currency)}</strong><span>{expense.paymentMethod}</span></div>
    <div className="row-actions"><button type="button" onClick={onEdit} aria-label={`Edit ${expense.merchant}`}><Settings2 size={15} /></button><button type="button" onClick={onDelete} aria-label={`Delete ${expense.merchant}`}><Trash2 size={15} /></button></div>
  </div>;
}

function PageHeading({ eyebrow, title, subtitle, actions }) {
  return <section className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{subtitle && <p className="heading-subtitle">{subtitle}</p>}</div>{actions && <div className="heading-actions">{actions}</div>}</section>;
}

function SearchTools({ categories, searchTerm, setSearchTerm, filterCategory, setFilterCategory }) {
  return <div className="heading-tools"><div className="search-box"><Search size={15} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search expenses" aria-label="Search expenses" /></div><div className="filter-wrap"><Filter size={15} /><select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} aria-label="Filter by category"><option>All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div></div>;
}

function SpendingChart({ weeklyBars, workspace }) {
  return <div className="bar-chart" aria-label="Weekly spending chart"><div className="chart-grid-lines"><span /><span /><span /><span /></div>{weeklyBars.map((bar) => <div className="bar-column" key={bar.label}><div className="bar-track"><div className="bar-fill" style={{ height: `${bar.height}%` }}><span className="bar-tooltip">{formatMoney(bar.value, workspace.currency)}</span></div></div><span className="bar-label">{bar.label}</span></div>)}</div>;
}

function ScanCard({ aiMode, onScan, onAddExpense }) {
  const ready = aiMode !== 'demo';
  return <article className="panel scan-panel"><div className="scan-glow" /><div className="panel-heading scan-heading"><div><p className="panel-kicker mint-kicker"><Sparkles size={13} /> Hisaab assist</p><h2>{ready ? 'Scan receipts with Hisaab AI.' : 'Make receipts less boring.'}</h2></div><span className="beta-pill">{ready ? 'READY' : 'DEMO'}</span></div><p className="scan-description">{ready ? 'Upload a receipt and we’ll suggest the merchant, amount, date, and category for you to check.' : 'The demo flow is ready to preview. Connect Gemini to read your real receipts.'}</p><button className="upload-zone" type="button" onClick={onScan}><span className="upload-icon"><UploadCloud size={21} /></span><strong>Scan a receipt</strong><span>JPG, PNG, WEBP or PDF · up to 10 MB</span></button><div className="scan-divider"><span>or</span></div><button className="manual-link" type="button" onClick={onAddExpense}><Plus size={15} /> Add it manually</button><div className="scan-privacy"><span className="privacy-dot" /><span>Your receipt stays private. You review every suggestion.</span></div></article>;
}

export function OverviewView({ workspace, accountName, isBusiness, periodLabel, totals, weeklyBars, visibleExpenses, categories, isLoading, searchTerm, setSearchTerm, filterCategory, setFilterCategory, aiMode, onExport, onAddExpense, onEditExpense, onDeleteExpense, onOpenReceipt, onOpenScan, onReports }) {
  return <>
    <PageHeading eyebrow={isBusiness ? `Business snapshot · ${periodLabel}` : `Your money, at a glance · ${periodLabel}`} title={isBusiness ? 'Good morning, let’s keep business simple.' : `Good morning, ${accountName?.split(' ')[0] || 'there'}.`} subtitle={isBusiness ? 'A clear view of what your studio spent and what needs a quick review.' : 'A calm view of where your money is going this month.'} actions={<><button className="button button-secondary" type="button" onClick={onExport}><FileDown size={16} /> Export CSV</button><button className="button button-primary" type="button" onClick={onAddExpense}><Plus size={17} /> Add expense</button></>} />
    <section className="stat-grid" aria-label="Spending summary">
      <article className="stat-card primary-stat"><div className="stat-card-top"><span className="stat-label">Total spent this month</span><span className="stat-icon mint"><WalletCards size={17} /></span></div><strong className="stat-number">{formatMoney(totals.total, workspace.currency)}</strong><div className="stat-foot"><span className="trend positive"><ArrowDownRight size={14} /> 8.4%</span><span>vs. last month</span></div><div className="mini-sparkline"><span style={{ height: '30%' }} /><span style={{ height: '42%' }} /><span style={{ height: '38%' }} /><span style={{ height: '60%' }} /><span style={{ height: '54%' }} /><span style={{ height: '72%' }} /><span style={{ height: '66%' }} /><span style={{ height: '86%' }} /></div></article>
      <article className="stat-card"><div className="stat-card-top"><span className="stat-label">Expenses logged</span><span className="stat-icon peach"><FileText size={17} /></span></div><strong className="stat-number">{totals.count}</strong><div className="stat-foot"><span className="trend positive">{totals.count ? 'Up to date' : 'Start small'}</span><span>this month</span></div><div className="stat-progress"><span style={{ width: `${Math.min(100, totals.count * 12)}%` }} /></div></article>
      <article className="stat-card"><div className="stat-card-top"><span className="stat-label">Needs your review</span><span className="stat-icon lavender"><Sparkles size={17} /></span></div><strong className="stat-number">{totals.reviewCount}</strong><div className="stat-foot"><span className={totals.reviewCount ? 'trend caution' : 'trend positive'}>{totals.reviewCount ? 'Action needed' : 'All clear'}</span><span>AI suggestions</span></div><div className="review-dots">{Array.from({ length: Math.max(3, totals.reviewCount + 2) }).slice(0, 5).map((_, index) => <span className={index < totals.reviewCount ? 'active' : ''} key={index} />)}</div></article>
      <article className="stat-card business-stat"><div className="stat-card-top"><span className="stat-label">{isBusiness ? 'Potentially deductible' : 'Average per expense'}</span><span className="stat-icon sky"><IndianRupee size={17} /></span></div><strong className="stat-number">{formatMoney(isBusiness ? totals.deductible : totals.average, workspace.currency)}</strong><div className="stat-foot"><span>{isBusiness ? `${totals.deductibleCount} expenses marked` : 'Keep an eye on it'}</span></div><div className="stat-line"><span /><span /><span /><span /><span /></div></article>
    </section>
    <section className="dashboard-grid"><article className="panel spending-panel"><div className="panel-heading"><div><p className="panel-kicker">Spending rhythm</p><h2>Where your money went</h2></div><span className="period-chip">{periodLabel}</span></div><div className="chart-summary"><div><span className="chart-total">{formatMoney(totals.total, workspace.currency)}</span><span className="chart-muted">total this month</span></div><div className="chart-legend"><span className="legend-dot" /> Spending</div></div><SpendingChart weeklyBars={weeklyBars} workspace={workspace} /></article><article className="panel category-panel"><div className="panel-heading"><div><p className="panel-kicker">Your habits</p><h2>Top categories</h2></div><button className="round-menu" type="button" aria-label="View category reports" onClick={onReports}><BarChart3 size={17} /></button></div><div className="category-list">{totals.topCategories.length ? totals.topCategories.map(([category, amount]) => <div className="category-row" key={category}><span className="category-badge" style={{ background: categoryColors[category] || '#d6d9d3' }}>{categoryIcons[category] || '•'}</span><div className="category-name"><strong>{category}</strong><span>{totals.total ? Math.round((amount / totals.total) * 100) : 0}% of spending</span></div><div className="category-amount"><strong>{formatMoney(amount, workspace.currency)}</strong><span className="category-meter"><i style={{ width: `${Math.round((amount / totals.maxCategory) * 100)}%`, background: categoryColors[category] || '#a8baae' }} /></span></div></div>) : <div className="empty-inline">Add your first expense to see patterns.</div>}</div><button className="text-button" type="button" onClick={onReports}>View full breakdown <ArrowUpRight size={15} /></button></article></section>
    <section className="lower-grid"><article className="panel expenses-panel"><div className="panel-heading expense-heading"><div><p className="panel-kicker">Your ledger</p><h2>Recent expenses</h2></div><SearchTools categories={categories} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterCategory={filterCategory} setFilterCategory={setFilterCategory} /></div>{isLoading ? <div className="loading-list"><span /><span /><span /></div> : visibleExpenses.length ? <div className="expense-list">{visibleExpenses.slice(0, 6).map((expense) => <ExpenseRow key={expense.id} expense={expense} currency={workspace.currency} onEdit={() => onEditExpense(expense)} onDelete={() => onDeleteExpense(expense)} onOpenReceipt={onOpenReceipt} />)}</div> : <EmptyState title="No expenses found" message="Add a new expense or change your search." actionLabel="Add expense" onAction={onAddExpense} />}{visibleExpenses.length > 6 && <button className="view-all-button" type="button" onClick={() => onReports('Expenses')}>View all expenses <ArrowUpRight size={15} /></button>}</article><ScanCard aiMode={aiMode} onScan={onOpenScan} onAddExpense={onAddExpense} /></section>
    <section className="bottom-note"><div className="note-icon"><Zap size={15} /></div><p><strong>Friendly reminder:</strong> AI can read a receipt, but only you know what it was really for. Check the amount and category before saving.</p><button type="button" onClick={onReports}>Why this matters <ArrowUpRight size={14} /></button></section>
  </>;
}

export function ExpensesView({ workspace, periodLabel, expenses, visibleExpenses, categories, isLoading, searchTerm, setSearchTerm, filterCategory, setFilterCategory, onExport, onAddExpense, onEditExpense, onDeleteExpense, onOpenReceipt }) {
  return <><PageHeading eyebrow={`Your ledger · ${periodLabel}`} title="Expenses" subtitle="Every payment in one calm, searchable list." actions={<><button className="button button-secondary" type="button" onClick={onExport}><FileDown size={16} /> Export CSV</button><button className="button button-primary" type="button" onClick={onAddExpense}><Plus size={17} /> Add expense</button></>} /><section className="view-panel panel"><div className="view-panel-heading"><div><p className="panel-kicker">{visibleExpenses.length} shown · {expenses.length} total</p><h2>All expenses in {workspace.name}</h2></div><SearchTools categories={categories} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterCategory={filterCategory} setFilterCategory={setFilterCategory} /></div>{isLoading ? <div className="loading-list"><span /><span /><span /><span /></div> : visibleExpenses.length ? <div className="expense-list expense-list-full">{visibleExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} currency={workspace.currency} onEdit={() => onEditExpense(expense)} onDelete={() => onDeleteExpense(expense)} onOpenReceipt={onOpenReceipt} />)}</div> : <EmptyState title="No matching expenses" message="Try another search, or add your first expense." actionLabel="Add expense" onAction={onAddExpense} />}</section></>;
}

export function ReportsView({ workspace, periodLabel, totals, weeklyBars, onExport, onAddExpense }) {
  const categoryRows = totals.allCategories;
  return <><PageHeading eyebrow={`Reports · ${periodLabel}`} title="A clearer picture." subtitle="Simple patterns from the expenses you have recorded." actions={<><button className="button button-secondary" type="button" onClick={onExport}><FileDown size={16} /> Export CSV</button><button className="button button-primary" type="button" onClick={onAddExpense}><Plus size={17} /> Add expense</button></>} /><section className="summary-grid"><article className="summary-card"><span>Total this month</span><strong>{formatMoney(totals.total, workspace.currency)}</strong><small>{totals.count} recorded expenses</small></article><article className="summary-card"><span>Average expense</span><strong>{formatMoney(totals.average, workspace.currency)}</strong><small>Across this month</small></article><article className="summary-card"><span>Tax recorded</span><strong>{formatMoney(totals.taxes, workspace.currency)}</strong><small>{workspace.kind === 'business' ? 'Review before filing' : 'For your records'}</small></article><article className="summary-card"><span>Needs review</span><strong>{totals.reviewCount}</strong><small>{totals.reviewCount ? 'A quick look will help' : 'Nothing waiting'}</small></article></section><section className="reports-layout"><article className="panel report-chart"><div className="panel-heading"><div><p className="panel-kicker">Weekly rhythm</p><h2>When spending happened</h2></div><span className="period-chip">{periodLabel}</span></div><SpendingChart weeklyBars={weeklyBars} workspace={workspace} /></article><article className="panel report-categories"><div className="panel-heading"><div><p className="panel-kicker">Category mix</p><h2>Where it went</h2></div></div><div className="report-category-list">{categoryRows.length ? categoryRows.map(([category, amount, count]) => <div className="report-category-row" key={category}><span className="category-badge" style={{ background: categoryColors[category] || '#d6d9d3' }}>{categoryIcons[category] || '•'}</span><div className="category-name"><strong>{category}</strong><span>{count} {count === 1 ? 'expense' : 'expenses'} · {totals.total ? Math.round((amount / totals.total) * 100) : 0}%</span></div><strong className="report-category-amount">{formatMoney(amount, workspace.currency)}</strong></div>) : <div className="empty-inline">Add an expense to build your first report.</div>}</div></article></section></>;
}

export function ReceiptsView({ workspace, periodLabel, receiptExpenses, aiMode, onOpenScan, onAddExpense, onEditExpense, onDeleteExpense, onOpenReceipt }) {
  return <><PageHeading eyebrow={`Receipts · ${periodLabel}`} title="Your receipt archive." subtitle="Keep the originals you choose, and find the related expense quickly." actions={<button className="button button-primary" type="button" onClick={onOpenScan}><Sparkles size={16} /> Scan a receipt</button>} /><section className="receipts-intro"><div className="receipts-intro-icon"><LockKeyhole size={20} /></div><div><strong>Private by default</strong><p>{aiMode === 'demo' ? 'The demo scanner is active. Your retention choice will be respected when storage is connected.' : 'Stored receipts are private and tied to your account. You decide whether to keep or delete each original.'}</p></div></section><section className="view-panel panel"><div className="view-panel-heading"><div><p className="panel-kicker">{receiptExpenses.length} saved</p><h2>Kept receipts</h2></div><button className="button button-secondary" type="button" onClick={onAddExpense}><Plus size={15} /> Add without receipt</button></div>{receiptExpenses.length ? <div className="expense-list expense-list-full">{receiptExpenses.map((expense) => <div className="receipt-entry" key={expense.id}><ExpenseRow expense={expense} currency={workspace.currency} onEdit={() => onEditExpense(expense)} onDelete={() => onDeleteExpense(expense)} onOpenReceipt={onOpenReceipt} />{expense.receiptPath && <button className="receipt-open-button" type="button" onClick={() => onOpenReceipt(expense)}><LockKeyhole size={13} /> Open private receipt</button>}</div>)}</div> : <EmptyState title="No kept receipts yet" message="Scan a receipt and choose Keep receipt when you want a private copy." actionLabel="Scan a receipt" onAction={onOpenScan} />}</section></>;
}

export function CategoriesView({ workspace, categories, totals, onViewExpenses }) {
  const byCategory = new Map(totals.allCategories.map(([category, amount, count]) => [category, { amount, count }]));
  return <><PageHeading eyebrow="Workspace · Categories" title="Your categories." subtitle="A tidy list for consistent, useful expense records." /><section className="category-grid">{categories.map((category) => { const item = byCategory.get(category) || { amount: 0, count: 0 }; return <button className="category-card" key={category} type="button" onClick={() => onViewExpenses(category)}><span className="category-badge" style={{ background: categoryColors[category] || '#d6d9d3' }}>{categoryIcons[category] || '•'}</span><span className="category-card-copy"><strong>{category}</strong><small>{item.count} {item.count === 1 ? 'expense' : 'expenses'}</small></span><span className="category-card-total">{formatMoney(item.amount, workspace.currency)}</span><span className="category-card-hint">View expenses <ArrowUpRight size={13} /></span></button>; })}</section></>;
}

export function SettingsView({ workspace, accountName, accountEmail, createdAt, theme, onThemeChange, onAccountOpen, aiMode, supabaseConfigured, onSignOut }) {
  return <><PageHeading eyebrow="Workspace · Settings" title="A calmer Hisaab." subtitle="Make the app feel right for the way you manage money." /><section className="settings-grid"><article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon mint"><Sun size={17} /></span><div><p className="panel-kicker">Appearance</p><h2>Light or dark?</h2></div></div><p className="settings-copy">Choose the look that feels easiest on your eyes. Your choice is saved on this device.</p><div className="theme-options"><button className={theme === 'light' ? 'theme-option active' : 'theme-option'} type="button" onClick={() => onThemeChange('light')}><Sun size={16} /><span><strong>Light</strong><small>Bright and airy</small></span>{theme === 'light' && <Check size={15} />}</button><button className={theme === 'dark' ? 'theme-option active' : 'theme-option'} type="button" onClick={() => onThemeChange('dark')}><Moon size={16} /><span><strong>Dark</strong><small>Soft on the eyes</small></span>{theme === 'dark' && <Check size={15} />}</button></div></article><article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon peach"><UserRound size={17} /></span><div><p className="panel-kicker">Account</p><h2>{accountName}</h2></div></div><div className="account-summary"><span>{accountEmail || 'Demo account'}</span><span>Member since {createdAt ? formatLongDate(createdAt) : 'this preview'}</span></div><button className="button button-secondary settings-wide-button" type="button" onClick={onAccountOpen}>View account details <ArrowUpRight size={15} /></button></article><article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon lavender"><WalletCards size={17} /></span><div><p className="panel-kicker">Current workspace</p><h2>{workspace.name}</h2></div></div><div className="workspace-details"><div><span>Type</span><strong>{workspace.kind === 'business' ? 'Business space' : 'Personal space'}</strong></div><div><span>Currency</span><strong>{workspace.currency} · per workspace</strong></div></div><p className="settings-copy">Each workspace keeps its own currency and expense list, so personal and business records stay separate.</p></article><article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon sky"><LockKeyhole size={17} /></span><div><p className="panel-kicker">Connection & privacy</p><h2>{supabaseConfigured ? 'Hosted and private' : 'Demo mode'}</h2></div></div><div className="connection-list"><div><span className="connection-dot good" /><span>Signed-in account</span><strong>{supabaseConfigured ? 'Supabase Auth' : 'Demo access'}</strong></div><div><span className="connection-dot good" /><span>Expense storage</span><strong>{supabaseConfigured ? 'PostgreSQL' : 'Temporary memory'}</strong></div><div><span className={`connection-dot ${aiMode === 'demo' ? 'neutral' : 'good'}`} /><span>Receipt assistant</span><strong>{aiMode === 'demo' ? 'Demo preview' : 'Ready'}</strong></div></div>{supabaseConfigured && <button className="button button-secondary settings-wide-button signout-button" type="button" onClick={onSignOut}><LogOut size={15} /> Sign out</button>}</article></section></>;
}

export function AccountModal({ accountName, accountEmail, createdAt, onClose, onSave, onSignOut, saving }) {
  const [name, setName] = useState(accountName || '');
  const submit = async (event) => {
    event.preventDefault();
    await onSave(name.trim());
  };
  return <div className="modal-backdrop"><div className="modal-card account-modal"><div className="modal-header"><div><p className="panel-kicker mint-kicker"><UserRound size={13} /> Account</p><h2>Your account details</h2><p className="modal-subtitle">Keep your name current so Hisaab feels like yours.</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="account-hero"><div className="account-avatar">{getInitials(accountName)}</div><div><strong>{accountName || 'Hisaab user'}</strong><span>{accountEmail || 'Demo account'}</span></div></div><form className="account-form" onSubmit={submit}><label className="field"><span>Display name</span><div className="auth-input"><UserRound size={15} /><input value={name} onChange={(event) => setName(event.target.value)} maxLength="80" required /></div></label><label className="field"><span>Email address</span><div className="auth-input"><Mail size={15} /><input value={accountEmail || 'Demo account'} readOnly /></div></label><div className="account-meta"><div><span>Account created</span><strong>{createdAt ? formatLongDate(createdAt) : 'Demo preview'}</strong></div><div><span>Plan</span><strong>Free tier</strong></div><div><span>Data</span><strong>Private workspace</strong></div></div><div className="modal-foot"><button type="button" className="button button-secondary" onClick={onSignOut}><LogOut size={15} /> Sign out</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button></div></form></div></div>;
}

export function AppFooter({ hosted, aiMode }) {
  return <footer className="app-footer"><span>Hisaab · built for calmer money days</span><span><span className={`footer-status ${hosted ? 'good' : 'neutral'}`} /> {hosted ? 'Hosted data connected' : 'Demo mode'} · {aiMode === 'demo' ? 'AI preview' : 'AI connected'}</span></footer>;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from './lib/supabase';
import {
  AccountModal,
  AppFooter,
  CategoriesView,
  ExpensesView,
  OverviewView,
  ReceiptsView,
  ReportsView,
  SettingsView
} from './components/WorkspaceViews';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  FileDown,
  FileText,
  Filter,
  FolderOpen,
  Grid2X2,
  IndianRupee,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Menu,
  MoreHorizontal,
  Plus,
  ReceiptIndianRupee,
  Search,
  Settings2,
  Sparkles,
  Tag,
  UploadCloud,
  UserRound,
  WalletCards,
  X,
  Zap
} from 'lucide-react';

const fallbackWorkspaces = [
  { id: 'personal', name: 'Personal space', kind: 'individual', subtitle: 'Your everyday spending', currency: 'INR' },
  { id: 'studio', name: 'Northstar Studio', kind: 'business', subtitle: 'Small business books', currency: 'INR' }
];

const fallbackCategories = [
  'Groceries', 'Food & dining', 'Transport', 'Shopping', 'Bills & utilities',
  'Health', 'Entertainment', 'Travel', 'Software', 'Marketing',
  'Office supplies', 'Professional services', 'Rent', 'Other'
];

const fallbackExpenses = {
  personal: [
    { id: 'p-1', workspaceId: 'personal', merchant: 'Fresh Basket', category: 'Groceries', amount: 2480, tax: 0, date: '2026-08-28', paymentMethod: 'UPI', notes: 'Weekly groceries', receiptName: 'fresh-basket-aug-28.jpg', receiptRetained: true, needsReview: false },
    { id: 'p-2', workspaceId: 'personal', merchant: 'Metro Card', category: 'Transport', amount: 650, tax: 0, date: '2026-08-26', paymentMethod: 'UPI', notes: 'Monthly top-up', receiptName: '', receiptRetained: false, needsReview: false },
    { id: 'p-3', workspaceId: 'personal', merchant: 'The Green Room', category: 'Food & dining', amount: 1320, tax: 0, date: '2026-08-24', paymentMethod: 'Card', notes: 'Dinner with friends', receiptName: 'green-room-aug-24.jpg', receiptRetained: true, needsReview: false },
    { id: 'p-4', workspaceId: 'personal', merchant: 'HealthFirst Pharmacy', category: 'Health', amount: 890, tax: 0, date: '2026-08-20', paymentMethod: 'UPI', notes: 'Prescription refill', receiptName: '', receiptRetained: false, needsReview: false },
    { id: 'p-5', workspaceId: 'personal', merchant: 'Cloud Cinema', category: 'Entertainment', amount: 799, tax: 0, date: '2026-08-16', paymentMethod: 'Card', notes: 'Monthly subscription', receiptName: '', receiptRetained: false, needsReview: false }
  ],
  studio: [
    { id: 'b-1', workspaceId: 'studio', merchant: 'Figma', category: 'Software', amount: 1200, tax: 216, date: '2026-08-27', paymentMethod: 'Card', notes: 'Team design workspace', receiptName: 'figma-aug-27.pdf', receiptRetained: true, deductible: true, needsReview: false },
    { id: 'b-2', workspaceId: 'studio', merchant: 'Print Hub', category: 'Office supplies', amount: 3460, tax: 622.8, date: '2026-08-25', paymentMethod: 'Card', notes: 'Client presentation materials', receiptName: 'print-hub-aug-25.jpg', receiptRetained: true, deductible: true, needsReview: false },
    { id: 'b-3', workspaceId: 'studio', merchant: 'Swift Couriers', category: 'Transport', amount: 780, tax: 0, date: '2026-08-22', paymentMethod: 'UPI', notes: 'Prototype delivery', receiptName: '', receiptRetained: false, deductible: true, needsReview: true },
    { id: 'b-4', workspaceId: 'studio', merchant: 'Growth Engine', category: 'Marketing', amount: 8500, tax: 1530, date: '2026-08-18', paymentMethod: 'Bank transfer', notes: 'August campaign', receiptName: 'growth-engine-aug-18.pdf', receiptRetained: true, deductible: true, needsReview: false },
    { id: 'b-5', workspaceId: 'studio', merchant: 'CoWork Central', category: 'Rent', amount: 6200, tax: 1116, date: '2026-08-01', paymentMethod: 'Bank transfer', notes: 'August desk', receiptName: 'cowork-aug-01.pdf', receiptRetained: true, deductible: true, needsReview: false }
  ]
};

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

function formatLongDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function getInitials(name) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('The receipt file could not be read.'));
    reader.readAsDataURL(file);
  });
}

function safeFileName(name) {
  return String(name || 'receipt').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 110) || 'receipt';
}

function App() {
  const [workspaces, setWorkspaces] = useState(() => supabaseConfigured ? [] : fallbackWorkspaces);
  const [categories, setCategories] = useState(() => supabaseConfigured ? [] : fallbackCategories);
  const [workspaceId, setWorkspaceId] = useState(() => supabaseConfigured ? '' : 'personal');
  const [expenses, setExpenses] = useState(() => supabaseConfigured ? [] : fallbackExpenses.personal);
  const [aiMode, setAiMode] = useState('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [activeNav, setActiveNav] = useState('Overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All categories');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [receiptToReview, setReceiptToReview] = useState(null);
  const [retentionChoice, setRetentionChoice] = useState('keep');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('hisaab-theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [authReady, setAuthReady] = useState(!supabaseConfigured);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem('hisaab-theme', theme);
    } catch {
      // The app still works when browser storage is unavailable.
    }
  }, [theme]);

  const apiFetch = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
    return fetch(url, { ...options, headers });
  };

  const loadExpenses = async (nextWorkspaceId = workspaceId) => {
    try {
      const response = await apiFetch(`/api/expenses?workspaceId=${encodeURIComponent(nextWorkspaceId)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load expenses.');
      setExpenses(data.expenses || []);
      setDataError('');
    } catch (error) {
      setExpenses(supabaseConfigured ? [] : (fallbackExpenses[nextWorkspaceId] || []));
      setDataError(error.message || 'Could not load expenses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthReady(true);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession()
      .then(({ data }) => {
        if (active) {
          setSession(data.session);
          setAuthReady(true);
        }
      })
      .catch(() => {
        if (active) setAuthReady(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setAuthReady(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || (supabaseConfigured && !session)) return undefined;
    let active = true;
    let firstWorkspaceId = 'personal';
    apiFetch('/api/bootstrap')
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not connect to your Hisaab data.');
        return data;
      })
      .then((data) => {
        if (!active) return;
        setDataError('');
        if (data.user) setAccount(data.user);
        if (data.workspaces?.length) {
          firstWorkspaceId = data.workspaces[0].id;
          setWorkspaces(data.workspaces);
          setWorkspaceId((current) => data.workspaces.some((item) => item.id === current) ? current : data.workspaces[0].id);
        }
        if (data.categories?.length) setCategories(data.categories);
        setAiMode(data.ai?.mode || 'demo');
      })
      .catch((error) => {
        if (active) setDataError(error.message || 'Could not connect to your Hisaab data.');
      })
      .finally(() => {
        if (active) loadExpenses(firstWorkspaceId);
      });
    return () => { active = false; };
  }, [authReady, session?.access_token]);

  useEffect(() => {
    if (!authReady || (supabaseConfigured && !session)) return;
    if (!isLoading) loadExpenses(workspaceId);
  }, [workspaceId, session?.access_token, authReady]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const workspace = workspaces.find((item) => item.id === workspaceId) || fallbackWorkspaces[0];
  const isBusiness = workspace.kind === 'business';
  const periodLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date());
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = useMemo(() => expenses.filter((expense) => String(expense.date || '').slice(0, 7) === currentMonthKey), [expenses, currentMonthKey]);

  const visibleExpenses = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesSearch = !normalized || [expense.merchant, expense.category, expense.notes, expense.paymentMethod]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized);
      const matchesCategory = filterCategory === 'All categories' || expense.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, filterCategory]);

  const totals = useMemo(() => {
    const total = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const taxes = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.tax || 0), 0);
    const reviewCount = monthlyExpenses.filter((expense) => expense.needsReview).length;
    const deductibleExpenses = monthlyExpenses.filter((expense) => expense.deductible);
    const deductible = deductibleExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const byCategory = monthlyExpenses.reduce((result, expense) => {
      result[expense.category] = (result[expense.category] || 0) + Number(expense.amount || 0);
      return result;
    }, {});
    const allCategoryMap = expenses.reduce((result, expense) => {
      const current = result[expense.category] || { amount: 0, count: 0 };
      result[expense.category] = { amount: current.amount + Number(expense.amount || 0), count: current.count + 1 };
      return result;
    }, {});
    const topCategories = Object.entries(byCategory).sort(([, first], [, second]) => second - first).slice(0, 4);
    const allCategories = Object.entries(allCategoryMap).sort(([, first], [, second]) => second.amount - first.amount).map(([category, value]) => [category, value.amount, value.count]);
    const maxCategory = topCategories[0]?.[1] || 1;
    return {
      total,
      count: monthlyExpenses.length,
      taxes,
      reviewCount,
      deductible,
      deductibleCount: deductibleExpenses.length,
      average: monthlyExpenses.length ? total / monthlyExpenses.length : 0,
      topCategories,
      allCategories,
      maxCategory
    };
  }, [monthlyExpenses, expenses]);

  const weeklyBars = useMemo(() => {
    const bars = [
      { label: 'Mon', value: 0 }, { label: 'Tue', value: 0 }, { label: 'Wed', value: 0 },
      { label: 'Thu', value: 0 }, { label: 'Fri', value: 0 }, { label: 'Sat', value: 0 }, { label: 'Sun', value: 0 }
    ];
    monthlyExpenses.forEach((expense) => {
      const day = new Date(`${expense.date}T12:00:00`).getDay();
      const index = day === 0 ? 6 : day - 1;
      bars[index].value += Number(expense.amount || 0);
    });
    const max = Math.max(...bars.map((bar) => bar.value), 1);
    return bars.map((bar) => ({ ...bar, height: Math.max(8, Math.round((bar.value / max) * 100)) }));
  }, [expenses]);

  const selectWorkspace = (nextId) => {
    setWorkspaceId(nextId);
    setShowWorkspaceMenu(false);
    setSearchTerm('');
    setFilterCategory('All categories');
    setToast({ type: 'success', title: 'Workspace changed', message: nextId === 'studio' ? 'You are viewing Northstar Studio.' : 'You are viewing your personal spending.' });
  };

  const saveExpense = async (payload, editingId = null) => {
    const endpoint = editingId ? `/api/expenses/${editingId}` : '/api/expenses';
    const response = await apiFetch(endpoint, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, workspaceId })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Could not save the expense.');
    }
    const data = await response.json().catch(() => ({}));
    if (editingId) {
      setExpenses((current) => current.map((item) => item.id === editingId ? data.expense : item));
    } else if (data.expense) {
      setExpenses((current) => [data.expense, ...current]);
    } else {
      await loadExpenses(workspaceId);
    }
  };

  const handleSaveExpense = async (payload) => {
    try {
      await saveExpense(payload, editingExpense?.id);
      setShowAddExpense(false);
      setEditingExpense(null);
      setToast({ type: 'success', title: editingExpense ? 'Expense updated' : 'Expense added', message: 'Your numbers are safely in the review list.' });
    } catch (error) {
      setToast({ type: 'error', title: 'Could not save', message: error.message });
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete the ${formatMoney(expense.amount)} expense at ${expense.merchant}?`)) return;
    try {
      const response = await apiFetch(`/api/expenses/${expense.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete expense.');
      if (expense.receiptPath) await removePrivateReceipt(expense.receiptPath).catch(() => {});
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      setToast({ type: 'success', title: 'Expense deleted', message: 'It has been removed from this workspace.' });
    } catch (error) {
      setToast({ type: 'error', title: 'Could not delete', message: error.message });
    }
  };

  const uploadPrivateReceipt = async (file) => {
    if (!supabase || retentionChoice !== 'keep') return '';
    if (!session?.user?.id || !workspaceId) throw new Error('Your signed-in workspace is still loading. Please try again.');
    const receiptPath = `${session.user.id}/${workspaceId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from('receipts').upload(receiptPath, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message || 'The receipt could not be saved privately.');
    return receiptPath;
  };

  const removePrivateReceipt = async (receiptPath) => {
    if (!supabase || !receiptPath) return;
    await supabase.storage.from('receipts').remove([receiptPath]);
  };

  const discardReceiptReview = async () => {
    const receiptPath = receiptToReview?.receiptPath;
    setReceiptToReview(null);
    if (receiptPath) await removePrivateReceipt(receiptPath);
  };

  const handleReceiptScan = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setToast({ type: 'error', title: 'That file type is not supported', message: 'Please choose a JPG, PNG, WEBP, or PDF receipt.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', title: 'That file is too large', message: 'Please choose a receipt under 10 MB.' });
      return;
    }
    setShowScan(false);
    setReceiptToReview({ status: 'scanning', fileName: file.name });
    let receiptPath = '';
    try {
      const data = await fileToBase64(file);
      receiptPath = await uploadPrivateReceipt(file);
      const response = await apiFetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, fileName: file.name, mimeType: file.type, data, retention: retentionChoice })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The receipt could not be scanned.');
      setReceiptToReview({
        status: 'ready',
        fileName: file.name,
        mode: result.mode,
        message: result.message,
        ...result.suggestion,
        receiptPath,
        receiptRetained: retentionChoice === 'keep',
        receiptName: retentionChoice === 'keep' ? file.name : ''
      });
    } catch (error) {
      if (receiptPath) await removePrivateReceipt(receiptPath).catch(() => {});
      setReceiptToReview(null);
      setToast({ type: 'error', title: 'Scan failed', message: `${error.message} You can still add it manually.` });
    }
  };

  const confirmReceipt = async (payload) => {
    try {
      await saveExpense({ ...payload, needsReview: false }, null);
      setReceiptToReview(null);
      setToast({ type: 'success', title: 'Receipt saved', message: 'The reviewed expense is now part of your totals.' });
    } catch (error) {
      setToast({ type: 'error', title: 'Could not save receipt', message: error.message });
    }
  };

  const exportCsv = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Tax', 'Payment method', 'Notes', 'Receipt kept'];
    const rows = expenses.map((expense) => [
      expense.date,
      expense.merchant,
      expense.category,
      expense.amount,
      expense.tax || 0,
      expense.paymentMethod,
      expense.notes,
      expense.receiptRetained ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workspace.id}-expenses.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', title: 'CSV ready', message: 'Your spreadsheet download has started.' });
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAccount(null);
    setShowProfileMenu(false);
    setShowAccount(false);
  };

  const accountName = account?.name || session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'Demo account';
  const accountEmail = account?.email || session?.user?.email || (supabaseConfigured ? '' : 'demo@example.com');
  const accountCreatedAt = session?.user?.created_at || null;

  const navigateTo = (nextNav) => {
    setActiveNav(nextNav);
    setMobileNavOpen(false);
    setShowWorkspaceMenu(false);
    setShowProfileMenu(false);
  };

  const handleProfileSave = async (nextName) => {
    if (!nextName) {
      setToast({ type: 'error', title: 'Name needed', message: 'Please enter a display name.' });
      return;
    }
    setAccountSaving(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.updateUser({ data: { display_name: nextName } });
        if (error) throw error;
        setAccount((current) => ({ ...(current || {}), name: data.user?.user_metadata?.display_name || nextName }));
      } else {
        setAccount((current) => ({ ...(current || {}), name: nextName }));
      }
      setShowAccount(false);
      setToast({ type: 'success', title: 'Account updated', message: 'Your display name is saved.' });
    } catch (error) {
      setToast({ type: 'error', title: 'Could not update account', message: error.message || 'Please try again.' });
    } finally {
      setAccountSaving(false);
    }
  };

  const openPrivateReceipt = async (expense) => {
    if (!supabase || !expense.receiptPath) {
      setToast({ type: 'info', title: 'Private receipt unavailable', message: 'This expense does not have a stored receipt copy.' });
      return;
    }
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      setToast({ type: 'error', title: 'Receipt window blocked', message: 'Please allow pop-ups for Hisaab, then click the receipt again.' });
      return;
    }
    previewWindow.opener = null;
    previewWindow.document.title = 'Opening private receipt…';
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(expense.receiptPath, 60);
    if (error || !data?.signedUrl) {
      previewWindow.close();
      setToast({ type: 'error', title: 'Could not open receipt', message: error?.message || 'The private link could not be created.' });
      return;
    }
    previewWindow.location.href = data.signedUrl;
  };

  const receiptExpenses = expenses.filter((expense) => expense.receiptPath || expense.receiptName);

  const renderWorkspaceView = () => {
    const shared = {
      workspace,
      periodLabel,
      categories,
      isLoading,
      searchTerm,
      setSearchTerm,
      filterCategory,
      setFilterCategory,
      onExport: exportCsv,
      onAddExpense: () => { setEditingExpense(null); setShowAddExpense(true); },
      onEditExpense: (expense) => { setEditingExpense(expense); setShowAddExpense(true); },
      onDeleteExpense: handleDelete,
      onOpenReceipt: openPrivateReceipt
    };
    if (activeNav === 'Expenses') return <ExpensesView {...shared} expenses={expenses} visibleExpenses={visibleExpenses} />;
    if (activeNav === 'Reports') return <ReportsView workspace={workspace} periodLabel={periodLabel} totals={totals} weeklyBars={weeklyBars} onExport={exportCsv} onAddExpense={shared.onAddExpense} />;
    if (activeNav === 'Receipts') return <ReceiptsView workspace={workspace} periodLabel={periodLabel} receiptExpenses={receiptExpenses} aiMode={aiMode} onOpenScan={() => setShowScan(true)} onAddExpense={shared.onAddExpense} onEditExpense={shared.onEditExpense} onDeleteExpense={shared.onDeleteExpense} onOpenReceipt={openPrivateReceipt} />;
    if (activeNav === 'Categories') return <CategoriesView workspace={workspace} categories={categories} totals={totals} onViewExpenses={(category) => { setFilterCategory(category); navigateTo('Expenses'); }} />;
    if (activeNav === 'Settings') return <SettingsView workspace={workspace} accountName={accountName} accountEmail={accountEmail} createdAt={accountCreatedAt} theme={theme} onThemeChange={setTheme} onAccountOpen={() => setShowAccount(true)} aiMode={aiMode} supabaseConfigured={supabaseConfigured} onSignOut={handleSignOut} />;
    return <OverviewView {...shared} accountName={accountName} isBusiness={isBusiness} totals={totals} weeklyBars={weeklyBars} visibleExpenses={visibleExpenses} aiMode={aiMode} onOpenScan={() => setShowScan(true)} onReports={(next = 'Reports') => navigateTo(next)} />;
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Expenses', icon: ReceiptIndianRupee, count: expenses.length },
    { label: 'Reports', icon: BarChart3 },
    { label: 'Receipts', icon: FolderOpen }
  ];

  if (!authReady) return <LoadingScreen />;
  if (supabaseConfigured && !session) return <AuthScreen />;
  if (supabaseConfigured && isLoading) return <LoadingScreen />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><IndianRupee size={19} strokeWidth={2.5} /></div>
          <div>
            <span className="brand-name">hisaab</span>
            <span className="brand-caption">quiet money clarity</span>
          </div>
          <button className="mobile-close" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>

        <div className="workspace-picker-wrap">
          <button className="workspace-picker" type="button" onClick={() => setShowWorkspaceMenu((current) => !current)}>
            <span className={`workspace-icon ${isBusiness ? 'business' : ''}`}>{isBusiness ? <BriefcaseBusiness size={16} /> : <UserRound size={16} />}</span>
            <span className="workspace-picker-copy"><strong>{workspace.name}</strong><small>{workspace.subtitle}</small></span>
            <ChevronDown size={15} className={showWorkspaceMenu ? 'rotated' : ''} />
          </button>
          {showWorkspaceMenu && (
            <div className="workspace-menu">
              <p className="menu-label">Switch workspace</p>
              {workspaces.map((item) => (
                <button key={item.id} type="button" className={`workspace-option ${item.id === workspaceId ? 'selected' : ''}`} onClick={() => selectWorkspace(item.id)}>
                  <span className={`workspace-icon small ${item.kind === 'business' ? 'business' : ''}`}>{item.kind === 'business' ? <BriefcaseBusiness size={14} /> : <UserRound size={14} />}</span>
                  <span><strong>{item.name}</strong><small>{item.subtitle}</small></span>
                  {item.id === workspaceId && <Check size={15} />}
                </button>
              ))}
              <button className="add-workspace" type="button" onClick={() => setToast({ type: 'info', title: 'Coming after the MVP', message: 'You will be able to create more workspaces in the business phase.' })}><Plus size={14} /> Add workspace</button>
            </div>
          )}
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <p className="nav-heading">Manage</p>
          {navItems.map(({ label, icon: Icon, count }) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} type="button" onClick={() => navigateTo(label)}>
              <Icon size={18} strokeWidth={activeNav === label ? 2.4 : 1.9} />
              <span>{label}</span>
              {count !== undefined && <em>{count}</em>}
            </button>
          ))}
          <p className="nav-heading secondary-heading">Workspace</p>
          <button className={`nav-item ${activeNav === 'Categories' ? 'active' : ''}`} type="button" onClick={() => navigateTo('Categories')}><Tag size={18} /><span>Categories</span></button>
          <button className={`nav-item ${activeNav === 'Settings' ? 'active' : ''}`} type="button" onClick={() => navigateTo('Settings')}><Settings2 size={18} /><span>Settings</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><Sparkles size={16} /></div>
            <div><strong>Small steps add up</strong><p>Track one expense today. Hisaab will do the sorting.</p></div>
          </div>
          <div className="profile-row">
            <div className="avatar">{getInitials(accountName)}</div>
            <button className="profile-details-button" type="button" onClick={() => { setShowAccount(true); setShowProfileMenu(false); }}><span className="profile-copy"><strong>{accountName}</strong><span>{supabaseConfigured ? 'Free plan' : 'Demo mode'}</span></span></button>
            <button type="button" aria-label="Profile menu" onClick={() => setShowProfileMenu((current) => !current)}><MoreHorizontal size={18} /></button>
            {showProfileMenu && <div className="profile-menu"><button type="button" onClick={() => { setShowAccount(true); setShowProfileMenu(false); }}>Account details</button><button type="button" onClick={() => navigateTo('Settings')}>Settings</button>{supabaseConfigured && <button type="button" onClick={handleSignOut}><LogOut size={13} /> Sign out</button>}{!supabaseConfigured && <button type="button" onClick={() => setToast({ type: 'info', title: 'Demo mode', message: 'Connect Supabase to turn on real sign-in.' })}>About demo mode</button>}</div>}
          </div>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-backdrop" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumbs"><button className="breadcrumb-workspace" type="button" onClick={() => { setShowWorkspaceMenu(true); setMobileNavOpen(true); }}>{isBusiness ? 'Business' : 'Personal'}</button><span className="crumb-divider">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <button className="ai-status ai-status-button" type="button" onClick={() => setShowScan(true)} title={aiMode === 'demo' ? 'Receipt scanning preview' : 'Open receipt scanner'}><span className="status-dot" /> AI assistant <span className="status-label">{aiMode === 'demo' ? 'demo' : 'ready'}</span></button>
            <div className="icon-action-wrap">
              <button className="icon-action" type="button" onClick={() => setShowNotifications((current) => !current)} aria-label="Notifications"><Bell size={18} />{totals.reviewCount > 0 && <span className="notification-dot" />}</button>
              {showNotifications && <div className="notification-popover"><div className="popover-title"><strong>Notifications</strong><span>{totals.reviewCount ? `${totals.reviewCount} waiting` : 'All clear'}</span></div>{totals.reviewCount ? <div className="notification-item"><div className="notification-icon"><Zap size={14} /></div><div><strong>Receipt review waiting</strong><p>{totals.reviewCount} suggestion{totals.reviewCount === 1 ? '' : 's'} need your eyes.</p></div></div> : <div className="notification-empty"><Check size={15} /><span>You’re all caught up.</span></div>}</div>}
            </div>
            <button className="help-action" type="button" onClick={() => navigateTo('Settings')} aria-label="Open help and settings"><CircleHelp size={18} /></button>
          </div>
        </header>

        <div className="content-wrap">
          {dataError && <div className="data-error-banner" role="alert"><span><strong>We couldn’t load your hosted data.</strong><small>{dataError}</small></span><button type="button" onClick={() => window.location.reload()}>Try again</button></div>}
          {renderWorkspaceView()}
          <AppFooter hosted={supabaseConfigured} aiMode={aiMode} />
        </div>
      </main>

      {showAddExpense && <ExpenseModal expense={editingExpense} categories={categories} isBusiness={isBusiness} retentionChoice={retentionChoice} onClose={() => { setShowAddExpense(false); setEditingExpense(null); }} onSave={handleSaveExpense} />}
      {showScan && <ScanModal retentionChoice={retentionChoice} onRetentionChange={setRetentionChoice} onClose={() => setShowScan(false)} onScan={handleReceiptScan} />}
      {receiptToReview && <ReceiptReviewModal receipt={receiptToReview} categories={categories} isBusiness={isBusiness} onClose={discardReceiptReview} onConfirm={confirmReceipt} />}
      {showAccount && <AccountModal accountName={accountName} accountEmail={accountEmail} createdAt={accountCreatedAt} onClose={() => setShowAccount(false)} onSave={handleProfileSave} onSignOut={handleSignOut} saving={accountSaving} />}
      {toast && <div className={`toast toast-${toast.type || 'info'}`} role="status"><span className="toast-mark">{toast.type === 'error' ? <X size={14} /> : toast.type === 'success' ? <Check size={14} /> : <Sparkles size={14} />}</span><div><strong>{toast.title}</strong><p>{toast.message}</p></div><button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={14} /></button></div>}
    </div>
  );
}

function ExpenseModal({ expense, categories, isBusiness, retentionChoice, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    merchant: expense?.merchant || '',
    amount: expense?.amount || '',
    date: expense?.date || new Date().toISOString().slice(0, 10),
    category: expense?.category || (isBusiness ? 'Office supplies' : 'Groceries'),
    paymentMethod: expense?.paymentMethod || 'UPI',
    tax: expense?.tax || '',
    notes: expense?.notes || '',
    receiptName: expense?.receiptName || '',
    receiptPath: expense?.receiptPath || '',
    receiptRetained: expense?.receiptRetained ?? false,
    deductible: expense?.deductible ?? isBusiness,
    needsReview: false
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, amount: Number(form.amount), tax: Number(form.tax || 0) });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };
  return <div className="modal-backdrop"><div className="modal-card expense-modal"><div className="modal-header"><div><p className="panel-kicker">{expense ? 'Make a correction' : 'New expense'}</p><h2>{expense ? 'Edit expense' : 'Add an expense'}</h2><p className="modal-subtitle">A few details now makes your future self happier.</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div><form onSubmit={submit}><div className="form-grid"><label className="field wide"><span>Merchant or payee</span><input required value={form.merchant} onChange={(event) => update('merchant', event.target.value)} placeholder="e.g. Fresh Basket" autoFocus /></label><label className="field"><span>Amount</span><div className="input-with-prefix"><span>₹</span><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="0.00" /></div></label><label className="field"><span>Date</span><div className="input-with-icon"><CalendarDays size={15} /><input required type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></div></label><label className="field"><span>Category</span><select value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="field"><span>Payment method</span><select value={form.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value)}><option>UPI</option><option>Card</option><option>Cash</option><option>Bank transfer</option><option>Not set</option></select></label>{isBusiness && <label className="field"><span>Tax amount <small>optional</small></span><div className="input-with-prefix"><span>₹</span><input min="0" step="0.01" type="number" value={form.tax} onChange={(event) => update('tax', event.target.value)} placeholder="0.00" /></div></label>}<label className="field wide"><span>Notes <small>optional</small></span><textarea rows="2" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="What was this for?" /></label></div>{isBusiness && <label className="check-field"><input type="checkbox" checked={form.deductible} onChange={(event) => update('deductible', event.target.checked)} /><span><strong>Potentially deductible</strong><small>This is a reminder, not tax advice.</small></span></label>}<div className="modal-foot"><span className="form-safety"><Check size={14} /> You can edit this later</span><div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}</button></div></div>{error && <p className="form-error">{error}</p>}</form></div></div>;
}

function ScanModal({ retentionChoice, onRetentionChange, onClose, onScan }) {
  const inputRef = useRef(null);
  return <div className="modal-backdrop"><div className="modal-card scan-modal"><div className="modal-header"><div><p className="panel-kicker mint-kicker"><Sparkles size={13} /> Hisaab assist</p><h2>Scan a receipt</h2><p className="modal-subtitle">We’ll suggest the fields. You decide what gets saved.</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div><button type="button" className="big-dropzone" onClick={() => inputRef.current?.click()}><span className="big-upload-icon"><UploadCloud size={25} /></span><strong>Choose a receipt file</strong><span>or click to browse from your device</span><small>JPG, PNG, WEBP or PDF · maximum 10 MB</small></button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={(event) => onScan(event.target.files?.[0])} /><div className="retention-box"><div className="retention-copy"><span className="retention-icon"><FolderOpen size={16} /></span><span><strong>Receipt privacy</strong><small>Choose whether the original image stays in your private archive.</small></span></div><div className="segmented-control"><button className={retentionChoice === 'keep' ? 'selected' : ''} type="button" onClick={() => onRetentionChange('keep')}>Keep receipt</button><button className={retentionChoice === 'delete' ? 'selected' : ''} type="button" onClick={() => onRetentionChange('delete')}>Delete after scan</button></div></div><p className="ai-disclosure">When AI is connected, a temporary copy is sent to Gemini to read the receipt. It is kept in your private archive only when you choose <strong>Keep receipt</strong>.</p><div className="modal-foot"><span className="form-safety"><Check size={14} /> Review before saving</span><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button></div></div></div>;
}

function ReceiptReviewModal({ receipt, categories, isBusiness, onClose, onConfirm }) {
  const [form, setForm] = useState(receipt);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm(receipt);
  }, [receipt]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  if (receipt.status === 'scanning') return <div className="modal-backdrop"><div className="modal-card scanning-card"><div className="scanning-orb"><Sparkles size={25} /></div><p className="panel-kicker mint-kicker">Reading {receipt.fileName}</p><h2>Finding the useful bits…</h2><p>We’re looking for the merchant, amount, date, and category. This usually takes a moment.</p><div className="scanning-line"><span /></div><small>Never save a suggestion you haven’t checked.</small></div></div>;
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    await onConfirm({ ...form, amount: Number(form.amount), tax: Number(form.tax || 0) });
    setSaving(false);
  };
  return <div className="modal-backdrop"><div className="modal-card review-modal"><div className="modal-header"><div><p className="panel-kicker mint-kicker"><Sparkles size={13} /> Review AI suggestion</p><h2>Does this look right?</h2><p className="modal-subtitle">{form.mode === 'demo' ? 'Demo scan: the real Gemini connection is added in the AI phase.' : form.message}</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="ai-review-banner"><span className="ai-banner-icon"><Sparkles size={15} /></span><span><strong>Suggestion from receipt</strong><small>{form.fileName} · Check the total carefully</small></span><span className="confidence-tag">Needs review</span></div><form onSubmit={submit}><div className="form-grid"><label className="field wide"><span>Merchant or payee</span><input required value={form.merchant || ''} onChange={(event) => update('merchant', event.target.value)} /></label><label className="field"><span>Amount</span><div className="input-with-prefix"><span>₹</span><input required min="0.01" step="0.01" type="number" value={form.amount || ''} onChange={(event) => update('amount', event.target.value)} /></div></label><label className="field"><span>Date</span><div className="input-with-icon"><CalendarDays size={15} /><input required type="date" value={form.date || ''} onChange={(event) => update('date', event.target.value)} /></div></label><label className="field"><span>Category</span><select value={form.category || 'Other'} onChange={(event) => update('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="field"><span>Payment method</span><select value={form.paymentMethod || 'Not set'} onChange={(event) => update('paymentMethod', event.target.value)}><option>UPI</option><option>Card</option><option>Cash</option><option>Bank transfer</option><option>Not set</option></select></label>{isBusiness && <label className="field"><span>Tax amount</span><div className="input-with-prefix"><span>₹</span><input min="0" step="0.01" type="number" value={form.tax || ''} onChange={(event) => update('tax', event.target.value)} /></div></label>}</div>{isBusiness && <label className="check-field"><input type="checkbox" checked={Boolean(form.deductible)} onChange={(event) => update('deductible', event.target.checked)} /><span><strong>Potentially deductible</strong><small>Confirm with your accountant before relying on this.</small></span></label>}<div className="modal-foot"><span className="form-safety"><FileText size={14} /> {form.receiptRetained ? 'Original receipt kept privately' : 'Original receipt will be deleted'}</span><div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Discard</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Confirm & save'}</button></div></div></form></div></div>;
}

function LoadingScreen() {
  return <div className="auth-shell"><div className="loading-card"><div className="brand-mark"><IndianRupee size={19} strokeWidth={2.5} /></div><div className="loading-spinner" /><p>Getting your Hisaab ready…</p></div></div>;
}

function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('Please use a password with at least 8 characters.');
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() || email.split('@')[0] } }
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice('Account created. Check your email for the confirmation link, then come back to sign in.');
        } else {
          setNotice('Your account is ready.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      }
    } catch (authError) {
      setError(authError.message || 'We could not complete that request.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="auth-shell"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-layout"><div className="auth-intro"><div className="brand-lockup auth-brand"><div className="brand-mark"><IndianRupee size={19} strokeWidth={2.5} /></div><div><span className="brand-name">hisaab</span><span className="brand-caption">quiet money clarity</span></div></div><p className="eyebrow">A calmer money habit</p><h1>Know where your money went. <em>Feel better about what comes next.</em></h1><p className="auth-intro-copy">A simple, private place for everyday expenses and small-business books—with a helpful assistant that never saves a suggestion without your say-so.</p><div className="auth-promises"><span><Check size={14} /> Review every AI suggestion</span><span><Check size={14} /> Personal and business spaces</span><span><Check size={14} /> Export your records anytime</span></div></div><div className="auth-card"><div className="auth-card-heading"><span className="auth-spark"><Sparkles size={16} /></span><div><p className="panel-kicker">Welcome to Hisaab</p><h2>{mode === 'signin' ? 'Sign in to continue' : 'Create your account'}</h2></div></div><div className="auth-tabs"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); setNotice(''); }}>Sign in</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setNotice(''); }}>Create account</button></div><form onSubmit={submit} className="auth-form">{mode === 'signup' && <label className="field"><span>Your name <small>optional</small></span><div className="auth-input"><UserRound size={15} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Dev Anand" autoComplete="name" /></div></label>}<label className="field"><span>Email address</span><div className="auth-input"><Mail size={15} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div></label><label className="field"><span>Password</span><div className="auth-input"><LockKeyhole size={15} /><input required minLength="8" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></div></label>{error && <p className="form-error">{error}</p>}{notice && <p className="form-notice"><Check size={14} /> {notice}</p>}<button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></button></form><p className="auth-disclaimer">By continuing, you agree to use Hisaab as an expense organiser—not as a replacement for professional tax or financial advice.</p></div></div></div>;
}

export default App;

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { databaseEnabled, query, withTransaction } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const app = express();
const port = Number(process.env.PORT || 3001);

app.disable('x-powered-by');
app.use(express.json({ limit: '16mb' }));

const categories = [
  'Groceries',
  'Food & dining',
  'Transport',
  'Shopping',
  'Bills & utilities',
  'Health',
  'Entertainment',
  'Travel',
  'Software',
  'Marketing',
  'Office supplies',
  'Professional services',
  'Rent',
  'Other'
];

const workspaces = [
  {
    id: 'personal',
    name: 'Personal space',
    kind: 'individual',
    subtitle: 'Your everyday spending',
    currency: 'INR'
  },
  {
    id: 'studio',
    name: 'Northstar Studio',
    kind: 'business',
    subtitle: 'Small business books',
    currency: 'INR'
  }
];

// Temporary Phase 1 data. It remains as a safe fallback while the owner is
// wiring their local or hosted database. When DATABASE_URL is active, every
// data endpoint below uses PostgreSQL instead.
let expenses = [
  {
    id: 'p-1',
    workspaceId: 'personal',
    merchant: 'Fresh Basket',
    category: 'Groceries',
    amount: 2480,
    tax: 0,
    date: '2026-08-28',
    paymentMethod: 'UPI',
    notes: 'Weekly groceries',
    receiptName: 'fresh-basket-aug-28.jpg',
    receiptRetained: true,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'p-2',
    workspaceId: 'personal',
    merchant: 'Metro Card',
    category: 'Transport',
    amount: 650,
    tax: 0,
    date: '2026-08-26',
    paymentMethod: 'UPI',
    notes: 'Monthly top-up',
    receiptName: '',
    receiptRetained: false,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'p-3',
    workspaceId: 'personal',
    merchant: 'The Green Room',
    category: 'Food & dining',
    amount: 1320,
    tax: 0,
    date: '2026-08-24',
    paymentMethod: 'Card',
    notes: 'Dinner with friends',
    receiptName: 'green-room-aug-24.jpg',
    receiptRetained: true,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'p-4',
    workspaceId: 'personal',
    merchant: 'HealthFirst Pharmacy',
    category: 'Health',
    amount: 890,
    tax: 0,
    date: '2026-08-20',
    paymentMethod: 'UPI',
    notes: 'Prescription refill',
    receiptName: '',
    receiptRetained: false,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'p-5',
    workspaceId: 'personal',
    merchant: 'Cloud Cinema',
    category: 'Entertainment',
    amount: 799,
    tax: 0,
    date: '2026-08-16',
    paymentMethod: 'Card',
    notes: 'Monthly subscription',
    receiptName: '',
    receiptRetained: false,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'b-1',
    workspaceId: 'studio',
    merchant: 'Figma',
    category: 'Software',
    amount: 1200,
    tax: 216,
    date: '2026-08-27',
    paymentMethod: 'Card',
    notes: 'Team design workspace',
    receiptName: 'figma-aug-27.pdf',
    receiptRetained: true,
    deductible: true,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'b-2',
    workspaceId: 'studio',
    merchant: 'Print Hub',
    category: 'Office supplies',
    amount: 3460,
    tax: 622.8,
    date: '2026-08-25',
    paymentMethod: 'Card',
    notes: 'Client presentation materials',
    receiptName: 'print-hub-aug-25.jpg',
    receiptRetained: true,
    deductible: true,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'b-3',
    workspaceId: 'studio',
    merchant: 'Swift Couriers',
    category: 'Transport',
    amount: 780,
    tax: 0,
    date: '2026-08-22',
    paymentMethod: 'UPI',
    notes: 'Prototype delivery',
    receiptName: '',
    receiptRetained: false,
    deductible: true,
    needsReview: true,
    source: 'ai'
  },
  {
    id: 'b-4',
    workspaceId: 'studio',
    merchant: 'Growth Engine',
    category: 'Marketing',
    amount: 8500,
    tax: 1530,
    date: '2026-08-18',
    paymentMethod: 'Bank transfer',
    notes: 'August campaign',
    receiptName: 'growth-engine-aug-18.pdf',
    receiptRetained: true,
    deductible: true,
    needsReview: false,
    source: 'manual'
  },
  {
    id: 'b-5',
    workspaceId: 'studio',
    merchant: 'CoWork Central',
    category: 'Rent',
    amount: 6200,
    tax: 1116,
    date: '2026-08-01',
    paymentMethod: 'Bank transfer',
    notes: 'August desk',
    receiptName: 'cowork-aug-01.pdf',
    receiptRetained: true,
    deductible: true,
    needsReview: false,
    source: 'manual'
  }
];

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function cleanText(value, maxLength = 120) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

const aiUsage = new Map();
const AI_PER_MINUTE = 3;
const AI_PER_DAY = 30;

function checkAiRateLimit(userId) {
  const now = Date.now();
  const dayKey = new Date(now).toISOString().slice(0, 10);
  const current = aiUsage.get(userId) || { minuteStarted: now, minuteCount: 0, dayKey, dayCount: 0 };
  if (current.dayKey !== dayKey) {
    current.dayKey = dayKey;
    current.dayCount = 0;
  }
  if (now - current.minuteStarted >= 60_000) {
    current.minuteStarted = now;
    current.minuteCount = 0;
  }
  if (current.dayCount >= AI_PER_DAY) return { allowed: false, retryAfter: 86400 };
  if (current.minuteCount >= AI_PER_MINUTE) return { allowed: false, retryAfter: Math.max(1, Math.ceil((60_000 - (now - current.minuteStarted)) / 1000)) };
  current.minuteCount += 1;
  current.dayCount += 1;
  aiUsage.set(userId, current);
  return { allowed: true };
}

function safeReceiptPath(value, userId) {
  const pathValue = cleanText(value, 400);
  if (!pathValue) return '';
  return pathValue.startsWith(`${userId}/`) ? pathValue : '';
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseJsonResponse(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('Gemini returned an unreadable receipt result.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeAiSuggestion(value) {
  const source = value && typeof value === 'object' ? value : {};
  const categoryMatch = categories.find((category) => category.toLowerCase() === String(source.category || '').trim().toLowerCase());
  const amount = Number(source.amount);
  const tax = Number(source.tax || 0);
  return {
    merchant: cleanText(source.merchant, 80) || 'Unknown merchant',
    category: categoryMatch || 'Other',
    amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0,
    tax: Number.isFinite(tax) && tax >= 0 ? Math.round(Math.min(tax, amount || 0) * 100) / 100 : 0,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(source.date || '')) ? String(source.date) : todayIso(),
    paymentMethod: cleanText(source.paymentMethod, 40) || 'Not set',
    notes: cleanText(source.notes, 240) || 'Suggested from receipt',
    deductible: Boolean(source.deductible),
    needsReview: true,
    source: 'ai'
  };
}

async function scanWithGemini({ data, mimeType }) {
  const configuredModel = String(process.env.GEMINI_MODEL || '').trim();
  const model = !configuredModel || configuredModel === 'gemini-2.5-flash' ? 'gemini-3.6-flash' : configuredModel;
  const prompt = `Read this receipt and return only one valid JSON object. Do not use markdown or add commentary.\n\nRequired shape:\n{"merchant":"","category":"","amount":0,"tax":0,"date":"YYYY-MM-DD","paymentMethod":"Not set","notes":"","deductible":false}\n\nRules:\n- category must be exactly one of: ${categories.join(', ')}\n- amount is the final total paid, as a number\n- tax is the tax amount when visible, otherwise 0\n- use the receipt date when visible, otherwise today\n- paymentMethod must be one of UPI, Card, Cash, Bank transfer, or Not set\n- never invent a merchant or amount; use an empty merchant or 0 when unreadable\n- this result will always be shown to a person for review before saving`;
  const responseFormat = {
    type: 'text',
    mime_type: 'application/json',
    schema: {
      type: 'object',
      properties: {
        merchant: { type: 'string' },
        category: { type: 'string', enum: categories },
        amount: { type: 'number' },
        tax: { type: 'number' },
        date: { type: 'string' },
        paymentMethod: { type: 'string', enum: ['UPI', 'Card', 'Cash', 'Bank transfer', 'Not set'] },
        notes: { type: 'string' },
        deductible: { type: 'boolean' }
      },
      required: ['merchant', 'category', 'amount', 'tax', 'date', 'paymentMethod', 'notes', 'deductible']
    }
  };
  const input = [
    { type: 'text', text: prompt },
    { type: mimeType === 'application/pdf' ? 'document' : 'image', data, mime_type: mimeType }
  ];
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      model,
      input,
      response_format: responseFormat,
      generation_config: { thinking_level: 'low' },
      store: false
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = body.error?.message || 'The receipt assistant is temporarily unavailable.';
    const error = new Error(reason);
    error.status = response.status;
    throw error;
  }
  const text = body.output_text
    || body.steps?.filter((step) => step.type === 'model_output').flatMap((step) => step.content || []).map((part) => part.text || '').join('')
    || body.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
    || '';
  return normalizeAiSuggestion(parseJsonResponse(text));
}

function authMode() {
  return process.env.AUTH_MODE === 'supabase' && supabaseAuth ? 'supabase' : 'demo';
}

function configurationIssues() {
  const issues = [];
  if (process.env.AUTH_MODE === 'supabase' && !supabaseAuth) issues.push('Supabase Auth variables are missing.');
  if (process.env.DEMO_MODE !== 'true' && !process.env.DATABASE_URL) issues.push('DATABASE_URL is missing for hosted persistence.');
  if (process.env.NODE_ENV === 'production' && !process.env.GEMINI_API_KEY) issues.push('GEMINI_API_KEY is missing for receipt scanning.');
  return issues;
}

function parseExpenseInput(body, existing = {}) {
  const merchant = cleanText(body.merchant ?? existing.merchant, 80);
  const category = cleanText(body.category ?? existing.category, 50);
  const date = cleanText(body.date ?? existing.date, 10);
  const amount = Number(body.amount ?? existing.amount);
  const tax = Number(body.tax ?? existing.tax ?? 0);

  if (!merchant) throw new Error('Please add a merchant or payee.');
  if (!categories.includes(category)) throw new Error('Please choose a category from the list.');
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    throw new Error('Please enter a valid amount.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Please enter a valid date.');
  if (!Number.isFinite(tax) || tax < 0 || tax > amount) throw new Error('Please enter a valid tax amount.');

  return {
    merchant,
    category,
    amount: Math.round(amount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    date,
    paymentMethod: cleanText(body.paymentMethod ?? existing.paymentMethod, 40) || 'Not set',
    notes: cleanText(body.notes ?? existing.notes, 240),
    receiptName: cleanText(body.receiptName ?? existing.receiptName, 160),
    receiptPath: cleanText(body.receiptPath ?? existing.receiptPath, 400),
    receiptRetained: Boolean(body.receiptRetained ?? existing.receiptRetained),
    deductible: Boolean(body.deductible ?? existing.deductible),
    needsReview: Boolean(body.needsReview ?? existing.needsReview),
    source: body.source === 'ai' || existing.source === 'ai' ? 'ai' : 'manual'
  };
}

function mapExpenseRow(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    merchant: row.merchant,
    category: row.category,
    amount: Number(row.amount),
    tax: Number(row.tax || 0),
    currency: row.currency,
    date: row.expense_date instanceof Date ? row.expense_date.toISOString().slice(0, 10) : String(row.expense_date).slice(0, 10),
    paymentMethod: row.payment_method,
    notes: row.notes,
    receiptName: row.receipt_name,
    receiptPath: row.receipt_path || '',
    receiptRetained: row.receipt_retained,
    needsReview: row.needs_review,
    deductible: row.deductible,
    source: row.source
  };
}

async function requireUser(req, res) {
  if (configurationIssues().length) {
    res.status(503).json({ error: 'The Hisaab server is not fully configured yet.' });
    return null;
  }
  if (authMode() === 'demo') {
    return { id: 'demo-user', email: 'demo@example.com', displayName: 'Demo account' };
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Please sign in first.' });
    return null;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' });
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email || '',
    displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Hisaab user'
  };
}

async function ensureUserAndWorkspaces(user) {
  await query(
    `insert into app_users (id, email, display_name)
     values ($1, $2, $3)
     on conflict (id) do update set email = excluded.email, display_name = excluded.display_name, updated_at = now()`,
    [user.id, user.email, user.displayName]
  );

  const existing = await query(
    `select w.id, w.name, w.kind, w.subtitle, w.currency
     from workspaces w
     join workspace_members wm on wm.workspace_id = w.id
     where wm.user_id = $1
     order by w.created_at asc`,
    [user.id]
  );

  if (existing.rowCount === 0) {
    await withTransaction(async (client) => {
      const personal = await client.query(
        `insert into workspaces (owner_id, name, kind, subtitle, currency)
         values ($1, 'Personal space', 'individual', 'Your everyday spending', 'INR')
         returning id`,
        [user.id]
      );
      const business = await client.query(
        `insert into workspaces (owner_id, name, kind, subtitle, currency)
         values ($1, 'Northstar Studio', 'business', 'Small business books', 'INR')
         returning id`,
        [user.id]
      );
      await client.query(
        `insert into workspace_members (workspace_id, user_id, role)
         values ($1, $3, 'owner'), ($2, $3, 'owner')`,
        [personal.rows[0].id, business.rows[0].id, user.id]
      );
    });
  }

  const workspacesResult = await query(
    `select w.id, w.name, w.kind, w.subtitle, w.currency
     from workspaces w
     join workspace_members wm on wm.workspace_id = w.id
     where wm.user_id = $1
     order by w.created_at asc`,
    [user.id]
  );
  return workspacesResult.rows;
}

async function getWorkspaceForUser(workspaceId, userId) {
  if (!isUuid(workspaceId)) return null;
  const result = await query(
    `select w.id, w.name, w.kind, w.subtitle, w.currency
     from workspaces w
     join workspace_members wm on wm.workspace_id = w.id
     where w.id = $1::uuid and wm.user_id = $2`,
    [workspaceId, userId]
  );
  return result.rows[0] || null;
}

app.get('/api/health', (_req, res) => {
  const issues = configurationIssues();
  res.status(issues.length ? 503 : 200).json({
    ok: issues.length === 0,
    mode: databaseEnabled() ? 'postgres' : 'demo',
    auth: authMode(),
    issues
  });
});

app.get('/api/bootstrap', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    if (databaseEnabled()) {
      const liveWorkspaces = await ensureUserAndWorkspaces(user);
      const liveCategories = await query('select label from expense_categories order by sort_order, label');
      return res.json({
        user: { id: user.id, name: user.displayName, email: user.email },
        workspaces: liveWorkspaces,
        categories: liveCategories.rows.map((row) => row.label),
        ai: {
          configured: Boolean(process.env.GEMINI_API_KEY),
          mode: process.env.GEMINI_API_KEY ? 'ready-for-ai-phase' : 'demo'
        }
      });
    }

    res.json({
      user: { id: user.id, name: user.displayName, email: user.email },
      workspaces,
      categories,
      ai: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        mode: process.env.GEMINI_API_KEY ? 'ready-for-ai-phase' : 'demo'
      }
    });
  } catch (error) {
    console.error('Bootstrap error:', error.message);
    res.status(500).json({ error: 'The database is not ready yet. Please check the setup instructions.' });
  }
});

app.get('/api/expenses', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const workspaceId = cleanText(req.query.workspaceId, 80);

  try {
    if (!databaseEnabled()) {
      const result = expenses
        .filter((expense) => expense.workspaceId === (workspaceId || 'personal'))
        .sort((a, b) => `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`));
      return res.json({ expenses: result });
    }

    const workspace = await getWorkspaceForUser(workspaceId, user.id);
    if (!workspace) return res.status(403).json({ error: 'You do not have access to that workspace.' });
    const result = await query(
      `select id, workspace_id, merchant, category, amount, tax, currency,
              expense_date, payment_method, notes, receipt_name, receipt_path,
              receipt_retained, deductible, needs_review, source
       from expenses
       where workspace_id = $1::uuid
       order by expense_date desc, created_at desc`,
      [workspace.id]
    );
    res.json({ expenses: result.rows.map(mapExpenseRow) });
  } catch (error) {
    console.error('Expense list error:', error.message);
    res.status(500).json({ error: 'Could not load expenses.' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const workspaceId = cleanText(req.body.workspaceId, 80);
    const parsed = parseExpenseInput(req.body);
    parsed.receiptPath = safeReceiptPath(parsed.receiptPath, user.id);

    if (!databaseEnabled()) {
      const validWorkspace = workspaces.some((workspace) => workspace.id === workspaceId);
      if (!validWorkspace) return res.status(403).json({ error: 'Please choose a valid workspace.' });
      const expense = {
        id: `${workspaceId === 'studio' ? 'b' : 'p'}-${Date.now()}`,
        workspaceId,
        ...parsed
      };
      expenses = [expense, ...expenses];
      return res.status(201).json({ expense });
    }

    const workspace = await getWorkspaceForUser(workspaceId, user.id);
    if (!workspace) return res.status(403).json({ error: 'You do not have access to that workspace.' });
    const result = await query(
      `insert into expenses
       (workspace_id, created_by, merchant, category, amount, tax, currency,
        expense_date, payment_method, notes, receipt_name, receipt_path,
        receipt_retained, deductible, needs_review, source)
       values ($1::uuid, $2, $3, $4, $5, $6, $7, $8::date, $9, $10, $11, $12, $13, $14, $15, $16)
       returning id, workspace_id, merchant, category, amount, tax, currency,
                 expense_date, payment_method, notes, receipt_name, receipt_path,
                 receipt_retained, deductible, needs_review, source`,
      [
        workspace.id, user.id, parsed.merchant, parsed.category, parsed.amount,
        parsed.tax, workspace.currency, parsed.date, parsed.paymentMethod,
        parsed.notes, parsed.receiptName, parsed.receiptPath, parsed.receiptRetained,
        parsed.deductible, parsed.needsReview, parsed.source
      ]
    );
    res.status(201).json({ expense: mapExpenseRow(result.rows[0]) });
  } catch (error) {
    console.error('Expense create error:', error.message);
    res.status(400).json({ error: error.message || 'Could not save the expense.' });
  }
});

app.patch('/api/expenses/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    if (!databaseEnabled()) {
      const index = expenses.findIndex((expense) => expense.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Expense not found.' });
      expenses[index] = { ...expenses[index], ...parseExpenseInput(req.body, expenses[index]) };
      return res.json({ expense: expenses[index] });
    }

    const current = await query(
      `select e.* from expenses e
       join workspace_members wm on wm.workspace_id = e.workspace_id
       where e.id = $1::uuid and wm.user_id = $2`,
      [req.params.id, user.id]
    );
    if (!current.rowCount) return res.status(404).json({ error: 'Expense not found.' });
    const parsed = parseExpenseInput(req.body, mapExpenseRow(current.rows[0]));
    parsed.receiptPath = safeReceiptPath(parsed.receiptPath, user.id);
    const workspace = await getWorkspaceForUser(current.rows[0].workspace_id, user.id);
    const result = await query(
      `update expenses set merchant = $1, category = $2, amount = $3, tax = $4,
        expense_date = $5::date, payment_method = $6, notes = $7,
        receipt_name = $8, receipt_path = $9, receipt_retained = $10, deductible = $11,
        needs_review = $12, source = $13, updated_at = now()
       where id = $14::uuid
       returning id, workspace_id, merchant, category, amount, tax, currency,
                 expense_date, payment_method, notes, receipt_name, receipt_path,
                 receipt_retained, deductible, needs_review, source`,
      [
        parsed.merchant, parsed.category, parsed.amount, parsed.tax, parsed.date,
        parsed.paymentMethod, parsed.notes, parsed.receiptName, parsed.receiptPath, parsed.receiptRetained,
        parsed.deductible, parsed.needsReview, parsed.source, req.params.id
      ]
    );
    if (!workspace) return res.status(403).json({ error: 'You do not have access to that workspace.' });
    res.json({ expense: mapExpenseRow(result.rows[0]) });
  } catch (error) {
    console.error('Expense update error:', error.message);
    res.status(400).json({ error: error.message || 'Could not update the expense.' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    if (!databaseEnabled()) {
      const before = expenses.length;
      expenses = expenses.filter((expense) => expense.id !== req.params.id);
      if (expenses.length === before) return res.status(404).json({ error: 'Expense not found.' });
      return res.status(204).end();
    }

    const result = await query(
      `delete from expenses e
       using workspace_members wm
       where e.id = $1::uuid and wm.workspace_id = e.workspace_id and wm.user_id = $2
       returning e.id`,
      [req.params.id, user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Expense not found.' });
    res.status(204).end();
  } catch (error) {
    console.error('Expense delete error:', error.message);
    res.status(500).json({ error: 'Could not delete the expense.' });
  }
});

app.post('/api/ai/scan', async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const workspaceId = cleanText(req.body.workspaceId, 80);
    if (databaseEnabled()) {
      const workspace = await getWorkspaceForUser(workspaceId, user.id);
      if (!workspace) return res.status(403).json({ error: 'You do not have access to that workspace.' });
    }

    const isBusinessWorkspace = !databaseEnabled() && workspaceId === 'studio';
    if (!process.env.GEMINI_API_KEY) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return res.json({
        mode: 'demo',
        message: 'This is a demo scan. Add a Gemini API key to read your real receipts.',
        suggestion: isBusinessWorkspace
          ? {
              merchant: 'Brightline Supplies',
              category: 'Office supplies',
              amount: 2840,
              tax: 511.2,
              date: todayIso(),
              paymentMethod: 'Card',
              notes: 'Suggested from receipt',
              deductible: true,
              needsReview: true,
              source: 'ai'
            }
          : {
              merchant: 'Sunrise Market',
              category: 'Groceries',
              amount: 1640,
              tax: 0,
              date: todayIso(),
              paymentMethod: 'UPI',
              notes: 'Suggested from receipt',
              deductible: false,
              needsReview: true,
              source: 'ai'
            }
      });
    }

    const rate = checkAiRateLimit(user.id);
    if (!rate.allowed) {
      res.set('Retry-After', String(rate.retryAfter));
      return res.status(429).json({ error: rate.retryAfter > 3600 ? 'You have reached today’s receipt scan limit. Please try again tomorrow.' : `Please wait ${rate.retryAfter} seconds before scanning another receipt.` });
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    const mimeType = cleanText(req.body.mimeType, 80);
    const data = cleanText(req.body.data, 14_000_000);
    if (!allowedMimeTypes.has(mimeType)) return res.status(400).json({ error: 'Please upload a JPG, PNG, WEBP, or PDF receipt.' });
    if (!data || data.length < 20) return res.status(400).json({ error: 'The receipt file could not be read. Please choose it again.' });
    if (!/^[A-Za-z0-9+/=]+$/.test(data)) return res.status(400).json({ error: 'The receipt file format is not valid.' });

    const suggestion = await scanWithGemini({ data, mimeType });
    return res.json({ mode: 'gemini', message: 'Gemini made a careful first pass. Please review every field before saving.', suggestion });
  } catch (error) {
    console.error('Receipt scan error:', error.message);
    const status = error.status === 429 ? 429 : 502;
    return res.status(status).json({ error: status === 429 ? 'Gemini is temporarily rate-limited. Please try again later.' : error.message || 'The receipt assistant could not read that file.' });
  }
});

const distPath = path.join(root, 'dist');
app.use(express.static(distPath));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (error) => {
    if (error) res.status(404).send('Hisaab is ready for the frontend build.');
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Hisaab API listening on http://0.0.0.0:${port}`);
  console.log(`Data mode: ${databaseEnabled() ? 'PostgreSQL' : 'demo memory'}; auth mode: ${authMode()}`);
  const issues = configurationIssues();
  if (issues.length) console.error(`Configuration check failed: ${issues.join(' ')}`);
});

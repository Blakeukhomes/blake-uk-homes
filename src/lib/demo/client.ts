// Fake Supabase client used in demo mode. Mirrors the subset of the API used in this codebase.
import { DEMO_DATA, DEMO_USER_ID } from './data'

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@blakeukhomes.local',
  full_name: 'Sam Blake',
} as const

export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return true
  if (url.includes('placeholder') || url.includes('YOUR-PROJECT')) return true
  if (key.includes('placeholder') || key.startsWith('eyJhbGciOi...')) return true
  return false
}

// ---- Chainable query ---------------------------------------------------------

type Filter = { op: 'eq' | 'neq' | 'is' | 'gte' | 'lte' | 'gt' | 'lt'; col: string; val: any }

class DemoQuery implements PromiseLike<any> {
  private table: string
  private filters: Filter[] = []
  private orderBy: { col: string; ascending: boolean } | null = null
  private limitN: number | null = null
  private singleMode: 'single' | 'maybe' | null = null
  private fixedResult: any = null // for insert/update/delete

  constructor(table: string) {
    this.table = table
  }

  select(_cols?: string) { return this }
  eq(col: string, val: any)  { this.filters.push({ op: 'eq', col, val });  return this }
  neq(col: string, val: any) { this.filters.push({ op: 'neq', col, val }); return this }
  is(col: string, val: any)  { this.filters.push({ op: 'is', col, val });  return this }
  gte(col: string, val: any) { this.filters.push({ op: 'gte', col, val }); return this }
  lte(col: string, val: any) { this.filters.push({ op: 'lte', col, val }); return this }
  gt(col: string, val: any)  { this.filters.push({ op: 'gt', col, val });  return this }
  lt(col: string, val: any)  { this.filters.push({ op: 'lt', col, val });  return this }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, ascending: opts?.ascending ?? true }
    return this
  }
  limit(n: number) { this.limitN = n; return this }
  single()         { this.singleMode = 'single'; return this }
  maybeSingle()    { this.singleMode = 'maybe';  return this }

  insert(payload: any) {
    const id = 'demo-' + Math.random().toString(36).slice(2, 8)
    const created = Array.isArray(payload)
      ? payload.map((p) => ({ id: 'demo-' + Math.random().toString(36).slice(2, 8), ...p }))
      : { id, ...payload }
    const next = new DemoQuery(this.table)
    next.fixedResult = { data: created, error: null }
    return next
  }
  update(_payload: any) {
    const next = new DemoQuery(this.table)
    next.fixedResult = { data: null, error: null }
    return next
  }
  delete() {
    const next = new DemoQuery(this.table)
    next.fixedResult = { data: null, error: null }
    return next
  }
  upsert(payload: any) { return this.insert(payload) }

  private resolve(): any {
    if (this.fixedResult) {
      if (this.singleMode) {
        const d = Array.isArray(this.fixedResult.data) ? this.fixedResult.data[0] : this.fixedResult.data
        return { data: d ?? { id: 'demo-x' }, error: null }
      }
      return this.fixedResult
    }
    let rows = [...(DEMO_DATA[this.table] ?? [])]
    for (const f of this.filters) {
      if (f.op === 'eq')  rows = rows.filter((r) => r[f.col] === f.val)
      if (f.op === 'neq') rows = rows.filter((r) => r[f.col] !== f.val)
      if (f.op === 'is')  rows = rows.filter((r) => r[f.col] === f.val)
      if (f.op === 'gte') rows = rows.filter((r) => r[f.col] >= f.val)
      if (f.op === 'lte') rows = rows.filter((r) => r[f.col] <= f.val)
      if (f.op === 'gt')  rows = rows.filter((r) => r[f.col] >  f.val)
      if (f.op === 'lt')  rows = rows.filter((r) => r[f.col] <  f.val)
    }
    if (this.orderBy) {
      const { col, ascending } = this.orderBy
      rows.sort((a, b) => {
        const av = a[col], bv = b[col]
        if (av == null && bv == null) return 0
        if (av == null) return ascending ? -1 : 1
        if (bv == null) return ascending ? 1 : -1
        if (av < bv) return ascending ? -1 : 1
        if (av > bv) return ascending ? 1 : -1
        return 0
      })
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN)
    if (this.singleMode === 'single') {
      return { data: rows[0] ?? null, error: rows[0] ? null : { code: 'PGRST116', message: 'No rows' } }
    }
    if (this.singleMode === 'maybe') {
      return { data: rows[0] ?? null, error: null }
    }
    return { data: rows, error: null }
  }

  then<TResult1 = any, TResult2 = never>(
    onFulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.resolve()).then(onFulfilled ?? undefined, onRejected ?? undefined)
  }
}

// ---- Storage stub ------------------------------------------------------------

const storage = {
  from(_bucket: string) {
    return {
      async upload(_path: string, _file: any, _opts?: any) { return { data: { path: _path }, error: null } },
      async download(_path: string) { return { data: null, error: { message: 'Demo mode, storage disabled' } as any } },
      async remove(_paths: string[]) { return { data: null, error: null } },
      getPublicUrl(path: string) { return { data: { publicUrl: `/demo/${path}` } } },
      async createSignedUrl(path: string) { return { data: { signedUrl: `/demo/${path}` }, error: null } },
    }
  },
}

// ---- Auth stub ---------------------------------------------------------------

const auth = {
  async getUser() {
    return { data: { user: { id: DEMO_USER.id, email: DEMO_USER.email } }, error: null }
  },
  async getSession() {
    return { data: { session: { user: { id: DEMO_USER.id, email: DEMO_USER.email } } }, error: null }
  },
  async signOut() { return { error: null } },
  async signInWithPassword(_: any) {
    return { data: { user: { id: DEMO_USER.id, email: DEMO_USER.email }, session: null }, error: null }
  },
  async signUp(_: any) {
    return { data: { user: null, session: null }, error: { message: 'Demo mode, sign-up disabled.' } as any }
  },
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe() {} } } }
  },
}

// ---- The exported "client" ---------------------------------------------------

export function createDemoClient(): any {
  return {
    auth,
    storage,
    from(table: string) { return new DemoQuery(table) },
  }
}

import { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, RefreshCw, Search, UsersRound } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type CoordinatorProfile = {
  school_id: string;
  clinic_id: string;
  school_name: string;
  coordinator_name: string | null;
  coordinator_email: string | null;
  coordinator_phone: string | null;
  clinic_name: string;
};

type CoordinatorTrainee = {
  trainee_id: string;
  full_name: string;
  course: string | null;
  email: string | null;
  required_hours: number;
  rendered_hours: number;
  pending_hours: number;
  pending_logs: number;
  status: 'active' | 'completed' | 'withdrawn';
  start_date: string | null;
  end_date: string | null;
  last_log_at: string | null;
  photo_public_url: string | null;
};

type NoticeType = 'success' | 'warning' | 'error';

export function OjtCoordinatorPortal() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [profile, setProfile] = useState<CoordinatorProfile | null>(null);
  const [trainees, setTrainees] = useState<CoordinatorTrainee[]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>('warning');
  const [isLoading, setIsLoading] = useState(false);

  const filteredTrainees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return trainees;
    return trainees.filter((trainee) => [
      trainee.full_name,
      trainee.course ?? '',
      trainee.email ?? '',
      trainee.status,
    ].join(' ').toLowerCase().includes(query));
  }, [search, trainees]);

  const totals = useMemo(() => {
    const rendered = trainees.reduce((sum, trainee) => sum + Number(trainee.rendered_hours || 0), 0);
    const required = trainees.reduce((sum, trainee) => sum + Number(trainee.required_hours || 0), 0);
    const pending = trainees.reduce((sum, trainee) => sum + Number(trainee.pending_logs || 0), 0);
    return { rendered, required, pending };
  }, [trainees]);

  const notify = (message: string, type: NoticeType = 'warning') => {
    setNotice(message);
    setNoticeType(type);
  };

  const loadCoordinatorData = async (nextEmail = email, nextAccessCode = accessCode) => {
    if (!supabase || !nextEmail.trim() || !nextAccessCode.trim()) {
      return;
    }

    setIsLoading(true);
    setNotice('');
    const credentials = { p_email: nextEmail.trim(), p_access_code: nextAccessCode.trim() };
    const { data: profileRows, error: profileError } = await supabase.rpc('ojt_coordinator_profile', credentials);

    if (profileError) {
      notify(profileError.message, 'error');
      setIsLoading(false);
      return;
    }

    const nextProfile = (profileRows?.[0] ?? null) as CoordinatorProfile | null;
    if (!nextProfile) {
      notify('No coordinator access matched those details.', 'warning');
      setProfile(null);
      setTrainees([]);
      setIsLoading(false);
      return;
    }

    const { data: traineeRows, error: traineesError } = await supabase.rpc('ojt_coordinator_trainees', credentials);
    if (traineesError) {
      notify(traineesError.message, 'error');
    }

    setProfile(nextProfile);
    setTrainees((traineeRows ?? []) as CoordinatorTrainee[]);
    window.localStorage.setItem('psyzygy_ojt_coordinator', JSON.stringify({ email: nextEmail.trim(), accessCode: nextAccessCode.trim() }));
    setIsLoading(false);
  };

  useEffect(() => {
    const saved = window.localStorage.getItem('psyzygy_ojt_coordinator');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { email?: string; accessCode?: string };
      if (parsed.email && parsed.accessCode) {
        setEmail(parsed.email);
        setAccessCode(parsed.accessCode);
        void loadCoordinatorData(parsed.email, parsed.accessCode);
      }
    } catch {
      window.localStorage.removeItem('psyzygy_ojt_coordinator');
    }
  }, []);

  const logout = () => {
    window.localStorage.removeItem('psyzygy_ojt_coordinator');
    setProfile(null);
    setTrainees([]);
    setEmail('');
    setAccessCode('');
    setSearch('');
    setNotice('');
  };

  if (!isSupabaseConfigured) {
    return (
      <CoordinatorShell>
        <PortalCard title="OJT Coordinator Portal">
          <Notice message="Supabase is not configured." type="error" />
        </PortalCard>
      </CoordinatorShell>
    );
  }

  return (
    <CoordinatorShell>
      {!profile ? (
        <PortalCard title="OJT Coordinator Portal">
          <div className="space-y-4">
            <Input label="Coordinator email" value={email} onChange={setEmail} type="email" />
            <Input label="Access code" value={accessCode} onChange={setAccessCode} type="password" />
            {notice && <Notice message={notice} type={noticeType} />}
            <button
              type="button"
              onClick={() => loadCoordinatorData()}
              disabled={isLoading || !email.trim() || !accessCode.trim()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" /> {isLoading ? 'Checking...' : 'Login'}
            </button>
          </div>
        </PortalCard>
      ) : (
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 sm:px-4 sm:py-8">
          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">OJT Coordinator Portal</p>
                <h1 className="mt-2 text-2xl font-normal text-foreground sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>{profile.school_name}</h1>
                <p className="mt-1 text-sm text-foreground/55">{profile.coordinator_name || 'Coordinator'} | {profile.clinic_name}</p>
              </div>
              <div className="grid gap-2 sm:flex">
                <button type="button" onClick={() => loadCoordinatorData()} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                <button type="button" onClick={logout} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <Metric label="Students" value={String(trainees.length)} />
              <Metric label="Rendered Hours" value={totals.rendered.toFixed(2)} />
              <Metric label="Required Hours" value={String(totals.required)} />
              <Metric label="Pending Logs" value={String(totals.pending)} />
            </div>
          </div>

          {notice && <Notice message={notice} type={noticeType} />}

          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-3 sm:min-w-[320px]">
                <Search className="h-4 w-4 text-foreground/35" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground/60">
                <UsersRound className="h-3.5 w-3.5" /> {filteredTrainees.length} shown
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:hidden">
              {filteredTrainees.map((trainee) => <TraineeCard key={trainee.trainee_id} trainee={trainee} />)}
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-lg border border-border lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-border bg-[#f7f4f0] text-xs uppercase tracking-wide text-foreground/45">
                  <tr>
                    <th className="w-[30%] px-4 py-3">Student</th>
                    <th className="w-[18%] px-4 py-3">Status</th>
                    <th className="w-[22%] px-4 py-3">Hours</th>
                    <th className="w-[15%] px-4 py-3">Pending</th>
                    <th className="w-[15%] px-4 py-3">Last Log</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainees.map((trainee) => (
                    <tr key={trainee.trainee_id} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-4">
                        <p className="truncate font-semibold text-foreground">{trainee.full_name}</p>
                        <p className="mt-1 truncate text-xs text-foreground/50">{trainee.course || 'Course not provided'}</p>
                      </td>
                      <td className="px-4 py-4"><StatusPill status={trainee.status} /></td>
                      <td className="px-4 py-4"><Progress trainee={trainee} /></td>
                      <td className="px-4 py-4 text-foreground/60">{Number(trainee.pending_hours).toFixed(2)} hrs / {trainee.pending_logs} log(s)</td>
                      <td className="px-4 py-4 text-foreground/60">{trainee.last_log_at ? formatDateTime(trainee.last_log_at) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTrainees.length === 0 && (
              <p className="mt-4 rounded-lg bg-[#f7f4f0] p-5 text-center text-sm text-foreground/45">No OJT students found.</p>
            )}
          </div>
        </div>
      )}
    </CoordinatorShell>
  );
}

function TraineeCard({ trainee }: { trainee: CoordinatorTrainee }) {
  return (
    <div className="rounded-lg bg-[#f7f4f0] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{trainee.full_name}</p>
          <p className="mt-1 text-xs text-foreground/50">{trainee.course || 'Course not provided'}</p>
        </div>
        <StatusPill status={trainee.status} />
      </div>
      <div className="mt-3">
        <Progress trainee={trainee} />
      </div>
      <p className="mt-3 text-xs text-foreground/55">Pending: {Number(trainee.pending_hours).toFixed(2)} hrs / {trainee.pending_logs} log(s)</p>
    </div>
  );
}

function Progress({ trainee }: { trainee: CoordinatorTrainee }) {
  const progress = trainee.required_hours ? Math.min(100, Math.round((Number(trainee.rendered_hours) / trainee.required_hours) * 100)) : 0;
  return (
    <div>
      <p className="font-semibold text-primary">{Number(trainee.rendered_hours).toFixed(2)} / {trainee.required_hours} hrs</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-foreground/45">{progress}% complete</p>
    </div>
  );
}

function CoordinatorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f4f0] text-foreground">
      <div className="absolute inset-x-0 top-0 h-40 bg-white" />
      <div className="relative">{children}</div>
    </main>
  );
}

function PortalCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <div className="w-full rounded-lg border border-border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">PSYZYGY Psychological Center Inc.</p>
        <h1 className="mt-3 text-3xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        <p className="mb-6 mt-2 text-sm text-foreground/55">Login with your registered coordinator email and access code.</p>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7f4f0] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Notice({ message, type }: { message: string; type: NoticeType }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-red-200 bg-red-50 text-red-700',
  };

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>{message}</div>;
}

function StatusPill({ status }: { status: CoordinatorTrainee['status'] }) {
  const styles = {
    active: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
    withdrawn: 'bg-red-50 text-red-700',
  };

  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}>{status}</span>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

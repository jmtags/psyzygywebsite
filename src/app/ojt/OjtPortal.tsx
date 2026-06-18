import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Clock, LogIn, LogOut, RefreshCw, UserRound, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type PortalProfile = {
  trainee_id: string;
  clinic_id: string;
  full_name: string;
  school_name: string | null;
  course: string | null;
  required_hours: number;
  rendered_hours: number;
  status: string;
  clinic_name: string;
};

type PortalLog = {
  id: string;
  log_date: string;
  time_in: string;
  time_out: string | null;
  rendered_hours: number;
};

type NoticeType = 'success' | 'warning' | 'error';

export function OjtPortal() {
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [logs, setLogs] = useState<PortalLog[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>('warning');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openLog = useMemo(() => logs.find((log) => !log.time_out) ?? null, [logs]);
  const progress = profile?.required_hours ? Math.min(100, Math.round((Number(profile.rendered_hours) / profile.required_hours) * 100)) : 0;

  const notify = (message: string, type: NoticeType = 'warning') => {
    setNoticeType(type);
    setNotice(message);
  };

  const loadPortalData = async (nextEmail = email, nextDateOfBirth = dateOfBirth) => {
    if (!supabase || !nextEmail.trim() || !nextDateOfBirth) {
      return;
    }

    setIsLoading(true);
    setNotice('');
    const credentials = { p_email: nextEmail.trim(), p_date_of_birth: nextDateOfBirth };
    const { data: profileRows, error: profileError } = await supabase.rpc('ojt_portal_profile', credentials);

    if (profileError) {
      notify(profileError.message, 'error');
      setIsLoading(false);
      return;
    }

    const nextProfile = (profileRows?.[0] ?? null) as PortalProfile | null;
    if (!nextProfile) {
      notify('No active OJT record matched those details.', 'warning');
      setProfile(null);
      setLogs([]);
      setIsLoading(false);
      return;
    }

    const { data: logRows, error: logsError } = await supabase.rpc('ojt_portal_logs', credentials);
    if (logsError) {
      notify(logsError.message, 'error');
    }

    setProfile(nextProfile);
    setLogs((logRows ?? []) as PortalLog[]);
    window.localStorage.setItem('psyzygy_ojt_portal', JSON.stringify({ email: nextEmail.trim(), dateOfBirth: nextDateOfBirth }));
    setIsLoading(false);
  };

  useEffect(() => {
    const saved = window.localStorage.getItem('psyzygy_ojt_portal');
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as { email?: string; dateOfBirth?: string };
      if (parsed.email && parsed.dateOfBirth) {
        setEmail(parsed.email);
        setDateOfBirth(parsed.dateOfBirth);
        void loadPortalData(parsed.email, parsed.dateOfBirth);
      }
    } catch {
      window.localStorage.removeItem('psyzygy_ojt_portal');
    }
  }, []);

  const timeIn = async () => {
    if (!supabase || isSaving) {
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.rpc('ojt_portal_time_in', { p_email: email.trim(), p_date_of_birth: dateOfBirth });
    if (error) {
      notify(error.message, 'error');
    } else {
      notify('Time in recorded.', 'success');
      await loadPortalData();
    }
    setIsSaving(false);
  };

  const timeOut = async () => {
    if (!supabase || isSaving) {
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.rpc('ojt_portal_time_out', { p_email: email.trim(), p_date_of_birth: dateOfBirth });
    if (error) {
      notify(error.message, 'error');
    } else {
      notify('Time out recorded.', 'success');
      await loadPortalData();
    }
    setIsSaving(false);
  };

  const logout = () => {
    window.localStorage.removeItem('psyzygy_ojt_portal');
    setProfile(null);
    setLogs([]);
    setEmail('');
    setDateOfBirth('');
    setNotice('');
    setIsProfileOpen(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <PortalShell>
        <PortalCard title="OJT Portal">
          <Notice message="Supabase is not configured." type="error" />
        </PortalCard>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      {!profile ? (
        <PortalCard title="OJT Time Log">
          <div className="space-y-4">
            <Input label="Email" value={email} onChange={setEmail} type="email" />
            <Input label="Date of birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
            {notice && <Notice message={notice} type={noticeType} />}
            <button
              type="button"
              onClick={() => loadPortalData()}
              disabled={isLoading || !email.trim() || !dateOfBirth}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" /> {isLoading ? 'Checking...' : 'Login'}
            </button>
          </div>
        </PortalCard>
      ) : (
        <div className="mx-auto grid w-full max-w-5xl gap-4 px-3 py-4 sm:gap-5 sm:px-4 sm:py-8">
          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">OJT Portal</p>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="mt-2 flex min-w-0 items-center gap-2 text-left text-2xl font-normal text-foreground underline-offset-4 transition hover:text-primary hover:underline sm:text-3xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <UserRound className="h-6 w-6 shrink-0 text-primary" />
                  <span className="truncate">{profile.full_name}</span>
                </button>
                <p className="mt-1 text-sm text-foreground/55">{profile.school_name || 'School not provided'} | {profile.clinic_name}</p>
              </div>
              <div className="grid gap-2 sm:flex sm:gap-2">
                <button type="button" onClick={() => loadPortalData()} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                <button type="button" onClick={logout} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Metric label="Required Hours" value={String(profile.required_hours)} />
              <Metric label="Rendered Hours" value={Number(profile.rendered_hours).toFixed(2)} />
              <Metric label="Progress" value={`${progress}%`} />
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {notice && <Notice message={notice} type={noticeType} />}

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-foreground">Today</h2>
              </div>
              <p className="mt-2 text-sm text-foreground/55">
                {openLog ? `Timed in at ${formatDateTime(openLog.time_in)}.` : 'No open time log.'}
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={timeIn}
                  disabled={isSaving || Boolean(openLog)}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <LogIn className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Time In'}
                </button>
                <button
                  type="button"
                  onClick={timeOut}
                  disabled={isSaving || !openLog}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-primary bg-white px-5 text-base font-semibold text-primary shadow-sm disabled:cursor-not-allowed disabled:border-border disabled:text-foreground/50 disabled:opacity-45"
                >
                  <LogOut className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Time Out'}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="text-lg font-semibold text-foreground">Recent Time Logs</h2>
              <div className="mt-4 grid gap-3 sm:hidden">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-border bg-[#f7f4f0] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{log.log_date}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary">{Number(log.rendered_hours).toFixed(2)} hrs</span>
                    </div>
                    <p className="mt-3 text-sm text-foreground/60">Time in: {formatDateTime(log.time_in)}</p>
                    <p className="mt-1 text-sm text-foreground/60">Time out: {log.time_out ? formatDateTime(log.time_out) : 'Open'}</p>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="rounded-lg bg-[#f7f4f0] p-5 text-center text-sm text-foreground/45">No time logs yet.</p>
                )}
              </div>
              <div className="mt-4 hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground/45">
                    <tr>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Time In</th>
                      <th className="py-3 pr-4">Time Out</th>
                      <th className="py-3 pr-4">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/60">
                        <td className="py-3 pr-4">{log.log_date}</td>
                        <td className="py-3 pr-4 text-foreground/60">{formatDateTime(log.time_in)}</td>
                        <td className="py-3 pr-4 text-foreground/60">{log.time_out ? formatDateTime(log.time_out) : 'Open'}</td>
                        <td className="py-3 pr-4 text-foreground/60">{Number(log.rendered_hours).toFixed(2)}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-foreground/45">No time logs yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {isProfileOpen && (
            <StudentInfoDialog
              profile={profile}
              email={email}
              dateOfBirth={dateOfBirth}
              progress={progress}
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </div>
      )}
    </PortalShell>
  );
}

function StudentInfoDialog({
  profile,
  email,
  dateOfBirth,
  progress,
  onClose,
}: {
  profile: PortalProfile;
  email: string;
  dateOfBirth: string;
  progress: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-3 pt-8 sm:items-center sm:py-4" role="dialog" aria-modal="true" aria-labelledby="student-info-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close student information" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-lg border border-border bg-white shadow-xl sm:max-h-[86vh] sm:rounded-lg">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-white p-4 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">Student Information</p>
            <h2 id="student-info-title" className="mt-2 truncate text-2xl font-semibold text-foreground">{profile.full_name}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground/60 hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Email" value={email || 'Not provided'} />
            <Detail label="Date of birth" value={dateOfBirth || 'Not provided'} />
            <Detail label="School" value={profile.school_name || 'Not provided'} />
            <Detail label="Course" value={profile.course || 'Not provided'} />
            <Detail label="Clinic" value={profile.clinic_name} />
            <Detail label="Status" value={profile.status} />
            <Detail label="Required hours" value={String(profile.required_hours)} />
            <Detail label="Rendered hours" value={Number(profile.rendered_hours).toFixed(2)} />
          </div>

          <div className="mt-4 rounded-lg bg-[#f7f4f0] p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span className="text-foreground/60">Completion Progress</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div> 
      </div>
    </div>
  );
}

function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f4f0] text-foreground">
      <div className="border-b border-border bg-white px-4 py-4 sm:px-6">
        <p className="text-sm font-semibold text-primary">PSYZYGY Psychological Center Inc.</p>
      </div>
      {children}
    </div>
  );
}

function PortalCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-58px)] w-full max-w-md items-center px-3 py-6 sm:px-4">
      <div className="w-full rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-3xl font-normal text-foreground sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        <p className="mb-6 mt-2 text-sm text-foreground/55">Login with your registered OJT email and date of birth.</p>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} className="h-12 w-full rounded-lg border border-border bg-white px-3 text-base outline-none focus:border-primary sm:text-sm" />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7f4f0] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Notice({ message, type }: { message: string; type: NoticeType }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-700',
  };

  return <div className={`rounded-lg border p-4 text-sm font-medium ${styles[type]}`}>{message}</div>;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

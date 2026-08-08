import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, LogIn, LogOut, RefreshCw, Search, UsersRound, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import logoImage from 'figma:asset/3f22aafd57fb7e51342ec2f8e809e8c46ef58cba.png';

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
  school_name: string | null;
  course: string | null;
  date_of_birth: string | null;
  email: string | null;
  batch_name: string | null;
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

type CoordinatorLog = {
  id: string;
  log_date: string;
  time_in: string;
  time_out: string | null;
  rendered_hours: number;
  notes: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
};

type NoticeType = 'success' | 'warning' | 'error';
type StatusFilter = 'all' | CoordinatorTrainee['status'];
type PendingFilter = 'all' | 'with_pending' | 'no_pending';
type ProgressFilter = 'all' | 'not_started' | 'in_progress' | 'complete';

export function OjtCoordinatorPortal() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [profile, setProfile] = useState<CoordinatorProfile | null>(null);
  const [trainees, setTrainees] = useState<CoordinatorTrainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<CoordinatorTrainee | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<CoordinatorLog[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingFilter, setPendingFilter] = useState<PendingFilter>('all');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>('warning');
  const [isLoading, setIsLoading] = useState(false);

  const filteredTrainees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return trainees.filter((trainee) => [
      trainee.full_name,
      trainee.course ?? '',
      trainee.email ?? '',
      trainee.status,
      trainee.batch_name ?? '',
    ].join(' ').toLowerCase().includes(query) && (
      statusFilter === 'all' || trainee.status === statusFilter
    ) && (
      pendingFilter === 'all' ||
      (pendingFilter === 'with_pending' ? Number(trainee.pending_logs) > 0 : Number(trainee.pending_logs) === 0)
    ) && (
      courseFilter === 'all' || (trainee.course ?? '') === courseFilter
    ) && matchesProgressFilter(trainee, progressFilter));
  }, [courseFilter, pendingFilter, progressFilter, search, statusFilter, trainees]);

  const courseOptions = useMemo(
    () => Array.from(new Set(trainees.map((trainee) => trainee.course).filter((course): course is string => Boolean(course)))).sort(),
    [trainees],
  );

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

  const loadTraineeDetails = async (trainee: CoordinatorTrainee) => {
    if (!supabase) {
      return;
    }

    setSelectedTrainee(trainee);
    setSelectedLogs([]);
    const { data, error } = await supabase.rpc('ojt_coordinator_trainee_logs', {
      p_email: email.trim(),
      p_access_code: accessCode.trim(),
      p_trainee_id: trainee.trainee_id,
    });

    if (error) {
      notify(error.message, 'error');
      return;
    }

    setSelectedLogs((data ?? []) as CoordinatorLog[]);
  };

  const downloadVisibleStudents = () => {
    const headers = ['student_name', 'course', 'email', 'status', 'required_hours', 'rendered_hours', 'pending_hours', 'pending_logs', 'progress_percent', 'start_date', 'end_date', 'last_log'];
    const rows = filteredTrainees.map((trainee) => [
      trainee.full_name,
      trainee.course ?? '',
      trainee.email ?? '',
      trainee.status,
      String(trainee.required_hours ?? 0),
      Number(trainee.rendered_hours).toFixed(2),
      Number(trainee.pending_hours).toFixed(2),
      String(trainee.pending_logs ?? 0),
      String(getProgress(trainee)),
      trainee.start_date ?? '',
      trainee.end_date ?? '',
      trainee.last_log_at ? formatDateTime(trainee.last_log_at) : '',
    ]);
    const csv = buildCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ojt-coordinator-students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
    setSelectedTrainee(null);
    setSelectedLogs([]);
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
            <div className="grid gap-3 lg:grid-cols-[1fr_150px_170px_170px_170px_auto] lg:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Search</span>
                <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-3">
                <Search className="h-4 w-4 text-foreground/35" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </div>
              </label>
              <Select label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} options={[['all', 'All'], ['active', 'Active'], ['completed', 'Completed'], ['withdrawn', 'Withdrawn']]} />
              <Select label="Pending logs" value={pendingFilter} onChange={(value) => setPendingFilter(value as PendingFilter)} options={[['all', 'All'], ['with_pending', 'With pending'], ['no_pending', 'No pending']]} />
              <Select label="Progress" value={progressFilter} onChange={(value) => setProgressFilter(value as ProgressFilter)} options={[['all', 'All'], ['not_started', 'Not started'], ['in_progress', 'In progress'], ['complete', 'Complete']]} />
              <Select label="Course" value={courseFilter} onChange={setCourseFilter} options={[['all', 'All courses'], ...courseOptions.map((course) => [course, course] as [string, string])]} />
              <button type="button" onClick={downloadVisibleStudents} disabled={filteredTrainees.length === 0} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65 disabled:cursor-not-allowed disabled:opacity-40">
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground/60">
                <UsersRound className="h-3.5 w-3.5" /> {filteredTrainees.length} shown
              </span>
              <button type="button" onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPendingFilter('all');
                setProgressFilter('all');
                setCourseFilter('all');
              }} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/55">
                Clear filters
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:hidden">
              {filteredTrainees.map((trainee) => <TraineeCard key={trainee.trainee_id} trainee={trainee} onView={loadTraineeDetails} />)}
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-lg border border-border lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-border bg-[#f7f4f0] text-xs uppercase tracking-wide text-foreground/45">
                  <tr>
                    <th className="w-[28%] px-4 py-3">Student</th>
                    <th className="w-[14%] px-4 py-3">Status</th>
                    <th className="w-[20%] px-4 py-3">Hours</th>
                    <th className="w-[14%] px-4 py-3">Pending</th>
                    <th className="w-[14%] px-4 py-3">Last Log</th>
                    <th className="w-[10%] px-4 py-3 text-right">View</th>
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
                      <td className="px-4 py-4 text-right">
                        <button type="button" onClick={() => loadTraineeDetails(trainee)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground/65" title="View details" aria-label="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTrainees.length === 0 && (
              <p className="mt-4 rounded-lg bg-[#f7f4f0] p-5 text-center text-sm text-foreground/45">No OJT students found.</p>
            )}
          </div>
          {selectedTrainee && (
            <CoordinatorDetailsDialog
              trainee={selectedTrainee}
              schoolName={profile.school_name}
              clinicName={profile.clinic_name}
              logs={selectedLogs}
              onClose={() => {
                setSelectedTrainee(null);
                setSelectedLogs([]);
              }}
            />
          )}
        </div>
      )}
    </CoordinatorShell>
  );
}

function TraineeCard({ trainee, onView }: { trainee: CoordinatorTrainee; onView: (trainee: CoordinatorTrainee) => void }) {
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
      <button type="button" onClick={() => onView(trainee)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white text-sm font-semibold text-foreground/65">
        <Eye className="h-4 w-4" /> View Details
      </button>
    </div>
  );
}

function Progress({ trainee }: { trainee: CoordinatorTrainee }) {
  const progress = getProgress(trainee);
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

function CoordinatorDetailsDialog({
  trainee,
  schoolName,
  clinicName,
  logs,
  onClose,
}: {
  trainee: CoordinatorTrainee;
  schoolName: string;
  clinicName: string;
  logs: CoordinatorLog[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">OJT Details</p>
            <h3 className="text-xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{trainee.full_name}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60 hover:text-primary" aria-label="Close OJT details">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
            {trainee.photo_public_url ? (
              <img src={trainee.photo_public_url} alt={trainee.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-foreground/35">
                <UsersRound className="h-10 w-10" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Clinic" value={clinicName} />
            <DetailItem label="Status" value={trainee.status} />
            <DetailItem label="School" value={trainee.school_name || schoolName} />
            <DetailItem label="Course" value={trainee.course || 'Not provided'} />
            <DetailItem label="Date of birth" value={trainee.date_of_birth || 'Not provided'} />
            <DetailItem label="Email" value={trainee.email || 'Not provided'} />
            <DetailItem label="Batch" value={trainee.batch_name || 'Not provided'} />
            <DetailItem label="Required hours" value={String(trainee.required_hours)} />
            <DetailItem label="Rendered hours" value={Number(trainee.rendered_hours).toFixed(2)} />
            <DetailItem label="Pending hours" value={Number(trainee.pending_hours).toFixed(2)} />
            <DetailItem label="Start date" value={trainee.start_date || 'Not provided'} />
            <DetailItem label="End date" value={trainee.end_date || 'Not provided'} />
          </div>
        </div>
        <div className="border-t border-border p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Recent time logs</h4>
              <p className="text-xs text-foreground/50">Approved logs count toward rendered hours.</p>
            </div>
            <span className="text-xs font-semibold text-primary">{logs.filter((log) => log.approval_status === 'pending' && log.time_out).length} pending review</span>
          </div>
          <div className="mt-3 grid gap-3 md:hidden">
            {logs.slice(0, 12).map((log) => (
              <div key={log.id} className="rounded-lg border border-border bg-[#f7f4f0] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{log.log_date}</p>
                  <StatusBadge status={log.approval_status} />
                </div>
                <p className="mt-3 text-sm text-foreground/60">Time in: {formatDateTime(log.time_in)}</p>
                <p className="mt-1 text-sm text-foreground/60">Time out: {log.time_out ? formatDateTime(log.time_out) : 'Open'}</p>
                <p className="mt-1 text-sm text-foreground/60">Hours: {Number(log.rendered_hours).toFixed(2)}</p>
                {log.notes && <p className="mt-2 text-sm text-foreground/60">{log.notes}</p>}
              </div>
            ))}
          </div>
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground/45">
                <tr>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Time in</th>
                  <th className="py-3 pr-4">Time out</th>
                  <th className="py-3 pr-4">Hours</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 12).map((log) => (
                  <tr key={log.id} className="border-b border-border/60">
                    <td className="py-3 pr-4">{log.log_date}</td>
                    <td className="py-3 pr-4 text-foreground/60">{formatDateTime(log.time_in)}</td>
                    <td className="py-3 pr-4 text-foreground/60">{log.time_out ? formatDateTime(log.time_out) : 'Open'}</td>
                    <td className="py-3 pr-4 text-foreground/60">{Number(log.rendered_hours).toFixed(2)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={log.approval_status} /></td>
                    <td className="max-w-[220px] py-3 pr-4 text-foreground/60">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <p className="mt-3 rounded-lg bg-[#f7f4f0] p-5 text-center text-sm text-foreground/45">No time logs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7f4f0] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm">
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>{labelText}</option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: CoordinatorLog['approval_status'] }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}>{status}</span>;
}

function CoordinatorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f4f0] text-foreground">
      <div className="border-b border-border bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <img src={logoImage} alt="PSYZYGY Logo" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-semibold leading-none text-primary">PSYZYGY</p>
            <p className="mt-1 text-xs text-foreground/50">Psychological Center Inc.</p>
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}

function PortalCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-74px)] w-full max-w-6xl items-center gap-6 px-4 py-8 lg:grid-cols-[1fr_430px] lg:px-8">
      <div className="hidden lg:block">
        <div className="max-w-xl">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
            <img src={logoImage} alt="" className="h-14 w-14 object-contain" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">OJT Coordinator Portal</p>
          <h1 className="mt-4 text-5xl font-normal leading-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Monitor student progress online.
          </h1>
          <p className="mt-5 text-base font-light leading-relaxed text-foreground/60">
            School coordinators can check linked students, rendered hours, pending logs, and progress from one organized dashboard.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            <LoginFeature title="Students" text="View linked trainees." />
            <LoginFeature title="Filters" text="Find records quickly." />
            <LoginFeature title="Reports" text="Download lists." />
          </div>
        </div>
      </div>
      <div className="w-full rounded-2xl border border-border bg-white p-6 shadow-[0_24px_70px_rgba(30,42,53,0.12)] sm:p-8">
        <div className="mb-7 flex items-center gap-3 lg:hidden">
          <img src={logoImage} alt="PSYZYGY Logo" className="h-12 w-12 object-contain" />
          <div>
            <p className="text-sm font-semibold text-primary">PSYZYGY</p>
            <p className="text-xs text-foreground/50">Psychological Center Inc.</p>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">Coordinator Access</p>
        <h1 className="mt-3 text-3xl font-normal text-foreground sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        <p className="mb-6 mt-2 text-sm leading-relaxed text-foreground/55">Login with your registered coordinator email and access code.</p>
        {children}
      </div>
    </div>
  );
}

function LoginFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-white/75 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-foreground/55">{text}</p>
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

function getProgress(trainee: CoordinatorTrainee) {
  return trainee.required_hours ? Math.min(100, Math.round((Number(trainee.rendered_hours) / trainee.required_hours) * 100)) : 0;
}

function matchesProgressFilter(trainee: CoordinatorTrainee, filter: ProgressFilter) {
  const progress = getProgress(trainee);
  if (filter === 'all') return true;
  if (filter === 'not_started') return progress === 0;
  if (filter === 'in_progress') return progress > 0 && progress < 100;
  return progress >= 100;
}

function escapeCsvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildCsv(headers: string[], rows: string[][]) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');
}

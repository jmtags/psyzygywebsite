import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Award,
  Building2,
  Camera,
  CheckCircle2,
  Download,
  ImagePlus,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  School,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { generateOjtCertificatePdf } from '../lib/certificatePdf';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type AdminRole = 'super_admin' | 'clinic_admin' | 'staff';
type TabKey = 'overview' | 'events' | 'ojt' | 'certificates' | 'clinics' | 'users';
type OjtStatus = 'active' | 'completed' | 'withdrawn';

type Clinic = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

type Profile = {
  id: string;
  full_name: string;
  role: AdminRole;
  clinic_id: string | null;
  is_active: boolean;
};

type Trainee = {
  id: string;
  fullName: string;
  schoolName: string;
  course: string;
  clinicId: string;
  totalHours: number;
  startDate: string;
  endDate: string;
  status: OjtStatus;
  batchName: string;
};

const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon; superOnly?: boolean }> = [
  { key: 'overview', label: 'Overview', icon: Award },
  { key: 'events', label: 'Events', icon: Camera },
  { key: 'ojt', label: 'OJT', icon: School },
  { key: 'certificates', label: 'Certificates', icon: Download },
  { key: 'clinics', label: 'Clinics', icon: Building2, superOnly: true },
  { key: 'users', label: 'Users', icon: UserCog, superOnly: true },
];

const emptyClinic = { id: '', name: '', slug: '', address: '', phone: '', email: '' };
const emptyProfile: Profile = { id: '', full_name: '', role: 'clinic_admin', clinic_id: '', is_active: true };

export function AdminApp() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [clinicForm, setClinicForm] = useState(emptyClinic);
  const [profileForm, setProfileForm] = useState<Profile>(emptyProfile);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [newTrainee, setNewTrainee] = useState({
    fullName: '',
    schoolName: '',
    course: '',
    totalHours: '300',
    startDate: '',
    endDate: '',
    batchName: '',
  });

  const isSuperAdmin = profile?.role === 'super_admin';
  const activeClinicId = isSuperAdmin ? selectedClinicId : profile?.clinic_id ?? '';
  const accessibleClinics = isSuperAdmin ? clinics : clinics.filter((clinic) => clinic.id === profile?.clinic_id);
  const visibleTrainees = useMemo(
    () => trainees.filter((trainee) => isSuperAdmin || trainee.clinicId === profile?.clinic_id),
    [isSuperAdmin, profile?.clinic_id, trainees],
  );
  const completedTrainees = visibleTrainees.filter((trainee) => trainee.status === 'completed');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user);
      if (data.user) {
        void loadAdminData(data.user);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        void loadAdminData(session.user);
      } else {
        setProfile(null);
        setProfiles([]);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadAdminData = async (user = authUser) => {
    if (!supabase || !user) {
      return;
    }

    setLoading(true);
    setNotice('');

    const { data: ownProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, clinic_id, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !ownProfile) {
      setProfile(null);
      setLoading(false);
      setNotice('Login worked, but no active admin profile was found for this Auth user.');
      return;
    }

    const normalizedProfile = ownProfile as Profile;
    setProfile(normalizedProfile);

    const { data: clinicRows, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name, slug, address, phone, email')
      .order('name');

    if (clinicsError) {
      setNotice(clinicsError.message);
    }

    const nextClinics = (clinicRows ?? []) as Clinic[];
    setClinics(nextClinics);
    setSelectedClinicId((current) => current || normalizedProfile.clinic_id || nextClinics[0]?.id || '');

    if (normalizedProfile.role === 'super_admin') {
      const { data: profileRows, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, clinic_id, is_active')
        .order('full_name');

      if (profilesError) {
        setNotice(profilesError.message);
      }

      setProfiles((profileRows ?? []) as Profile[]);
    }

    setLoading(false);
  };

  const login = async () => {
    if (!supabase) {
      setNotice('Supabase is not configured.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      setNotice(error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase?.auth.signOut();
    setAuthUser(null);
    setProfile(null);
  };

  const saveClinic = async () => {
    if (!supabase || !isSuperAdmin) {
      return;
    }

    const payload = {
      name: clinicForm.name.trim(),
      slug: clinicForm.slug.trim().toLowerCase(),
      address: clinicForm.address || null,
      phone: clinicForm.phone || null,
      email: clinicForm.email || null,
    };

    const response = editingClinicId
      ? await supabase.from('clinics').update(payload).eq('id', editingClinicId)
      : await supabase.from('clinics').insert(payload);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setClinicForm(emptyClinic);
    setEditingClinicId(null);
    await loadAdminData();
  };

  const deleteClinic = async (clinicId: string) => {
    if (!supabase || !isSuperAdmin || !window.confirm('Delete this clinic branch?')) {
      return;
    }

    const { error } = await supabase.from('clinics').delete().eq('id', clinicId);
    if (error) {
      setNotice(error.message);
      return;
    }

    await loadAdminData();
  };

  const saveProfile = async () => {
    if (!supabase || !isSuperAdmin) {
      return;
    }

    const payload = {
      id: profileForm.id.trim(),
      full_name: profileForm.full_name.trim(),
      role: profileForm.role,
      clinic_id: profileForm.role === 'super_admin' ? null : profileForm.clinic_id || null,
      is_active: profileForm.is_active,
    };

    const response = editingProfileId
      ? await supabase.from('user_profiles').update(payload).eq('id', editingProfileId)
      : await supabase.from('user_profiles').insert(payload);

    if (response.error) {
      setNotice(response.error.message);
      return;
    }

    setProfileForm(emptyProfile);
    setEditingProfileId(null);
    await loadAdminData();
  };

  const deleteProfile = async (profileId: string) => {
    if (!supabase || !isSuperAdmin || !window.confirm('Delete this user profile? This does not delete the Supabase Auth user.')) {
      return;
    }

    const { error } = await supabase.from('user_profiles').delete().eq('id', profileId);
    if (error) {
      setNotice(error.message);
      return;
    }

    await loadAdminData();
  };

  const addTrainee = () => {
    if (!newTrainee.fullName.trim() || !activeClinicId) {
      return;
    }

    setTrainees((current) => [
      {
        id: `ojt-${Date.now()}`,
        fullName: newTrainee.fullName.trim(),
        schoolName: newTrainee.schoolName.trim(),
        course: newTrainee.course.trim(),
        clinicId: activeClinicId,
        totalHours: Number(newTrainee.totalHours) || 0,
        startDate: newTrainee.startDate,
        endDate: newTrainee.endDate,
        status: 'active',
        batchName: newTrainee.batchName.trim(),
      },
      ...current,
    ]);
    setNewTrainee({ fullName: '', schoolName: '', course: '', totalHours: '300', startDate: '', endDate: '', batchName: '' });
  };

  const markCompleted = (id: string) => {
    setTrainees((current) => current.map((trainee) => (
      trainee.id === id ? { ...trainee, status: 'completed' } : trainee
    )));
  };

  const generateCertificates = (selected = completedTrainees) => {
    const certificateData = selected.map((trainee) => ({
      fullName: trainee.fullName,
      schoolName: trainee.schoolName,
      clinicName: `${clinics.find((clinic) => clinic.id === trainee.clinicId)?.name ?? 'PSYZYGY'} Branch`,
      totalHours: trainee.totalHours,
      startDate: trainee.startDate || 'Start date',
      endDate: trainee.endDate || 'Completion date',
    }));

    void generateOjtCertificatePdf(certificateData, selected.length > 1 ? 'PSYZYGY OJT Batch' : selected[0]?.fullName);
  };

  if (!isSupabaseConfigured) {
    return (
      <AdminShell>
        <CenteredCard title="Supabase Not Configured">
          <p className="text-sm text-foreground/60">
            Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` locally and to Vercel environment variables.
          </p>
        </CenteredCard>
      </AdminShell>
    );
  }

  if (!authUser || !profile) {
    return (
      <AdminShell>
        <CenteredCard title="Admin Login">
          <div className="space-y-4">
            <Input label="Email" value={loginEmail} onChange={setLoginEmail} type="email" />
            <Input label="Password" value={loginPassword} onChange={setLoginPassword} type="password" />
            {notice && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
            <button
              type="button"
              onClick={login}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Lock className="h-4 w-4" /> {loading ? 'Checking...' : 'Sign in'}
            </button>
          </div>
        </CenteredCard>
      </AdminShell>
    );
  }

  const allowedTabs = tabs.filter((tab) => !tab.superOnly || isSuperAdmin);

  return (
    <div className="min-h-screen bg-[#f7f4f0] text-foreground">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/60">Admin</p>
            <h1 className="mt-2 text-3xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              PSYZYGY Management
            </h1>
            <p className="mt-1 text-sm text-foreground/55">
              Signed in as {profile.full_name} ({profile.role.replace('_', ' ')})
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={activeClinicId}
              onChange={(event) => setSelectedClinicId(event.target.value)}
              disabled={!isSuperAdmin}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm disabled:opacity-60"
            >
              {accessibleClinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => loadAdminData()} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-foreground/70">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" onClick={logout} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-border bg-white p-2">
          {allowedTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-primary text-white' : 'text-foreground/65 hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.7} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <section className="space-y-6">
          {notice && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{notice}</p>}

          {activeTab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Accessible Clinics" value={String(accessibleClinics.length)} />
              <Metric label="OJT Trainees" value={String(visibleTrainees.length)} />
              <Metric label="Completed OJT" value={String(completedTrainees.length)} />
            </div>
          )}

          {activeTab === 'events' && (
            <Panel title="Event Photo Upload" subtitle="Create event albums and upload photos by clinic.">
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Event title" placeholder="Mental Health Seminar" />
                <Field label="Event date" type="date" />
                <label className="lg:col-span-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                  <ImagePlus className="mb-3 h-8 w-8 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-foreground">Upload event photos</span>
                  <span className="mt-1 text-xs text-foreground/55">Storage upload wiring is next; bucket and policies are ready.</span>
                  <input type="file" accept="image/*" multiple className="sr-only" />
                </label>
              </div>
            </Panel>
          )}

          {activeTab === 'ojt' && (
            <Panel title="OJT Management" subtitle="Clinic users only see and manage OJT records for their clinic.">
              <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Input value={newTrainee.fullName} onChange={(value) => setNewTrainee({ ...newTrainee, fullName: value })} label="Full name" />
                <Input value={newTrainee.schoolName} onChange={(value) => setNewTrainee({ ...newTrainee, schoolName: value })} label="School" />
                <Input value={newTrainee.course} onChange={(value) => setNewTrainee({ ...newTrainee, course: value })} label="Course" />
                <Input value={newTrainee.batchName} onChange={(value) => setNewTrainee({ ...newTrainee, batchName: value })} label="Batch" />
                <Input value={newTrainee.totalHours} onChange={(value) => setNewTrainee({ ...newTrainee, totalHours: value })} label="Hours" type="number" />
                <Input value={newTrainee.startDate} onChange={(value) => setNewTrainee({ ...newTrainee, startDate: value })} label="Start date" type="date" />
                <Input value={newTrainee.endDate} onChange={(value) => setNewTrainee({ ...newTrainee, endDate: value })} label="End date" type="date" />
                <button type="button" onClick={addTrainee} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" /> Add OJT
                </button>
              </div>
              <TraineeTable trainees={visibleTrainees} clinics={clinics} onComplete={markCompleted} onCertificate={(trainee) => generateCertificates([trainee])} />
            </Panel>
          )}

          {activeTab === 'certificates' && (
            <Panel title="Certificate Generation" subtitle="Generate one certificate or a batch PDF for completed OJT trainees.">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-foreground/60">{completedTrainees.length} completed trainee(s) available for certificate generation.</p>
                <button type="button" onClick={() => generateCertificates()} disabled={completedTrainees.length === 0} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <Download className="h-4 w-4" /> Generate Batch PDF
                </button>
              </div>
            </Panel>
          )}

          {activeTab === 'clinics' && isSuperAdmin && (
            <ClinicCrud clinics={clinics} form={clinicForm} setForm={setClinicForm} editingId={editingClinicId} setEditingId={setEditingClinicId} onSave={saveClinic} onDelete={deleteClinic} />
          )}

          {activeTab === 'users' && isSuperAdmin && (
            <UserCrud profiles={profiles} clinics={clinics} form={profileForm} setForm={setProfileForm} editingId={editingProfileId} setEditingId={setEditingProfileId} onSave={saveProfile} onDelete={deleteProfile} />
          )}
        </section>
      </main>
    </div>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#f7f4f0] p-6 text-foreground">{children}</div>;
}

function CenteredCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-lg">
      <h1 className="mb-5 text-3xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <p className="text-3xl font-semibold text-primary" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="mt-2 text-sm font-medium text-foreground/60">{label}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
        <p className="mt-1 text-sm text-foreground/55">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">{label}</span>
      <input type={type} placeholder={placeholder} className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
    </label>
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

function ClinicCrud({
  clinics,
  form,
  setForm,
  editingId,
  setEditingId,
  onSave,
  onDelete,
}: {
  clinics: Clinic[];
  form: typeof emptyClinic;
  setForm: (form: typeof emptyClinic) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Panel title="Clinic Branch CRUD" subtitle="Super admins can create, update, and delete clinic branches.">
      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Input label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
        <Input label="Phone" value={form.phone ?? ''} onChange={(value) => setForm({ ...form, phone: value })} />
        <Input label="Email" value={form.email ?? ''} onChange={(value) => setForm({ ...form, email: value })} />
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Address</span>
          <textarea value={form.address ?? ''} onChange={(event) => setForm({ ...form, address: event.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
        <div className="flex items-end gap-2">
          <button type="button" onClick={onSave} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white">
            <Save className="h-4 w-4" /> {editingId ? 'Save Changes' : 'Create Clinic'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyClinic); }} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {clinics.map((clinic) => (
          <div key={clinic.id} className="rounded-lg border border-border bg-[#f7f4f0] p-4">
            <p className="font-semibold text-foreground">{clinic.name}</p>
            <p className="text-xs text-foreground/45">{clinic.slug}</p>
            <p className="mt-3 text-sm text-foreground/60">{clinic.address}</p>
            <p className="mt-2 text-xs text-foreground/50">{clinic.phone}</p>
            <p className="text-xs text-foreground/50">{clinic.email}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => { setEditingId(clinic.id); setForm({ ...clinic, address: clinic.address ?? '', phone: clinic.phone ?? '', email: clinic.email ?? '' }); }} className="flex h-9 items-center gap-1 rounded-lg border border-border bg-white px-3 text-xs font-semibold">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button type="button" onClick={() => onDelete(clinic.id)} className="flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function UserCrud({
  profiles,
  clinics,
  form,
  setForm,
  editingId,
  setEditingId,
  onSave,
  onDelete,
}: {
  profiles: Profile[];
  clinics: Clinic[];
  form: Profile;
  setForm: (form: Profile) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Panel title="User Profile CRUD" subtitle="Create the Supabase Auth user first, then paste the Auth user ID here to assign admin access.">
      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input label="Auth User ID" value={form.id} onChange={(value) => setForm({ ...form, id: value })} />
        <Input label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Role</span>
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })} className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm">
            <option value="super_admin">Super Admin</option>
            <option value="clinic_admin">Clinic Admin</option>
            <option value="staff">Staff</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Clinic</span>
          <select value={form.clinic_id ?? ''} onChange={(event) => setForm({ ...form, clinic_id: event.target.value })} disabled={form.role === 'super_admin'} className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm disabled:opacity-50">
            <option value="">No clinic</option>
            {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
          </select>
        </label>
        <label className="flex h-11 items-center gap-2">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
          <span className="text-sm font-medium text-foreground/65">Active</span>
        </label>
        <div className="flex items-end gap-2 xl:col-span-3">
          <button type="button" onClick={onSave} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white">
            <Save className="h-4 w-4" /> {editingId ? 'Save User Profile' : 'Create User Profile'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyProfile); }} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground/45">
            <tr>
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Role</th>
              <th className="py-3 pr-4">Clinic</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Auth ID</th>
              <th className="py-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((userProfile) => (
              <tr key={userProfile.id} className="border-b border-border/60">
                <td className="py-4 pr-4 font-medium">{userProfile.full_name}</td>
                <td className="py-4 pr-4 text-foreground/60">{userProfile.role}</td>
                <td className="py-4 pr-4 text-foreground/60">{clinics.find((clinic) => clinic.id === userProfile.clinic_id)?.name ?? 'All clinics'}</td>
                <td className="py-4 pr-4">{userProfile.is_active ? 'Active' : 'Inactive'}</td>
                <td className="py-4 pr-4 text-xs text-foreground/45">{userProfile.id}</td>
                <td className="py-4 pr-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingId(userProfile.id); setForm(userProfile); }} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => onDelete(userProfile.id)} className="flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function TraineeTable({
  trainees,
  clinics,
  onComplete,
  onCertificate,
}: {
  trainees: Trainee[];
  clinics: Clinic[];
  onComplete: (id: string) => void;
  onCertificate: (trainee: Trainee) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground/45">
          <tr>
            <th className="py-3 pr-4">Name</th>
            <th className="py-3 pr-4">Clinic</th>
            <th className="py-3 pr-4">School</th>
            <th className="py-3 pr-4">Hours</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trainees.map((trainee) => (
            <tr key={trainee.id} className="border-b border-border/60">
              <td className="py-4 pr-4 font-medium text-foreground">{trainee.fullName}</td>
              <td className="py-4 pr-4 text-foreground/60">{clinics.find((clinic) => clinic.id === trainee.clinicId)?.name ?? 'Clinic'}</td>
              <td className="py-4 pr-4 text-foreground/60">{trainee.schoolName}</td>
              <td className="py-4 pr-4 text-foreground/60">{trainee.totalHours}</td>
              <td className="py-4 pr-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trainee.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {trainee.status}
                </span>
              </td>
              <td className="py-4 pr-4">
                <div className="flex gap-2">
                  {trainee.status !== 'completed' && (
                    <button type="button" onClick={() => onComplete(trainee.id)} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-foreground/65">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                    </button>
                  )}
                  <button type="button" onClick={() => onCertificate(trainee)} className="flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Award,
  Camera,
  CheckCircle2,
  Download,
  ImagePlus,
  Lock,
  Plus,
  School,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { generateOjtCertificatePdf } from '../lib/certificatePdf';
import { isSupabaseConfigured } from '../lib/supabaseClient';

type ClinicSlug = 'mabalacat' | 'tarlac' | 'calapan';
type AdminRole = 'super_admin' | 'clinic_admin';
type TabKey = 'overview' | 'events' | 'ojt' | 'certificates' | 'users';
type Trainee = {
  id: string;
  fullName: string;
  schoolName: string;
  course: string;
  clinic: ClinicSlug;
  totalHours: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'withdrawn';
  batchName: string;
};

const clinics: Array<{ slug: ClinicSlug; name: string; email: string; phone: string }> = [
  { slug: 'mabalacat', name: 'Mabalacat', email: 'psyzygymabalacat@psyzygyclinic.com', phone: '0931 203 7963' },
  { slug: 'tarlac', name: 'Tarlac', email: 'psyzygytarlac@psyzygyclinic.com', phone: '0931 203 7962' },
  { slug: 'calapan', name: 'Calapan', email: 'psyzygycalapan@psyzygyclinic.com', phone: '0949 869 2264' },
];

const initialTrainees: Trainee[] = [
  {
    id: 'ojt-001',
    fullName: 'Sample OJT Trainee',
    schoolName: 'Partner School',
    course: 'BS Psychology',
    clinic: 'tarlac' as ClinicSlug,
    totalHours: 300,
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    status: 'completed',
    batchName: 'Batch 2026-A',
  },
  {
    id: 'ojt-002',
    fullName: 'Maria Santos',
    schoolName: 'Partner University',
    course: 'AB Psychology',
    clinic: 'mabalacat' as ClinicSlug,
    totalHours: 120,
    startDate: '2026-05-01',
    endDate: '2026-07-30',
    status: 'active',
    batchName: 'Batch 2026-B',
  },
];

const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: 'overview', label: 'Overview', icon: Award },
  { key: 'events', label: 'Events', icon: Camera },
  { key: 'ojt', label: 'OJT', icon: School },
  { key: 'certificates', label: 'Certificates', icon: Download },
  { key: 'users', label: 'Users', icon: UserCog },
];

export function AdminApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [role, setRole] = useState<AdminRole>('super_admin');
  const [selectedClinic, setSelectedClinic] = useState<ClinicSlug>('tarlac');
  const [trainees, setTrainees] = useState(initialTrainees);
  const [newTrainee, setNewTrainee] = useState({
    fullName: '',
    schoolName: '',
    course: '',
    totalHours: '300',
    startDate: '',
    endDate: '',
    batchName: '',
  });

  const accessibleClinics = role === 'super_admin'
    ? clinics
    : clinics.filter((clinic) => clinic.slug === selectedClinic);

  const visibleTrainees = useMemo(
    () => trainees.filter((trainee) => role === 'super_admin' || trainee.clinic === selectedClinic),
    [role, selectedClinic, trainees],
  );

  const completedTrainees = visibleTrainees.filter((trainee) => trainee.status === 'completed');

  const addTrainee = () => {
    if (!newTrainee.fullName.trim()) {
      return;
    }

    setTrainees((current) => [
      {
        id: `ojt-${Date.now()}`,
        fullName: newTrainee.fullName.trim(),
        schoolName: newTrainee.schoolName.trim(),
        course: newTrainee.course.trim(),
        clinic: selectedClinic,
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
      clinicName: `${clinics.find((clinic) => clinic.slug === trainee.clinic)?.name ?? 'PSYZYGY'} Branch`,
      totalHours: trainee.totalHours,
      startDate: trainee.startDate || 'Start date',
      endDate: trainee.endDate || 'Completion date',
    }));

    generateOjtCertificatePdf(certificateData, selected.length > 1 ? 'PSYZYGY OJT Batch' : selected[0]?.fullName);
  };

  return (
    <div className="min-h-screen bg-[#f7f4f0] text-foreground">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/60">Admin</p>
            <h1 className="mt-2 text-3xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              PSYZYGY Management
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as AdminRole)}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
            >
              <option value="super_admin">Super Admin</option>
              <option value="clinic_admin">Clinic User</option>
            </select>
            <select
              value={selectedClinic}
              onChange={(event) => setSelectedClinic(event.target.value as ClinicSlug)}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
            >
              {clinics.map((clinic) => (
                <option key={clinic.slug} value={clinic.slug}>{clinic.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-border bg-white p-2">
          {tabs.map((tab) => {
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
          {!isSupabaseConfigured && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Lock className="h-4 w-4" />
                Supabase environment not connected yet
              </div>
              Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel to connect this dashboard to the database.
            </div>
          )}

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
                  <span className="mt-1 text-xs text-foreground/55">Stores files in the Supabase `event-photos` bucket once connected.</span>
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
              <TraineeTable trainees={visibleTrainees} onComplete={markCompleted} onCertificate={(trainee) => generateCertificates([trainee])} />
            </Panel>
          )}

          {activeTab === 'certificates' && (
            <Panel title="Certificate Generation" subtitle="Generate one certificate or a batch PDF for completed OJT trainees.">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-foreground/60">{completedTrainees.length} completed trainee(s) available for certificate generation.</p>
                <button
                  type="button"
                  onClick={() => generateCertificates()}
                  disabled={completedTrainees.length === 0}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" /> Generate Batch PDF
                </button>
              </div>
            </Panel>
          )}

          {activeTab === 'users' && (
            <Panel title="User Access" subtitle="Super admins create users and assign clinic access.">
              <div className="grid gap-4 md:grid-cols-3">
                {clinics.map((clinic) => (
                  <div key={clinic.slug} className="rounded-lg border border-border bg-[#f7f4f0] p-4">
                    <p className="font-semibold text-foreground">{clinic.name}</p>
                    <p className="mt-1 text-xs text-foreground/55">{clinic.email}</p>
                    <p className="mt-4 text-xs text-foreground/45">Clinic users can manage only this clinic's OJT records and event albums.</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </section>
      </main>
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

function TraineeTable({
  trainees,
  onComplete,
  onCertificate,
}: {
  trainees: Trainee[];
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
              <td className="py-4 pr-4 text-foreground/60">{trainee.clinic}</td>
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

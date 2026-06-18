import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Award,
  ChartNoAxesColumn,
  Building2,
  Camera,
  CheckCircle2,
  Download,
  Eye,
  ImagePlus,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  School,
  Trash2,
  Upload,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { generateOjtCertificatePdf } from '../lib/certificatePdf';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type AdminRole = 'super_admin' | 'clinic_admin' | 'staff';
type TabKey = 'overview' | 'analytics' | 'events' | 'ojt' | 'certificates' | 'clinics' | 'users';
type OjtStatus = 'active' | 'completed' | 'withdrawn';
type AdminNoticeType = 'success' | 'warning' | 'error';

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
  dateOfBirth: string;
  email: string;
  clinicId: string;
  totalHours: number;
  startDate: string;
  endDate: string;
  status: OjtStatus;
  batchName: string;
  photoUrl: string | null;
  photoStoragePath: string | null;
};

type TraineeRow = {
  id: string;
  clinic_id: string;
  full_name: string;
  school_name: string | null;
  course: string | null;
  date_of_birth: string | null;
  email: string | null;
  total_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  status: OjtStatus;
  notes: string | null;
  photo_public_url: string | null;
  photo_storage_path: string | null;
};

type OjtTimeLog = {
  id: string;
  trainee_id: string;
  clinic_id: string;
  log_date: string;
  time_in: string;
  time_out: string | null;
  rendered_hours: number;
};

type OjtImportRow = {
  rowNumber: number;
  photoFileName: string;
  payload: {
    clinic_id: string;
    full_name: string;
    school_name: string | null;
    course: string | null;
    date_of_birth: string | null;
    email: string | null;
    total_hours: number;
    start_date: string | null;
    end_date: string | null;
    status: OjtStatus;
    notes: string | null;
    created_by: string | undefined;
  };
};

type OjtDuplicateReview = {
  row: OjtImportRow;
  existing: Trainee;
};

type EventPhoto = {
  id: string;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  sort_order: number;
};

type EventAlbum = {
  id: string;
  clinic_id: string | null;
  title: string;
  event_date: string | null;
  description: string | null;
  is_public: boolean;
  event_photos?: EventPhoto[];
};

type PageVisit = {
  id: string;
  path: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  visited_at: string;
};

const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon; superOnly?: boolean }> = [
  { key: 'overview', label: 'Overview', icon: Award },
  { key: 'analytics', label: 'Analytics', icon: ChartNoAxesColumn, superOnly: true },
  { key: 'events', label: 'Events', icon: Camera, superOnly: true },
  { key: 'ojt', label: 'OJT', icon: School },
  { key: 'certificates', label: 'Certificates', icon: Download },
  { key: 'clinics', label: 'Clinics', icon: Building2, superOnly: true },
  { key: 'users', label: 'Users', icon: UserCog, superOnly: true },
];

const emptyClinic = { id: '', name: '', slug: '', address: '', phone: '', email: '' };
const emptyProfile: Profile = { id: '', full_name: '', role: 'clinic_admin', clinic_id: '', is_active: true };
const ojtTemplateHeaders = ['full_name', 'school_name', 'course', 'date_of_birth', 'email', 'batch_name', 'total_hours', 'start_date', 'end_date', 'photo_file'];
const ojtTemplateRows = [
  ['Juan Dela Cruz', 'University of Example', 'BS Psychology', '2003-01-15', 'juan@example.com', 'Batch 2026-A', '300', '2026-06-01', '2026-08-30', ''],
  ['Maria Santos', 'Example State College', 'AB Psychology', '2003-05-20', 'maria@example.com', 'Batch 2026-A', '300', '2026-06-01', '2026-08-30', ''],
];

function mapTraineeRow(row: TraineeRow): Trainee {
  return {
    id: row.id,
    fullName: row.full_name,
    schoolName: row.school_name ?? '',
    course: row.course ?? '',
    dateOfBirth: row.date_of_birth ?? '',
    email: row.email ?? '',
    clinicId: row.clinic_id,
    totalHours: row.total_hours ?? 0,
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    status: row.status,
    batchName: row.notes ?? '',
    photoUrl: row.photo_public_url,
    photoStoragePath: row.photo_storage_path,
  };
}

function escapeCsvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildCsv(headers: string[], rows: string[][]) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(current.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

function formatCsvDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function normalizeCsvDate(value: string) {
  let normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("'")) {
    normalized = normalized.slice(1).trim();
  }

  const formulaText = normalized.match(/^=\s*"?([^"]+)"?$/);
  if (formulaText) {
    normalized = formulaText[1].trim();
  }

  const isoDate = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDate) {
    return formatCsvDateParts(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
  }

  const slashDate = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (slashDate) {
    const year = Number(slashDate[3].length === 2 ? `20${slashDate[3]}` : slashDate[3]);
    return formatCsvDateParts(year, Number(slashDate[1]), Number(slashDate[2]));
  }

  const excelSerial = Number(normalized);
  if (Number.isFinite(excelSerial) && excelSerial >= 1 && excelSerial <= 60000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + Math.floor(excelSerial) * 86400000);
    return date.toISOString().slice(0, 10);
  }

  return undefined;
}

function normalizeFileName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeRecordKey(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isValidEmail(value: string) {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function getFunctionErrorMessage(error: unknown) {
  if (!error) {
    return '';
  }

  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const payload = await context.clone().json() as { error?: string };
      if (payload.error) {
        return payload.error;
      }
    } catch {
      // Fall back to the Supabase error message below.
    }
  }

  return (error as { message?: string }).message ?? 'Unable to complete request.';
}

export function AdminApp() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [eventAlbums, setEventAlbums] = useState<EventAlbum[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [analyticsUpdatedAt, setAnalyticsUpdatedAt] = useState<Date | null>(null);
  const [isAnalyticsRefreshing, setIsAnalyticsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<AdminNoticeType>('warning');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [clinicForm, setClinicForm] = useState(emptyClinic);
  const [profileForm, setProfileForm] = useState<Profile>(emptyProfile);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventAlbum, setSelectedEventAlbum] = useState<EventAlbum | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', eventDate: '', description: '', isPublic: true });
  const [eventFiles, setEventFiles] = useState<File[]>([]);

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [ojtTimeLogs, setOjtTimeLogs] = useState<OjtTimeLog[]>([]);
  const [traineePhotoFile, setTraineePhotoFile] = useState<File | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [editingTraineePhotoFile, setEditingTraineePhotoFile] = useState<File | null>(null);
  const [isAddTraineeOpen, setIsAddTraineeOpen] = useState(false);
  const [isSavingTrainee, setIsSavingTrainee] = useState(false);
  const [isSavingEditedTrainee, setIsSavingEditedTrainee] = useState(false);
  const [deletingTraineeId, setDeletingTraineeId] = useState<string | null>(null);
  const [isImportingOjt, setIsImportingOjt] = useState(false);
  const [ojtSearch, setOjtSearch] = useState('');
  const [ojtStatusFilter, setOjtStatusFilter] = useState<'all' | OjtStatus>('all');
  const [ojtBatchFile, setOjtBatchFile] = useState<File | null>(null);
  const [ojtBatchPhotoFiles, setOjtBatchPhotoFiles] = useState<File[]>([]);
  const [pendingOjtImport, setPendingOjtImport] = useState<{
    rows: OjtImportRow[];
    missingPhotoFiles: string[];
    duplicates: OjtDuplicateReview[];
  } | null>(null);
  const [selectedDuplicateRows, setSelectedDuplicateRows] = useState<number[]>([]);
  const [newTrainee, setNewTrainee] = useState({
    fullName: '',
    schoolName: '',
    course: '',
    dateOfBirth: '',
    email: '',
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
  const filteredTrainees = useMemo(() => {
    const query = normalizeRecordKey(ojtSearch);
    return visibleTrainees.filter((trainee) => {
      const matchesStatus = ojtStatusFilter === 'all' || trainee.status === ojtStatusFilter;
      const matchesSearch = !query || normalizeRecordKey([
        trainee.fullName,
        trainee.schoolName,
        trainee.course,
        trainee.dateOfBirth,
        trainee.email,
        trainee.batchName,
        clinics.find((clinic) => clinic.id === trainee.clinicId)?.name ?? '',
      ].join(' ')).includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [clinics, ojtSearch, ojtStatusFilter, visibleTrainees]);
  const loggedHoursByTrainee = useMemo(() => {
    const totals = new Map<string, number>();
    ojtTimeLogs.forEach((log) => {
      totals.set(log.trainee_id, (totals.get(log.trainee_id) ?? 0) + Number(log.rendered_hours || 0));
    });
    return totals;
  }, [ojtTimeLogs]);
  const completedTrainees = visibleTrainees.filter((trainee) => trainee.status === 'completed');

  const notify = (message: string, type: AdminNoticeType = 'warning') => {
    setNoticeType(type);
    setNotice(message);
  };

  const clearNotice = () => {
    setNotice('');
  };

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

    const { data: albumRows, error: albumsError } = await supabase
      .from('event_albums')
      .select('id, clinic_id, title, event_date, description, is_public, event_photos(id, storage_path, public_url, caption, sort_order)')
      .order('event_date', { ascending: false });

    if (albumsError) {
      setNotice(albumsError.message);
    }

    setEventAlbums((albumRows ?? []) as EventAlbum[]);

    const { data: traineeRows, error: traineesError } = await supabase
      .from('ojt_trainees')
      .select('id, clinic_id, full_name, school_name, course, date_of_birth, email, total_hours, start_date, end_date, status, notes, photo_public_url, photo_storage_path')
      .order('created_at', { ascending: false });

    if (traineesError) {
      setNotice(traineesError.message);
    }

    setTrainees(((traineeRows ?? []) as TraineeRow[]).map(mapTraineeRow));

    const { data: timeLogRows, error: timeLogsError } = await supabase
      .from('ojt_time_logs')
      .select('id, trainee_id, clinic_id, log_date, time_in, time_out, rendered_hours')
      .order('time_in', { ascending: false })
      .limit(3000);

    if (timeLogsError) {
      setNotice(timeLogsError.message);
    }

    setOjtTimeLogs((timeLogRows ?? []) as OjtTimeLog[]);

    if (normalizedProfile.role === 'super_admin') {
      const { data: profileRows, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, clinic_id, is_active')
        .order('full_name');

      if (profilesError) {
        setNotice(profilesError.message);
      }

      setProfiles((profileRows ?? []) as Profile[]);

      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data: visitRows, error: visitsError } = await supabase
        .from('page_visits')
        .select('id, path, device_type, country, region, city, timezone, visited_at')
        .gte('visited_at', since.toISOString())
        .order('visited_at', { ascending: false })
        .limit(5000);

      if (visitsError) {
        setNotice(visitsError.message);
      }

      setPageVisits((visitRows ?? []) as PageVisit[]);
      setAnalyticsUpdatedAt(new Date());
    }

    setLoading(false);
  };

  const loadAnalyticsData = async () => {
    if (!supabase || !authUser || !isSuperAdmin) {
      return;
    }

    setIsAnalyticsRefreshing(true);

    const since = new Date();
    since.setDate(since.getDate() - 90);
    const { data: visitRows, error: visitsError } = await supabase
      .from('page_visits')
      .select('id, path, device_type, country, region, city, timezone, visited_at')
      .gte('visited_at', since.toISOString())
      .order('visited_at', { ascending: false })
      .limit(5000);

    if (visitsError) {
      setNotice(visitsError.message);
    } else {
      setPageVisits((visitRows ?? []) as PageVisit[]);
      setAnalyticsUpdatedAt(new Date());
    }

    setIsAnalyticsRefreshing(false);
  };

  useEffect(() => {
    if (activeTab !== 'analytics' || !isSuperAdmin || !authUser) {
      return;
    }

    void loadAnalyticsData();
    const timer = window.setInterval(() => {
      void loadAnalyticsData();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [activeTab, isSuperAdmin, authUser?.id]);

  useEffect(() => {
    const selectedTab = tabs.find((tab) => tab.key === activeTab);
    if (selectedTab?.superOnly && !isSuperAdmin) {
      setActiveTab('overview');
    }
  }, [activeTab, isSuperAdmin]);

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
    if (!supabase || !isSuperAdmin || isSavingProfile) {
      return;
    }

    clearNotice();
    const nextEmail = newUserEmail.trim().toLowerCase();
    const nextPassword = newUserPassword;
    const payload = {
      full_name: profileForm.full_name.trim(),
      role: profileForm.role,
      clinic_id: profileForm.role === 'super_admin' ? null : profileForm.clinic_id || null,
      is_active: profileForm.is_active,
    };

    if (!payload.full_name) {
      notify('Full name is required.', 'warning');
      return;
    }

    if (payload.role !== 'super_admin' && !payload.clinic_id) {
      notify('Clinic is required for clinic admin and staff users.', 'warning');
      return;
    }

    if (editingProfileId && nextPassword && nextPassword.length < 6) {
      notify('New password must be at least 6 characters.', 'warning');
      return;
    }

    let successMessage = '';
    if (!editingProfileId) {
      if (!nextEmail || !isValidEmail(nextEmail)) {
        notify('Enter a valid login email.', 'warning');
        return;
      }

      if (nextPassword.length < 6) {
        notify('Temporary password must be at least 6 characters.', 'warning');
        return;
      }

      setIsSavingProfile(true);
      try {
        const response = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: nextEmail,
            password: nextPassword,
            ...payload,
          },
        });

        if (response.error) {
          notify(await getFunctionErrorMessage(response.error), 'error');
          return;
        }

        successMessage = 'User login account created. They can now sign in with the email and temporary password.';
      } finally {
        setIsSavingProfile(false);
      }
    } else {
      setIsSavingProfile(true);
      try {
        const profileResponse = await supabase.from('user_profiles').update(payload).eq('id', editingProfileId);
        if (profileResponse.error) {
          notify(profileResponse.error.message, 'error');
          return;
        }

        if (nextPassword) {
          const passwordResponse = await supabase.functions.invoke('admin-create-user', {
            body: {
              action: 'update-password',
              user_id: editingProfileId,
              password: nextPassword,
            },
          });

          if (passwordResponse.error) {
            notify(await getFunctionErrorMessage(passwordResponse.error), 'error');
            return;
          }
        }

        successMessage = nextPassword ? 'User profile and password updated.' : 'User profile updated.';
      } finally {
        setIsSavingProfile(false);
      }
    }

    setProfileForm(emptyProfile);
    setNewUserEmail('');
    setNewUserPassword('');
    setEditingProfileId(null);
    await loadAdminData();
    notify(successMessage, 'success');
  };

  const saveEventAlbum = async () => {
    if (!supabase || (!activeClinicId && !editingEventId) || !eventForm.title.trim()) {
      return;
    }

    setNotice('');
    const payload = {
        clinic_id: activeClinicId,
        title: eventForm.title.trim(),
        event_date: eventForm.eventDate || null,
        description: eventForm.description.trim() || null,
        is_public: eventForm.isPublic,
        created_by: authUser?.id,
    };

    const albumResponse = editingEventId
      ? await supabase
        .from('event_albums')
        .update({
          title: payload.title,
          event_date: payload.event_date,
          description: payload.description,
          is_public: payload.is_public,
        })
        .eq('id', editingEventId)
        .select('id')
        .single()
      : await supabase
        .from('event_albums')
        .insert(payload)
      .select('id')
      .single();

    if (albumResponse.error || !albumResponse.data) {
      setNotice(albumResponse.error?.message ?? 'Unable to save event album.');
      return;
    }

    const album = albumResponse.data;
    for (const [index, file] of eventFiles.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const storagePath = `${activeClinicId}/${album.id}/${Date.now()}-${index}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('event-photos').upload(storagePath, file);

      if (uploadError) {
        setNotice(uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from('event-photos').getPublicUrl(storagePath);
      const { error: photoError } = await supabase.from('event_photos').insert({
        album_id: album.id,
        storage_path: storagePath,
        public_url: publicUrlData.publicUrl,
        caption: eventForm.title.trim(),
        sort_order: index + (editingEventId ? 100 : 0),
        uploaded_by: authUser?.id,
      });

      if (photoError) {
        setNotice(photoError.message);
      }
    }

    setEventForm({ title: '', eventDate: '', description: '', isPublic: true });
    setEventFiles([]);
    setEditingEventId(null);
    await loadAdminData();
  };

  const editEventAlbum = (album: EventAlbum) => {
    setEditingEventId(album.id);
    setSelectedClinicId(album.clinic_id || selectedClinicId);
    setEventForm({
      title: album.title,
      eventDate: album.event_date || '',
      description: album.description || '',
      isPublic: album.is_public,
    });
    setEventFiles([]);
  };

  const deleteEventAlbum = async (album: EventAlbum) => {
    if (!supabase || !window.confirm('Delete this event album and its photos?')) {
      return;
    }

    const storagePaths = album.event_photos?.map((photo) => photo.storage_path).filter(Boolean) ?? [];
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage.from('event-photos').remove(storagePaths);
      if (storageError) {
        setNotice(storageError.message);
      }
    }

    const { error } = await supabase.from('event_albums').delete().eq('id', album.id);
    if (error) {
      setNotice(error.message);
      return;
    }

    if (editingEventId === album.id) {
      setEditingEventId(null);
      setEventForm({ title: '', eventDate: '', description: '', isPublic: true });
      setEventFiles([]);
    }

    await loadAdminData();
  };

  const deleteProfile = async (profileId: string) => {
    if (!supabase || !isSuperAdmin || deletingProfileId || !window.confirm('Delete this user profile? This does not delete the Supabase Auth user.')) {
      return;
    }

    clearNotice();
    setDeletingProfileId(profileId);
    try {
      const userProfile = profiles.find((item) => item.id === profileId);
      const { error } = await supabase.from('user_profiles').delete().eq('id', profileId);
      if (error) {
        notify(error.message, 'error');
        return;
      }

      if (editingProfileId === profileId) {
        setEditingProfileId(null);
        setProfileForm(emptyProfile);
        setNewUserEmail('');
        setNewUserPassword('');
      }

      await loadAdminData();
      notify(`${userProfile?.full_name ?? 'User profile'} was deleted.`, 'success');
    } finally {
      setDeletingProfileId(null);
    }
  };

  const addTrainee = async () => {
    if (!supabase || isSavingTrainee) {
      return;
    }

    const fullName = newTrainee.fullName.trim();
    if (!fullName || !activeClinicId) {
      notify('OJT trainee full name is required.', 'warning');
      return;
    }

    const duplicate = visibleTrainees.find((trainee) => (
      trainee.clinicId === activeClinicId &&
      normalizeRecordKey(trainee.fullName) === normalizeRecordKey(fullName)
    ));
    if (duplicate) {
      notify(`${fullName} already exists in this clinic. Use Edit or the batch override flow instead.`, 'warning');
      return;
    }

    if (!isValidEmail(newTrainee.email)) {
      notify('Enter a valid OJT email address.', 'warning');
      return;
    }

    clearNotice();
    setIsSavingTrainee(true);
    try {
      const { data: traineeRow, error: traineeError } = await supabase
        .from('ojt_trainees')
        .insert({
          clinic_id: activeClinicId,
          full_name: fullName,
          school_name: newTrainee.schoolName.trim() || null,
          course: newTrainee.course.trim() || null,
          date_of_birth: newTrainee.dateOfBirth || null,
          email: newTrainee.email.trim() || null,
          total_hours: Number(newTrainee.totalHours) || 0,
          start_date: newTrainee.startDate || null,
          end_date: newTrainee.endDate || null,
          status: 'active',
          notes: newTrainee.batchName.trim() || null,
          created_by: authUser?.id,
        })
        .select('id, clinic_id, full_name, school_name, course, date_of_birth, email, total_hours, start_date, end_date, status, notes, photo_public_url, photo_storage_path')
        .single();

      if (traineeError || !traineeRow) {
        notify(traineeError?.message ?? 'Unable to save OJT trainee.', 'error');
        return;
      }

      if (traineePhotoFile) {
        const safeName = traineePhotoFile.name.replace(/[^a-zA-Z0-9.-]/g, '-');
        const storagePath = `${activeClinicId}/${traineeRow.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('ojt-photos').upload(storagePath, traineePhotoFile);

        if (uploadError) {
          notify(uploadError.message, 'error');
          return;
        }

        const { data: publicUrlData } = supabase.storage.from('ojt-photos').getPublicUrl(storagePath);
        const { error: photoUpdateError } = await supabase
          .from('ojt_trainees')
          .update({
            photo_storage_path: storagePath,
            photo_public_url: publicUrlData.publicUrl,
          })
          .eq('id', traineeRow.id);

        if (photoUpdateError) {
          notify(photoUpdateError.message, 'error');
          return;
        }
      }

      setNewTrainee({ fullName: '', schoolName: '', course: '', dateOfBirth: '', email: '', totalHours: '300', startDate: '', endDate: '', batchName: '' });
      setTraineePhotoFile(null);
      setIsAddTraineeOpen(false);
      notify(`${fullName} was added successfully.`, 'success');
      await loadAdminData();
    } finally {
      setIsSavingTrainee(false);
    }
  };

  const downloadOjtTemplate = () => {
    const csv = buildCsv(ojtTemplateHeaders, ojtTemplateRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ojt-batch-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportOjtTrainees = () => {
    const headers = ['full_name', 'clinic', 'school_name', 'course', 'date_of_birth', 'email', 'batch_name', 'required_hours', 'rendered_hours', 'start_date', 'end_date', 'status', 'photo_url'];
    const rows = filteredTrainees.map((trainee) => [
      trainee.fullName,
      clinics.find((clinic) => clinic.id === trainee.clinicId)?.name ?? 'Clinic',
      trainee.schoolName,
      trainee.course,
      trainee.dateOfBirth,
      trainee.email,
      trainee.batchName,
      String(trainee.totalHours),
      (loggedHoursByTrainee.get(trainee.id) ?? 0).toFixed(2),
      trainee.startDate,
      trainee.endDate,
      trainee.status,
      trainee.photoUrl ?? '',
    ]);
    const csv = buildCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ojt-trainees-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveOjtImportRows = async (
    rowsToImport: OjtImportRow[],
    missingPhotoFiles: string[],
    overrideIdsByRowNumber = new Map<number, string>(),
  ) => {
    if (!supabase || !activeClinicId || isImportingOjt) {
      return;
    }

    setIsImportingOjt(true);
    try {
      const selectedPhotoFiles = new Map(ojtBatchPhotoFiles.map((file) => [normalizeFileName(file.name), file]));
      let uploadedPhotoCount = 0;
      let savedRowCount = 0;

    const uploadImportPhoto = async (traineeId: string, photoFileName: string, index: number) => {
      if (!photoFileName) {
        return true;
      }

      const photoFile = selectedPhotoFiles.get(normalizeFileName(photoFileName));
      if (!photoFile) {
        return true;
      }

      const safeName = photoFile.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const storagePath = `${activeClinicId}/${traineeId}/${Date.now()}-${index}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('ojt-photos').upload(storagePath, photoFile);

      if (uploadError) {
        notify(uploadError.message, 'error');
        return false;
      }

      const { data: publicUrlData } = supabase.storage.from('ojt-photos').getPublicUrl(storagePath);
      const { error: photoUpdateError } = await supabase
        .from('ojt_trainees')
        .update({
          photo_storage_path: storagePath,
          photo_public_url: publicUrlData.publicUrl,
        })
        .eq('id', traineeId);

      if (photoUpdateError) {
        notify(photoUpdateError.message, 'error');
        return false;
      }

      uploadedPhotoCount += 1;
      return true;
    };

    const rowsToInsert = rowsToImport.filter((row) => !overrideIdsByRowNumber.has(row.rowNumber));
    if (rowsToInsert.length > 0) {
      const { data: insertedRows, error } = await supabase
        .from('ojt_trainees')
        .insert(rowsToInsert.map((row) => row.payload))
        .select('id');

      if (error || !insertedRows) {
        notify(error?.message ?? 'Unable to import OJT trainees.', 'error');
        return;
      }

      savedRowCount += insertedRows.length;
      for (const [index, insertedRow] of insertedRows.entries()) {
        const ok = await uploadImportPhoto(insertedRow.id, rowsToInsert[index]?.photoFileName ?? '', index);
        if (!ok) {
          return;
        }
      }
    }

    for (const [index, row] of rowsToImport.entries()) {
      const existingId = overrideIdsByRowNumber.get(row.rowNumber);
      if (!existingId) {
        continue;
      }

      const { error } = await supabase
        .from('ojt_trainees')
        .update(row.payload)
        .eq('id', existingId);

      if (error) {
        notify(error.message, 'error');
        return;
      }

      savedRowCount += 1;
      const ok = await uploadImportPhoto(existingId, row.photoFileName, index);
      if (!ok) {
        return;
      }
    }

    setOjtBatchFile(null);
    setOjtBatchPhotoFiles([]);
    setPendingOjtImport(null);
    setSelectedDuplicateRows([]);
    const skippedPhotoCount = missingPhotoFiles.length;
      notify(`${savedRowCount} OJT trainee(s) saved${uploadedPhotoCount ? ` with ${uploadedPhotoCount} photo(s)` : ''}${skippedPhotoCount ? `; ${skippedPhotoCount} photo filename(s) were not selected and were skipped` : ''}.`, skippedPhotoCount ? 'warning' : 'success');
      await loadAdminData();
    } finally {
      setIsImportingOjt(false);
    }
  };

  const uploadOjtBatch = async () => {
    if (!supabase || !activeClinicId || !ojtBatchFile || isImportingOjt) {
      return;
    }

    clearNotice();
    const csvText = await ojtBatchFile.text();
    const parsedRows = parseCsv(csvText);

    if (parsedRows.length < 2) {
      notify('Upload a CSV with headers and at least one OJT trainee.', 'warning');
      return;
    }

    const headers = parsedRows[0].map((header) => header.trim().toLowerCase());
    const missingHeaders = ojtTemplateHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      notify(`Missing CSV column(s): ${missingHeaders.join(', ')}`, 'warning');
      return;
    }

    const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));
    const selectedPhotoFiles = new Map(ojtBatchPhotoFiles.map((file) => [normalizeFileName(file.name), file]));
    const rowsToImport: OjtImportRow[] = [];
    const missingPhotoFiles = new Set<string>();

    for (const [rowIndex, row] of parsedRows.slice(1).entries()) {
      const rowNumber = rowIndex + 2;
      const fullName = row[headerIndex.full_name]?.trim() ?? '';
      const email = row[headerIndex.email]?.trim() ?? '';
      const dateOfBirth = row[headerIndex.date_of_birth]?.trim() ?? '';
      const totalHoursValue = row[headerIndex.total_hours]?.trim() ?? '';
      const startDate = row[headerIndex.start_date]?.trim() ?? '';
      const endDate = row[headerIndex.end_date]?.trim() ?? '';
      const photoFileName = row[headerIndex.photo_file]?.trim() ?? '';
      const totalHours = Number(totalHoursValue);
      const normalizedDateOfBirth = normalizeCsvDate(dateOfBirth);
      const normalizedStartDate = normalizeCsvDate(startDate);
      const normalizedEndDate = normalizeCsvDate(endDate);

      if (!fullName) {
        notify(`Row ${rowNumber}: full_name is required.`, 'warning');
        return;
      }

      if (totalHoursValue && (!Number.isFinite(totalHours) || totalHours < 0)) {
        notify(`Row ${rowNumber}: total_hours must be a valid number.`, 'warning');
        return;
      }

      if (normalizedDateOfBirth === undefined) {
        notify(`Row ${rowNumber}: date_of_birth must use YYYY-MM-DD or Excel date format.`, 'warning');
        return;
      }

      if (!isValidEmail(email)) {
        notify(`Row ${rowNumber}: email must be a valid email address.`, 'warning');
        return;
      }

      if (normalizedStartDate === undefined || normalizedEndDate === undefined) {
        notify(`Row ${rowNumber}: dates must use YYYY-MM-DD or Excel date format.`, 'warning');
        return;
      }

      if (photoFileName && !selectedPhotoFiles.has(normalizeFileName(photoFileName))) {
        missingPhotoFiles.add(photoFileName);
      }

      rowsToImport.push({
        rowNumber,
        photoFileName,
        payload: {
          clinic_id: activeClinicId,
          full_name: fullName,
          school_name: row[headerIndex.school_name]?.trim() || null,
          course: row[headerIndex.course]?.trim() || null,
          date_of_birth: normalizedDateOfBirth,
          email: email || null,
          total_hours: totalHoursValue ? totalHours : 0,
          start_date: normalizedStartDate,
          end_date: normalizedEndDate,
          status: 'active' as OjtStatus,
          notes: row[headerIndex.batch_name]?.trim() || null,
          created_by: authUser?.id,
        },
      });
    }

    const duplicates = rowsToImport
      .map((row) => {
        const existing = visibleTrainees.find((trainee) => (
          trainee.clinicId === activeClinicId &&
          normalizeRecordKey(trainee.fullName) === normalizeRecordKey(row.payload.full_name)
        ));

        return existing ? { row, existing } : null;
      })
      .filter((review): review is OjtDuplicateReview => Boolean(review));

    if (duplicates.length > 0) {
      setPendingOjtImport({
        rows: rowsToImport,
        missingPhotoFiles: Array.from(missingPhotoFiles),
        duplicates,
      });
      setSelectedDuplicateRows(duplicates.map((duplicate) => duplicate.row.rowNumber));
      notify(`${duplicates.length} existing OJT record(s) found. Review duplicates before importing.`, 'warning');
      return;
    }

    await saveOjtImportRows(rowsToImport, Array.from(missingPhotoFiles));
  };

  const overrideSelectedOjtDuplicates = async () => {
    if (!pendingOjtImport) {
      return;
    }

    const selectedRows = new Set(selectedDuplicateRows);
    const duplicateRows = new Set(pendingOjtImport.duplicates.map((duplicate) => duplicate.row.rowNumber));
    const overrides = new Map<number, string>();

    pendingOjtImport.duplicates.forEach((duplicate) => {
      if (selectedRows.has(duplicate.row.rowNumber)) {
        overrides.set(duplicate.row.rowNumber, duplicate.existing.id);
      }
    });

    const rowsToSave = pendingOjtImport.rows.filter((row) => (
      !duplicateRows.has(row.rowNumber) || selectedRows.has(row.rowNumber)
    ));

    await saveOjtImportRows(rowsToSave, pendingOjtImport.missingPhotoFiles, overrides);
  };

  const rejectSelectedOjtDuplicates = async () => {
    if (!pendingOjtImport) {
      return;
    }

    const selectedRows = new Set(selectedDuplicateRows);
    const remainingDuplicates = pendingOjtImport.duplicates.filter((duplicate) => !selectedRows.has(duplicate.row.rowNumber));
    const remainingRows = pendingOjtImport.rows.filter((row) => !selectedRows.has(row.rowNumber));

    if (remainingDuplicates.length > 0) {
      setPendingOjtImport({ ...pendingOjtImport, rows: remainingRows, duplicates: remainingDuplicates });
      setSelectedDuplicateRows(remainingDuplicates.map((duplicate) => duplicate.row.rowNumber));
      return;
    }

    await saveOjtImportRows(remainingRows, pendingOjtImport.missingPhotoFiles);
  };

  const markCompleted = async (id: string) => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase
      .from('ojt_trainees')
      .update({ status: 'completed' })
      .eq('id', id);

    if (error) {
      notify(error.message, 'error');
      return;
    }

    const completedName = trainees.find((trainee) => trainee.id === id)?.fullName ?? 'OJT trainee';
    setTrainees((current) => current.map((trainee) => (
      trainee.id === id ? { ...trainee, status: 'completed' } : trainee
    )));
    notify(`${completedName} was marked completed.`, 'success');
  };

  const saveEditedTrainee = async () => {
    if (!supabase || !editingTrainee || isSavingEditedTrainee) {
      return;
    }

    clearNotice();
    if (!editingTrainee.fullName.trim()) {
      notify('OJT trainee full name is required.', 'warning');
      return;
    }

    const duplicate = visibleTrainees.find((trainee) => (
      trainee.id !== editingTrainee.id &&
      trainee.clinicId === editingTrainee.clinicId &&
      normalizeRecordKey(trainee.fullName) === normalizeRecordKey(editingTrainee.fullName)
    ));
    if (duplicate) {
      notify(`${editingTrainee.fullName.trim()} already exists in this clinic.`, 'warning');
      return;
    }

    if (!isValidEmail(editingTrainee.email)) {
      notify('Enter a valid OJT email address.', 'warning');
      return;
    }

    setIsSavingEditedTrainee(true);
    try {
      const updates = {
        full_name: editingTrainee.fullName.trim(),
        school_name: editingTrainee.schoolName.trim() || null,
        course: editingTrainee.course.trim() || null,
        date_of_birth: editingTrainee.dateOfBirth || null,
        email: editingTrainee.email.trim() || null,
        total_hours: Number(editingTrainee.totalHours) || 0,
        start_date: editingTrainee.startDate || null,
        end_date: editingTrainee.endDate || null,
        status: editingTrainee.status,
        notes: editingTrainee.batchName.trim() || null,
      };

      const { error } = await supabase
        .from('ojt_trainees')
        .update(updates)
        .eq('id', editingTrainee.id);

      if (error) {
        notify(error.message, 'error');
        return;
      }

      if (editingTraineePhotoFile) {
        if (editingTrainee.photoStoragePath) {
          await supabase.storage.from('ojt-photos').remove([editingTrainee.photoStoragePath]);
        }

        const safeName = editingTraineePhotoFile.name.replace(/[^a-zA-Z0-9.-]/g, '-');
        const storagePath = `${editingTrainee.clinicId}/${editingTrainee.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('ojt-photos').upload(storagePath, editingTraineePhotoFile);

        if (uploadError) {
          notify(uploadError.message, 'error');
          return;
        }

        const { data: publicUrlData } = supabase.storage.from('ojt-photos').getPublicUrl(storagePath);
        const { error: photoUpdateError } = await supabase
          .from('ojt_trainees')
          .update({
            photo_storage_path: storagePath,
            photo_public_url: publicUrlData.publicUrl,
          })
          .eq('id', editingTrainee.id);

        if (photoUpdateError) {
          notify(photoUpdateError.message, 'error');
          return;
        }
      }

      notify(`${editingTrainee.fullName.trim()} was updated successfully.`, 'success');
      setEditingTrainee(null);
      setEditingTraineePhotoFile(null);
      await loadAdminData();
    } finally {
      setIsSavingEditedTrainee(false);
    }
  };

  const deleteTrainee = async (trainee: Trainee) => {
    if (!supabase || deletingTraineeId || !window.confirm(`Delete OJT record for ${trainee.fullName}?`)) {
      return;
    }

    clearNotice();
    setDeletingTraineeId(trainee.id);
    try {
      if (trainee.photoStoragePath) {
        const { error: storageError } = await supabase.storage.from('ojt-photos').remove([trainee.photoStoragePath]);
        if (storageError) {
          notify(storageError.message, 'error');
          return;
        }
      }

      const { error } = await supabase
        .from('ojt_trainees')
        .delete()
        .eq('id', trainee.id);

      if (error) {
        notify(error.message, 'error');
        return;
      }

      if (selectedTrainee?.id === trainee.id) {
        setSelectedTrainee(null);
      }
      if (editingTrainee?.id === trainee.id) {
        setEditingTrainee(null);
        setEditingTraineePhotoFile(null);
      }

      notify(`${trainee.fullName} was deleted.`, 'success');
      await loadAdminData();
    } finally {
      setDeletingTraineeId(null);
    }
  };

  const generateCertificates = (selected = completedTrainees) => {
    const certificateData = selected.map((trainee) => ({
      fullName: trainee.fullName,
      schoolName: trainee.schoolName,
      clinicName: `${clinics.find((clinic) => clinic.id === trainee.clinicId)?.name ?? 'PSYZYGY'} Branch`,
      totalHours: trainee.totalHours,
      startDate: trainee.startDate || 'Start date',
      endDate: trainee.endDate || 'Completion date',
      batchName: trainee.batchName,
      ojtYear: (trainee.endDate || trainee.startDate || new Date().getFullYear().toString()).slice(0, 4),
    }));

    void generateOjtCertificatePdf(certificateData, selected.length > 1 ? 'PSYZYGY OJT Batch' : selected[0]?.batchName);
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
            {notice && <AdminNotice message={notice} type={noticeType} />}
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
          {notice && <AdminNotice message={notice} type={noticeType} />}

          {activeTab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Accessible Clinics" value={String(accessibleClinics.length)} />
              <Metric label="OJT Trainees" value={String(visibleTrainees.length)} />
              <Metric label="Completed OJT" value={String(completedTrainees.length)} />
            </div>
          )}

          {activeTab === 'analytics' && isSuperAdmin && (
            <AnalyticsPanel
              visits={pageVisits}
              updatedAt={analyticsUpdatedAt}
              isRefreshing={isAnalyticsRefreshing}
              onRefresh={loadAnalyticsData}
            />
          )}

          {activeTab === 'events' && isSuperAdmin && (
            <Panel title="Event Photo Upload" subtitle="Create event albums and upload photos by clinic.">
              <div className="grid gap-4 lg:grid-cols-2">
                <Input label="Event title" value={eventForm.title} onChange={(value) => setEventForm({ ...eventForm, title: value })} />
                <Input label="Event date" value={eventForm.eventDate} onChange={(value) => setEventForm({ ...eventForm, eventDate: value })} type="date" />
                <label className="lg:col-span-2 block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Description</span>
                  <textarea
                    value={eventForm.description}
                    onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })}
                    className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={eventForm.isPublic}
                    onChange={(event) => setEventForm({ ...eventForm, isPublic: event.target.checked })}
                  />
                  <span className="text-sm font-medium text-foreground/65">Show on public website</span>
                </label>
                <label className="lg:col-span-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                  <ImagePlus className="mb-3 h-8 w-8 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-foreground">
                    {eventFiles.length ? `${eventFiles.length} photo(s) selected` : 'Upload event photos'}
                  </span>
                  <span className="mt-1 text-xs text-foreground/55">Photos will be stored in Supabase Storage and published when the album is public.</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => setEventFiles(Array.from(event.target.files ?? []))}
                  />
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={saveEventAlbum} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white">
                    <Save className="h-4 w-4" /> {editingEventId ? 'Save Event Changes' : 'Save Event Album'}
                  </button>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventId(null);
                        setEventForm({ title: '', eventDate: '', description: '', isPublic: true });
                        setEventFiles([]);
                      }}
                      className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {eventAlbums.map((album) => {
                  const photos = getAdminEventPhotos(album);
                  const cover = photos[0];
                  return (
                    <div key={album.id} className="overflow-hidden rounded-lg border border-border bg-[#f7f4f0]">
                      <button type="button" onClick={() => setSelectedEventAlbum(album)} className="block w-full text-left">
                      <div className="aspect-[4/3] bg-secondary">
                        {cover?.public_url ? (
                          <img src={cover.public_url} alt={album.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-foreground/35">No photo</div>
                        )}
                      </div>
                      <div className="p-4 pb-0">
                        <p className="font-semibold text-foreground" style={adminClampStyle(1)}>{album.title}</p>
                        <p className="mt-1 text-xs text-foreground/50">{album.event_date || 'No date'} · {album.is_public ? 'Public' : 'Hidden'}</p>
                        {album.description && <p className="mt-2 text-sm text-foreground/60" style={adminClampStyle(2)}>{album.description}</p>}
                        <span className="mt-3 inline-block text-xs font-semibold text-primary">View details</span>
                      </div>
                      </button>
                      <div className="p-4">
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => editEventAlbum(album)}
                            className="flex h-9 items-center gap-1 rounded-lg border border-border bg-white px-3 text-xs font-semibold"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEventAlbum(album)}
                            className="flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedEventAlbum && (
                <AdminEventDialog album={selectedEventAlbum} onClose={() => setSelectedEventAlbum(null)} />
              )}
            </Panel>
          )}

          {activeTab === 'ojt' && (
            <Panel title="OJT Management" subtitle="Clinic users only see and manage OJT records for their clinic.">
              <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid flex-1 gap-3 md:grid-cols-[1fr_180px]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Search OJT</span>
                    <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-3">
                      <Search className="h-4 w-4 text-foreground/35" />
                      <input
                        value={ojtSearch}
                        onChange={(event) => setOjtSearch(event.target.value)}
                        placeholder="Name, school, course, batch"
                        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Status</span>
                    <select value={ojtStatusFilter} onChange={(event) => setOjtStatusFilter(event.target.value as 'all' | OjtStatus)} className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm">
                      <option value="all">All status</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => setIsAddTraineeOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                  <button type="button" onClick={exportOjtTrainees} disabled={filteredTrainees.length === 0} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/70 disabled:cursor-not-allowed disabled:opacity-40">
                    <Download className="h-4 w-4" /> Export
                  </button>
                </div>
              </div>
              <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Batch import OJT trainees</p>
                  <p className="mt-1 text-xs text-foreground/55">Use the CSV template, add photo filenames, then choose the matching image files before import.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button type="button" onClick={downloadOjtTemplate} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/70">
                    <Download className="h-4 w-4" /> Template
                  </button>
                  <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/35 px-4 text-sm font-semibold text-foreground/70">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="max-w-48 truncate">{ojtBatchFile ? ojtBatchFile.name : 'Choose CSV'}</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(event) => {
                        setOjtBatchFile(event.target.files?.[0] ?? null);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/35 px-4 text-sm font-semibold text-foreground/70">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    <span className="max-w-48 truncate">{ojtBatchPhotoFiles.length ? `${ojtBatchPhotoFiles.length} photo(s)` : 'Choose photos'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        setOjtBatchPhotoFiles(Array.from(event.target.files ?? []));
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  <button type="button" onClick={uploadOjtBatch} disabled={!ojtBatchFile || isImportingOjt} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                    <Upload className="h-4 w-4" /> {isImportingOjt ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
              <TraineeTable
                trainees={filteredTrainees}
                clinics={clinics}
                loggedHoursByTrainee={loggedHoursByTrainee}
                onView={setSelectedTrainee}
                onEdit={(trainee) => {
                  setEditingTrainee(trainee);
                  setEditingTraineePhotoFile(null);
                }}
                onDelete={deleteTrainee}
                deletingId={deletingTraineeId}
                onComplete={markCompleted}
                onCertificate={(trainee) => generateCertificates([trainee])}
              />
              {isAddTraineeOpen && (
                <OjtAddDialog
                  trainee={newTrainee}
                  setTrainee={setNewTrainee}
                  photoFile={traineePhotoFile}
                  setPhotoFile={setTraineePhotoFile}
                  onSave={addTrainee}
                  isSaving={isSavingTrainee}
                  onClose={() => {
                    setIsAddTraineeOpen(false);
                    setTraineePhotoFile(null);
                  }}
                />
              )}
              {selectedTrainee && (
                <OjtDetailsDialog
                  trainee={selectedTrainee}
                  timeLogs={ojtTimeLogs.filter((log) => log.trainee_id === selectedTrainee.id)}
                  loggedHours={loggedHoursByTrainee.get(selectedTrainee.id) ?? 0}
                  clinicName={clinics.find((clinic) => clinic.id === selectedTrainee.clinicId)?.name ?? 'Clinic'}
                  onClose={() => setSelectedTrainee(null)}
                />
              )}
              {editingTrainee && (
                <OjtEditDialog
                  trainee={editingTrainee}
                  setTrainee={setEditingTrainee}
                  photoFile={editingTraineePhotoFile}
                  setPhotoFile={setEditingTraineePhotoFile}
                  clinicName={clinics.find((clinic) => clinic.id === editingTrainee.clinicId)?.name ?? 'Clinic'}
                  onSave={saveEditedTrainee}
                  isSaving={isSavingEditedTrainee}
                  onClose={() => {
                    setEditingTrainee(null);
                    setEditingTraineePhotoFile(null);
                  }}
                />
              )}
              {pendingOjtImport && (
                <OjtDuplicateDialog
                  duplicates={pendingOjtImport.duplicates}
                  selectedRows={selectedDuplicateRows}
                  setSelectedRows={setSelectedDuplicateRows}
                  onOverrideSelected={overrideSelectedOjtDuplicates}
                  onRejectSelected={rejectSelectedOjtDuplicates}
                  onClose={() => {
                    setPendingOjtImport(null);
                    setSelectedDuplicateRows([]);
                    setOjtBatchFile(null);
                    setOjtBatchPhotoFiles([]);
                  }}
                />
              )}
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
            <UserCrud
              profiles={profiles}
              clinics={clinics}
              form={profileForm}
              setForm={setProfileForm}
              editingId={editingProfileId}
              setEditingId={setEditingProfileId}
              email={newUserEmail}
              setEmail={setNewUserEmail}
              password={newUserPassword}
              setPassword={setNewUserPassword}
              onSave={saveProfile}
              onDelete={deleteProfile}
              isSaving={isSavingProfile}
              deletingId={deletingProfileId}
            />
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

function AnalyticsPanel({
  visits,
  updatedAt,
  isRefreshing,
  onRefresh,
}: {
  visits: PageVisit[];
  updatedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const dailyTrend = buildDailyTrend(visits);
  const deviceData = buildCountData(visits.map((visit) => visit.device_type || 'unknown'));
  const locationData = buildCountData(visits.map((visit) => formatVisitLocation(visit))).slice(0, 8);
  const topPages = buildCountData(visits.map((visit) => visit.path || '/')).slice(0, 8);
  const mobileCount = visits.filter((visit) => visit.device_type === 'mobile' || visit.device_type === 'tablet').length;
  const desktopCount = visits.filter((visit) => visit.device_type === 'desktop').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Live analytics data</p>
          <p className="mt-1 text-sm text-foreground/55">
            Auto-refreshes every 30 seconds while this tab is open.
            {updatedAt ? ` Last updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Visits, Last 90 Days" value={String(visits.length)} />
        <Metric label="Mobile / Tablet" value={String(mobileCount)} />
        <Metric label="Desktop" value={String(desktopCount)} />
        <Metric label="Locations" value={String(locationData.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel title="Visit Trend" subtitle="Daily page views based on recorded visit dates.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="visits" stroke="rgb(31,89,105)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Device Type" subtitle="Mobile, tablet, and desktop breakdown.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(31,89,105)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Top Locations" subtitle="Best available location from edge/browser signals.">
          <AnalyticsList items={locationData} emptyText="No location data yet." />
        </Panel>

        <Panel title="Top Pages" subtitle="Most viewed paths on the website.">
          <AnalyticsList items={topPages} emptyText="No page views yet." />
        </Panel>
      </div>
    </div>
  );
}

function AnalyticsList({ items, emptyText }: { items: Array<{ name: string; count: number }>; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-foreground/55">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4 rounded-lg bg-[#f7f4f0] px-4 py-3">
          <span className="truncate text-sm font-medium text-foreground/70">{item.name}</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary">{item.count}</span>
        </div>
      ))}
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

function AdminNotice({ message, type }: { message: string; type: AdminNoticeType }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-950/10',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 shadow-amber-950/10',
    error: 'border-red-200 bg-red-50 text-red-700 shadow-red-950/10',
  };

  return (
    <div className="fixed left-3 right-3 top-3 z-[140] sm:left-auto sm:w-full sm:max-w-md" role="status" aria-live="polite">
      <div className={`rounded-lg border p-4 text-sm font-medium shadow-xl ${styles[type]}`}>
        {message}
      </div>
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
  email,
  setEmail,
  password,
  setPassword,
  onSave,
  onDelete,
  isSaving,
  deletingId,
}: {
  profiles: Profile[];
  clinics: Clinic[];
  form: Profile;
  setForm: (form: Profile) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  deletingId: string | null;
}) {
  return (
    <Panel title="User CRUD" subtitle="Create a login account with password, then assign the user to a role and clinic.">
      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {!editingId && (
          <>
            <Input label="Login email" value={email} onChange={setEmail} type="email" />
            <Input label="Temporary password" value={password} onChange={setPassword} type="password" />
          </>
        )}
        {editingId && (
          <>
            <Input label="Auth User ID" value={form.id} onChange={(value) => setForm({ ...form, id: value })} />
            <Input label="New password (optional)" value={password} onChange={setPassword} type="password" />
          </>
        )}
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
          <button type="button" onClick={onSave} disabled={isSaving} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSaving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save User Profile' : 'Create User')}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyProfile); setEmail(''); setPassword(''); }} disabled={isSaving} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65 disabled:cursor-not-allowed disabled:opacity-50">
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
                    <button type="button" onClick={() => { setEditingId(userProfile.id); setForm(userProfile); setEmail(''); setPassword(''); }} disabled={isSaving || deletingId === userProfile.id} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button type="button" onClick={() => onDelete(userProfile.id)} disabled={isSaving || Boolean(deletingId)} className="flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" /> {deletingId === userProfile.id ? 'Deleting...' : 'Delete'}
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

function AdminEventDialog({ album, onClose }: { album: EventAlbum; onClose: () => void }) {
  const photos = getAdminEventPhotos(album);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">
              {album.is_public ? 'Public event' : 'Hidden event'}
            </p>
            <h3 className="text-xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              {album.title}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60 hover:text-primary" aria-label="Close event preview">
            x
          </button>
        </div>
        <div className="p-5 lg:p-8">
          <p className="text-xs text-foreground/45">{album.event_date || 'No event date'}</p>
          {album.description && (
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/70" style={{ fontFamily: 'var(--font-body)' }}>
              {album.description}
            </p>
          )}
          {photos.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {photos.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-lg border border-border bg-[#f7f4f0]">
                  <img src={photo.public_url!} alt={photo.caption || album.title} className="aspect-[4/3] w-full object-cover" />
                  {photo.caption && <figcaption className="p-3 text-xs text-foreground/55">{photo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OjtDuplicateDialog({
  duplicates,
  selectedRows,
  setSelectedRows,
  onOverrideSelected,
  onRejectSelected,
  onClose,
}: {
  duplicates: OjtDuplicateReview[];
  selectedRows: number[];
  setSelectedRows: (rows: number[]) => void;
  onOverrideSelected: () => void;
  onRejectSelected: () => void;
  onClose: () => void;
}) {
  const selectedSet = new Set(selectedRows);
  const allSelected = duplicates.length > 0 && duplicates.every((duplicate) => selectedSet.has(duplicate.row.rowNumber));
  const toggleRow = (rowNumber: number) => {
    setSelectedRows(selectedSet.has(rowNumber)
      ? selectedRows.filter((selected) => selected !== rowNumber)
      : [...selectedRows, rowNumber]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Existing OJT records found</h3>
            <p className="mt-1 text-sm text-foreground/55">Select duplicate rows, then override the existing record or reject the new row.</p>
          </div>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65">
            Cancel Import
          </button>
        </div>

        <div className="max-h-[52vh] overflow-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="sticky top-0 border-b border-border bg-white text-xs uppercase tracking-wide text-foreground/45">
              <tr>
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => setSelectedRows(event.target.checked ? duplicates.map((duplicate) => duplicate.row.rowNumber) : [])}
                  />
                </th>
                <th className="py-3 pr-4">CSV Row</th>
                <th className="py-3 pr-4">New Entry</th>
                <th className="py-3 pr-4">Existing Record</th>
                <th className="py-3 pr-4">School</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map((duplicate) => (
                <tr key={duplicate.row.rowNumber} className="border-b border-border/60">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(duplicate.row.rowNumber)}
                      onChange={() => toggleRow(duplicate.row.rowNumber)}
                    />
                  </td>
                  <td className="py-4 pr-4 text-foreground/60">Row {duplicate.row.rowNumber}</td>
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-foreground">{duplicate.row.payload.full_name}</p>
                    <p className="text-xs text-foreground/50">{duplicate.row.payload.start_date || 'No start date'} to {duplicate.row.payload.end_date || 'No end date'}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-foreground">{duplicate.existing.fullName}</p>
                    <p className="text-xs text-foreground/50">{duplicate.existing.startDate || 'No start date'} to {duplicate.existing.endDate || 'No end date'}</p>
                  </td>
                  <td className="py-4 pr-4 text-foreground/60">
                    <p>{duplicate.row.payload.school_name || 'No new school'}</p>
                    <p className="text-xs text-foreground/45">Existing: {duplicate.existing.schoolName || 'No school'}</p>
                  </td>
                  <td className="py-4 pr-4 text-foreground/60">{duplicate.existing.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-5 md:flex-row md:items-center md:justify-end">
          <button type="button" onClick={onRejectSelected} disabled={selectedRows.length === 0} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65 disabled:cursor-not-allowed disabled:opacity-40">
            Reject Selected New Rows
          </button>
          <button type="button" onClick={onOverrideSelected} disabled={selectedRows.length === 0} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            Override Selected
          </button>
        </div>
      </div>
    </div>
  );
}

function OjtAddDialog({
  trainee,
  setTrainee,
  photoFile,
  setPhotoFile,
  onSave,
  isSaving,
  onClose,
}: {
  trainee: {
    fullName: string;
    schoolName: string;
    course: string;
    dateOfBirth: string;
    email: string;
    totalHours: string;
    startDate: string;
    endDate: string;
    batchName: string;
  };
  setTrainee: (trainee: {
    fullName: string;
    schoolName: string;
    course: string;
    dateOfBirth: string;
    email: string;
    totalHours: string;
    startDate: string;
    endDate: string;
    batchName: string;
  }) => void;
  photoFile: File | null;
  setPhotoFile: (file: File | null) => void;
  onSave: () => void;
  isSaving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">Add OJT</p>
            <h3 className="text-xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>New trainee record</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60 hover:text-primary" aria-label="Close add OJT">
            x
          </button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Input value={trainee.fullName} onChange={(value) => setTrainee({ ...trainee, fullName: value })} label="Full name" />
          <Input value={trainee.schoolName} onChange={(value) => setTrainee({ ...trainee, schoolName: value })} label="School" />
          <Input value={trainee.course} onChange={(value) => setTrainee({ ...trainee, course: value })} label="Course" />
          <Input value={trainee.dateOfBirth} onChange={(value) => setTrainee({ ...trainee, dateOfBirth: value })} label="Date of birth" type="date" />
          <Input value={trainee.email} onChange={(value) => setTrainee({ ...trainee, email: value })} label="Email" type="email" />
          <Input value={trainee.batchName} onChange={(value) => setTrainee({ ...trainee, batchName: value })} label="Batch" />
          <Input value={trainee.totalHours} onChange={(value) => setTrainee({ ...trainee, totalHours: value })} label="Hours" type="number" />
          <Input value={trainee.startDate} onChange={(value) => setTrainee({ ...trainee, startDate: value })} label="Start date" type="date" />
          <Input value={trainee.endDate} onChange={(value) => setTrainee({ ...trainee, endDate: value })} label="End date" type="date" />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
            <ImagePlus className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <span className="min-w-0 text-sm font-semibold text-foreground" style={adminClampStyle(1)}>
              {photoFile ? photoFile.name : 'Upload OJT photo'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                setPhotoFile(event.target.files?.[0] ?? null);
                event.currentTarget.value = '';
              }}
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={isSaving} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" /> {isSaving ? 'Adding...' : 'Add OJT'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OjtDetailsDialog({
  trainee,
  timeLogs,
  loggedHours,
  clinicName,
  onClose,
}: {
  trainee: Trainee;
  timeLogs: OjtTimeLog[];
  loggedHours: number;
  clinicName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">OJT Details</p>
            <h3 className="text-xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{trainee.fullName}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60 hover:text-primary" aria-label="Close OJT details">
            x
          </button>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
            {trainee.photoUrl ? (
              <img src={trainee.photoUrl} alt={trainee.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-foreground/35">
                <Camera className="h-10 w-10" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Clinic" value={clinicName} />
            <DetailItem label="Status" value={trainee.status} />
            <DetailItem label="School" value={trainee.schoolName || 'Not provided'} />
            <DetailItem label="Course" value={trainee.course || 'Not provided'} />
            <DetailItem label="Date of birth" value={trainee.dateOfBirth || 'Not provided'} />
            <DetailItem label="Email" value={trainee.email || 'Not provided'} />
            <DetailItem label="Batch" value={trainee.batchName || 'Not provided'} />
            <DetailItem label="Required hours" value={String(trainee.totalHours)} />
            <DetailItem label="Rendered hours" value={loggedHours.toFixed(2)} />
            <DetailItem label="Start date" value={trainee.startDate || 'Not provided'} />
            <DetailItem label="End date" value={trainee.endDate || 'Not provided'} />
          </div>
        </div>
        <div className="border-t border-border p-5">
          <h4 className="text-sm font-semibold text-foreground">Recent time logs</h4>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground/45">
                <tr>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Time in</th>
                  <th className="py-3 pr-4">Time out</th>
                  <th className="py-3 pr-4">Hours</th>
                </tr>
              </thead>
              <tbody>
                {timeLogs.slice(0, 12).map((log) => (
                  <tr key={log.id} className="border-b border-border/60">
                    <td className="py-3 pr-4">{log.log_date}</td>
                    <td className="py-3 pr-4 text-foreground/60">{formatAdminDateTime(log.time_in)}</td>
                    <td className="py-3 pr-4 text-foreground/60">{log.time_out ? formatAdminDateTime(log.time_out) : 'Open'}</td>
                    <td className="py-3 pr-4 text-foreground/60">{Number(log.rendered_hours).toFixed(2)}</td>
                  </tr>
                ))}
                {timeLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-5 text-center text-foreground/45">No time logs yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function OjtEditDialog({
  trainee,
  setTrainee,
  photoFile,
  setPhotoFile,
  clinicName,
  onSave,
  isSaving,
  onClose,
}: {
  trainee: Trainee;
  setTrainee: (trainee: Trainee) => void;
  photoFile: File | null;
  setPhotoFile: (file: File | null) => void;
  clinicName: string;
  onSave: () => void;
  isSaving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/70 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/60">Edit OJT</p>
            <h3 className="text-xl font-normal text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{trainee.fullName}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground/60 hover:text-primary" aria-label="Close edit OJT">
            x
          </button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Input label="Full name" value={trainee.fullName} onChange={(value) => setTrainee({ ...trainee, fullName: value })} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Clinic</span>
            <input value={clinicName} readOnly className="h-11 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground/60 outline-none" />
          </label>
          <Input label="School" value={trainee.schoolName} onChange={(value) => setTrainee({ ...trainee, schoolName: value })} />
          <Input label="Course" value={trainee.course} onChange={(value) => setTrainee({ ...trainee, course: value })} />
          <Input label="Date of birth" value={trainee.dateOfBirth} onChange={(value) => setTrainee({ ...trainee, dateOfBirth: value })} type="date" />
          <Input label="Email" value={trainee.email} onChange={(value) => setTrainee({ ...trainee, email: value })} type="email" />
          <Input label="Batch" value={trainee.batchName} onChange={(value) => setTrainee({ ...trainee, batchName: value })} />
          <Input label="Hours" value={String(trainee.totalHours)} onChange={(value) => setTrainee({ ...trainee, totalHours: Number(value) || 0 })} type="number" />
          <Input label="Start date" value={trainee.startDate} onChange={(value) => setTrainee({ ...trainee, startDate: value })} type="date" />
          <Input label="End date" value={trainee.endDate} onChange={(value) => setTrainee({ ...trainee, endDate: value })} type="date" />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/45">Status</span>
            <select value={trainee.status} onChange={(event) => setTrainee({ ...trainee, status: event.target.value as OjtStatus })} className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
            <ImagePlus className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <span className="min-w-0 text-sm font-semibold text-foreground" style={adminClampStyle(1)}>
              {photoFile ? photoFile.name : 'Replace OJT photo'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground/65">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={isSaving} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
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

function getAdminEventPhotos(album: EventAlbum) {
  return [...(album.event_photos ?? [])]
    .filter((photo) => photo.public_url)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function adminClampStyle(lines: number) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } as const;
}

function buildDailyTrend(visits: PageVisit[]) {
  const days = new Map<string, number>();

  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    days.set(date.toISOString().slice(0, 10), 0);
  }

  visits.forEach((visit) => {
    const key = new Date(visit.visited_at).toISOString().slice(0, 10);
    if (days.has(key)) {
      days.set(key, (days.get(key) ?? 0) + 1);
    }
  });

  return Array.from(days.entries()).map(([date, visitsCount]) => ({
    date: date.slice(5),
    visits: visitsCount,
  }));
}

function buildCountData(values: string[]) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const key = value || 'Unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function formatVisitLocation(visit: PageVisit) {
  const parts = [visit.city, visit.region, visit.country].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }
  return visit.timezone || 'Unknown';
}

function formatAdminDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TraineeTable({
  trainees,
  clinics,
  loggedHoursByTrainee,
  onView,
  onEdit,
  onDelete,
  deletingId,
  onComplete,
  onCertificate,
}: {
  trainees: Trainee[];
  clinics: Clinic[];
  loggedHoursByTrainee: Map<string, number>;
  onView: (trainee: Trainee) => void;
  onEdit: (trainee: Trainee) => void;
  onDelete: (trainee: Trainee) => void;
  deletingId: string | null;
  onComplete: (id: string) => void | Promise<void>;
  onCertificate: (trainee: Trainee) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1260px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-foreground/45">
          <tr>
            <th className="py-3 pr-4">Photo</th>
            <th className="py-3 pr-4">Name</th>
            <th className="py-3 pr-4">Clinic</th>
            <th className="py-3 pr-4">School</th>
            <th className="py-3 pr-4">Email</th>
            <th className="py-3 pr-4">Birth date</th>
            <th className="py-3 pr-4">Hours</th>
            <th className="py-3 pr-4">Rendered</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trainees.map((trainee) => (
            <tr key={trainee.id} className="border-b border-border/60">
              <td className="py-4 pr-4">
                <div className="h-12 w-12 overflow-hidden rounded-lg bg-secondary">
                  {trainee.photoUrl ? (
                    <img src={trainee.photoUrl} alt={trainee.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-foreground/35">
                      <Camera className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 pr-4 font-medium text-foreground">{trainee.fullName}</td>
              <td className="py-4 pr-4 text-foreground/60">{clinics.find((clinic) => clinic.id === trainee.clinicId)?.name ?? 'Clinic'}</td>
              <td className="py-4 pr-4 text-foreground/60">{trainee.schoolName}</td>
              <td className="py-4 pr-4 text-foreground/60">{trainee.email || '-'}</td>
              <td className="py-4 pr-4 text-foreground/60">{trainee.dateOfBirth || '-'}</td>
              <td className="py-4 pr-4 text-foreground/60">{trainee.totalHours}</td>
              <td className="py-4 pr-4 text-foreground/60">{(loggedHoursByTrainee.get(trainee.id) ?? 0).toFixed(2)}</td>
              <td className="py-4 pr-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trainee.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {trainee.status}
                </span>
              </td>
              <td className="py-4 pr-4">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onView(trainee)} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-foreground/65">
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button type="button" onClick={() => onEdit(trainee)} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-foreground/65">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  {trainee.status !== 'completed' && (
                    <button type="button" onClick={() => onComplete(trainee.id)} className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-foreground/65">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                    </button>
                  )}
                  <button type="button" onClick={() => onCertificate(trainee)} className="flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button type="button" onClick={() => onDelete(trainee)} disabled={deletingId === trainee.id} className="flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 className="h-3.5 w-3.5" /> {deletingId === trainee.id ? 'Deleting...' : 'Delete'}
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

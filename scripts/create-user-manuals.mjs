import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const baseUrl = process.env.MANUAL_BASE_URL ?? 'http://127.0.0.1:5174';
const outDir = path.join(root, 'docs', 'user-manuals');
const shotDir = path.join(outDir, 'screenshots');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const chrome = chromePaths.find((candidate) => existsSync(candidate));
if (!chrome) {
  throw new Error('Chrome or Edge was not found. Install one browser to generate the manuals.');
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Wait and retry.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Could not reach ${baseUrl}. Start the Vite dev server first.`);
}

async function chromeRun(args) {
  await execFileAsync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    ...args,
  ], { windowsHide: true, maxBuffer: 1024 * 1024 * 20 });
}

async function screenshot(name, route) {
  const filePath = path.join(shotDir, `${name}.png`);
  await chromeRun([
    '--window-size=1365,900',
    '--virtual-time-budget=10000',
    `--screenshot=${filePath}`,
    `${baseUrl}${route}`,
  ]);
  return `screenshots/${name}.png`;
}

function layout({ title, subtitle, audience, screenshotPath, sections }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #2c2520;
      background: #f7f4f0;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.55;
    }
    .page {
      background: white;
      border: 1px solid #e6ded6;
      border-radius: 10px;
      padding: 28px;
      min-height: calc(297mm - 32mm);
    }
    h1 {
      margin: 0;
      color: #4d3327;
      font-size: 30px;
      line-height: 1.15;
    }
    h2 {
      margin: 24px 0 8px;
      color: #4d3327;
      font-size: 19px;
      page-break-after: avoid;
    }
    h3 {
      margin: 18px 0 6px;
      color: #4d3327;
      font-size: 15px;
    }
    p { margin: 6px 0 10px; }
    .subtitle { color: #6f6259; font-size: 14px; margin-top: 8px; }
    .audience {
      display: inline-block;
      margin-top: 14px;
      padding: 7px 10px;
      border-radius: 999px;
      color: #6b3f2f;
      background: #f3e8df;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .screenshot {
      margin: 22px 0;
      border: 1px solid #ded4ca;
      border-radius: 8px;
      overflow: hidden;
      background: #f7f4f0;
      page-break-inside: avoid;
    }
    .screenshot img { display: block; width: 100%; }
    .caption { padding: 9px 12px; color: #6f6259; font-size: 12px; }
    ol { padding-left: 22px; }
    li { margin: 8px 0; }
    .box {
      margin: 14px 0;
      padding: 12px 14px;
      border-left: 4px solid #7d4c3b;
      background: #fbf7f3;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .simple {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 14px 0;
    }
    .tile {
      padding: 12px;
      border-radius: 8px;
      background: #f7f4f0;
      border: 1px solid #e6ded6;
      font-size: 13px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e6ded6;
      color: #8a7d73;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>${title}</h1>
    <p class="subtitle">${subtitle}</p>
    <span class="audience">${audience}</span>
    <div class="screenshot">
      <img src="${screenshotPath}" alt="${title} screenshot" />
      <div class="caption">Actual screenshot from the website.</div>
    </div>
    ${sections}
    <div class="footer">PSYZYGY Psychological Center Inc. user manual. Keep this guide near you while learning the system.</div>
  </div>
</body>
</html>`;
}

const clinicAdminSections = `
<div class="box"><strong>Big idea:</strong> The clinic admin keeps the OJT list clean. Think of it like a school notebook: add students, choose their school, check their hours, and approve time logs.</div>
<h2>1. How to Login</h2>
<ol>
  <li>Open the website and go to <strong>/admin</strong>.</li>
  <li>Type your admin email.</li>
  <li>Type your password.</li>
  <li>Click <strong>Login</strong>.</li>
</ol>
<h2>2. Where to Work on OJT</h2>
<p>After logging in, click the <strong>OJT</strong> button in the admin menu. You will see four small tabs.</p>
<div class="simple">
  <div class="tile"><strong>Manage OJT</strong><br />Add, search, edit, delete, and export students.</div>
  <div class="tile"><strong>Schools</strong><br />Add schools and coordinator details.</div>
  <div class="tile"><strong>Time Logs Review</strong><br />Approve, reject, or adjust hours.</div>
</div>
<h2>3. Add a School First</h2>
<ol>
  <li>Open the <strong>Schools</strong> tab.</li>
  <li>Type the school name.</li>
  <li>Type the coordinator name, email, phone, and address if you have them.</li>
  <li>Type a simple access code for the coordinator.</li>
  <li>Click <strong>Add School</strong>.</li>
</ol>
<div class="box"><strong>Easy rule:</strong> Add the school before adding the student. Then you can pick the school from a list.</div>
<h2>4. Add an OJT Student</h2>
<ol>
  <li>Open <strong>Manage OJT</strong>.</li>
  <li>Click <strong>Add</strong>.</li>
  <li>Type the student name.</li>
  <li>Select the school from the dropdown.</li>
  <li>Fill in course, birthday, email, required hours, start date, and end date.</li>
  <li>Click <strong>Add OJT</strong>.</li>
</ol>
<h2>5. Review Time Logs</h2>
<ol>
  <li>Open <strong>Time Logs Review</strong>.</li>
  <li>Read the student name, date, time in, time out, and notes.</li>
  <li>Click <strong>Approve</strong> if the time is okay.</li>
  <li>Click <strong>Adjust</strong> if the hours need fixing.</li>
  <li>Click <strong>Reject</strong> if the time should not count.</li>
</ol>
<h2>6. Check History</h2>
<p>Open <strong>Activity Logs</strong> to see what was created, approved, rejected, or adjusted.</p>`;

const coordinatorSections = `
<div class="box"><strong>Big idea:</strong> The coordinator portal lets a school coordinator check only their own students.</div>
<h2>1. What You Need</h2>
<ol>
  <li>Your coordinator email.</li>
  <li>Your access code from the clinic admin.</li>
  <li>The page link: <strong>/ojtcoordinator</strong>.</li>
</ol>
<h2>2. How to Login</h2>
<ol>
  <li>Open <strong>/ojtcoordinator</strong>.</li>
  <li>Type your coordinator email.</li>
  <li>Type your access code.</li>
  <li>Click <strong>Login</strong>.</li>
</ol>
<h2>3. What You Can See</h2>
<div class="simple">
  <div class="tile"><strong>Students</strong><br />How many OJT students are linked to your school.</div>
  <div class="tile"><strong>Rendered Hours</strong><br />Hours already approved by the clinic.</div>
  <div class="tile"><strong>Pending Logs</strong><br />Logs waiting for clinic review.</div>
</div>
<h2>4. Find a Student</h2>
<ol>
  <li>Use the search box.</li>
  <li>Type the student's name, course, email, or status.</li>
  <li>The list will show matching students.</li>
</ol>
<h2>5. Read the Student Status</h2>
<ol>
  <li><strong>Active</strong> means the student is still doing OJT.</li>
  <li><strong>Completed</strong> means the student has finished.</li>
  <li><strong>Withdrawn</strong> means the student stopped.</li>
</ol>
<div class="box"><strong>Remember:</strong> Coordinators can view status only. If something is wrong, contact the clinic admin.</div>`;

const ojtSections = `
<div class="box"><strong>Big idea:</strong> The OJT portal is your time card. You use it to time in, time out, and check your approved hours.</div>
<h2>1. How to Login</h2>
<ol>
  <li>Open <strong>/ojt</strong>.</li>
  <li>Type your registered OJT email.</li>
  <li>Choose your date of birth.</li>
  <li>Click <strong>Login</strong>.</li>
</ol>
<h2>2. Time In</h2>
<ol>
  <li>Login first.</li>
  <li>Click <strong>Time In</strong> when you start OJT for the day.</li>
  <li>Do not click it many times. One open time log is enough.</li>
</ol>
<h2>3. Time Out</h2>
<ol>
  <li>When you finish, write your notes for the day.</li>
  <li>Click <strong>Time Out</strong>.</li>
  <li>Your time will be sent to admin for approval.</li>
</ol>
<h2>4. Understand Your Hours</h2>
<div class="simple">
  <div class="tile"><strong>Pending</strong><br />Waiting for admin to check.</div>
  <div class="tile"><strong>Approved</strong><br />Counts in your rendered hours.</div>
  <div class="tile"><strong>Rejected</strong><br />Does not count.</div>
</div>
<h2>5. If Something Looks Wrong</h2>
<ol>
  <li>Do not panic.</li>
  <li>Tell your clinic admin or supervisor.</li>
  <li>Give the date and what happened.</li>
</ol>`;

async function main() {
  await mkdir(shotDir, { recursive: true });
  await waitForServer();

  const adminShot = await screenshot('clinic-admin-login', '/admin');
  const coordinatorShot = await screenshot('ojt-coordinator-login', '/ojtcoordinator');
  const ojtShot = await screenshot('ojt-student-login', '/ojt');

  const manuals = [
    {
      slug: 'clinic-admin-user-manual',
      title: 'Clinic Admin User Manual',
      subtitle: 'A simple guide for managing OJT students, schools, time logs, and activity history.',
      audience: 'For clinic admins',
      screenshotPath: adminShot,
      sections: clinicAdminSections,
    },
    {
      slug: 'ojt-coordinator-user-manual',
      title: 'OJT Coordinator User Manual',
      subtitle: 'A simple guide for school coordinators who need to check student OJT status.',
      audience: 'For school coordinators',
      screenshotPath: coordinatorShot,
      sections: coordinatorSections,
    },
    {
      slug: 'ojt-student-user-manual',
      title: 'OJT Student User Manual',
      subtitle: 'A simple guide for students who need to time in, time out, and check hours.',
      audience: 'For OJT students',
      screenshotPath: ojtShot,
      sections: ojtSections,
    },
  ];

  for (const manual of manuals) {
    const html = layout(manual);
    const htmlPath = path.join(outDir, `${manual.slug}.html`);
    const pdfPath = path.join(outDir, `${manual.slug}.pdf`);
    await writeFile(htmlPath, html, 'utf8');
    await chromeRun([
      '--print-to-pdf-no-header',
      `--print-to-pdf=${pdfPath}`,
      `file:///${htmlPath.replace(/\\/g, '/')}`,
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

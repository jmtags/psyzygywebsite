import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const baseUrl = process.env.POSTER_BASE_URL ?? 'http://127.0.0.1:5175';
const outDir = path.join(root, 'docs', 'marketing-posters', 'ojt-portals');
const shotDir = path.join(outDir, 'screenshots');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const chrome = chromePaths.find((candidate) => existsSync(candidate));
if (!chrome) {
  throw new Error('Chrome or Edge was not found. Install one browser to generate the posters.');
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

async function screenshotRoute(name, route) {
  const filePath = path.join(shotDir, `${name}.png`);
  await chromeRun([
    '--window-size=1365,900',
    '--virtual-time-budget=10000',
    `--screenshot=${filePath}`,
    `${baseUrl}${route}`,
  ]);
  return `screenshots/${name}.png`;
}

function posterPage({ title, subtitle, eyebrow, screenshot, badge, points, cta, accent = '#7d4c3b' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: 1080px 1350px; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1080px; height: 1350px; }
    body {
      background: #efe8df;
      color: #2c2520;
      font-family: Arial, Helvetica, sans-serif;
    }
    .poster {
      position: relative;
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      background:
        linear-gradient(135deg, rgba(255,255,255,0.95), rgba(247,244,240,0.86) 45%, rgba(235,224,214,0.92)),
        radial-gradient(circle at 86% 14%, rgba(125,76,59,0.16), transparent 30%);
      padding: 72px;
    }
    .topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 44px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: ${accent};
    }
    .badge {
      border: 2px solid rgba(125,76,59,0.18);
      border-radius: 999px;
      padding: 14px 22px;
      color: ${accent};
      background: rgba(255,255,255,0.68);
      font-size: 18px;
      font-weight: 800;
    }
    .hero {
      display: grid;
      grid-template-columns: 1fr;
      gap: 36px;
    }
    .eyebrow {
      color: ${accent};
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    h1 {
      margin: 0;
      max-width: 850px;
      color: #241a15;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 68px;
      line-height: 1.02;
      font-weight: 400;
      letter-spacing: -0.01em;
    }
    .subtitle {
      margin: 26px 0 0;
      max-width: 720px;
      color: rgba(44,37,32,0.72);
      font-size: 26px;
      line-height: 1.35;
    }
    .mockup-wrap {
      position: relative;
      margin-top: 8px;
      display: grid;
      grid-template-columns: 1fr 0.64fr;
      gap: 28px;
      align-items: end;
    }
    .device {
      border: 16px solid #2c2520;
      border-radius: 34px;
      background: #2c2520;
      box-shadow: 0 28px 80px rgba(44,37,32,0.2);
      overflow: hidden;
    }
    .device.main { height: 360px; }
    .device.side { height: 280px; transform: translateY(24px); opacity: 0.96; }
    .device img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      display: block;
      border-radius: 18px;
    }
    .points {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 54px;
    }
    .point {
      min-height: 132px;
      padding: 20px;
      border: 1px solid rgba(125,76,59,0.16);
      border-radius: 18px;
      background: rgba(255,255,255,0.75);
    }
    .point strong {
      display: block;
      color: #241a15;
      font-size: 19px;
      margin-bottom: 10px;
    }
    .point span {
      color: rgba(44,37,32,0.66);
      font-size: 16px;
      line-height: 1.35;
    }
    .cta {
      position: absolute;
      left: 72px;
      right: 72px;
      bottom: 50px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      border-top: 2px solid rgba(125,76,59,0.16);
      padding-top: 28px;
    }
    .cta-text {
      color: #241a15;
      font-size: 27px;
      font-weight: 800;
    }
    .cta-sub {
      margin-top: 6px;
      color: rgba(44,37,32,0.6);
      font-size: 18px;
    }
    .pill {
      flex: 0 0 auto;
      border-radius: 999px;
      background: ${accent};
      color: white;
      padding: 18px 26px;
      font-size: 20px;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <main class="poster">
    <div class="topline">
      <div class="brand">PSYZYGY</div>
      <div class="badge">${badge}</div>
    </div>
    <section class="hero">
      <div>
        <div class="eyebrow">${eyebrow}</div>
        <h1>${title}</h1>
        <p class="subtitle">${subtitle}</p>
      </div>
      <div class="mockup-wrap">
        <div class="device main"><img src="${screenshot}" alt="Portal screenshot" /></div>
        <div class="device side"><img src="${screenshot}" alt="Portal screenshot" /></div>
      </div>
    </section>
    <section class="points">
      ${points.map((point) => `<div class="point"><strong>${point.title}</strong><span>${point.text}</span></div>`).join('')}
    </section>
    <section class="cta">
      <div>
        <div class="cta-text">${cta.title}</div>
        <div class="cta-sub">${cta.text}</div>
      </div>
      <div class="pill">Message Us</div>
    </section>
  </main>
</body>
</html>`;
}

async function exportPoster(slug, html) {
  const htmlPath = path.join(outDir, `${slug}.html`);
  const pngPath = path.join(outDir, `${slug}.png`);
  const pdfPath = path.join(outDir, `${slug}.pdf`);
  await writeFile(htmlPath, html, 'utf8');
  const url = `file:///${htmlPath.replace(/\\/g, '/')}`;
  await chromeRun([
    '--window-size=1080,1350',
    '--force-device-scale-factor=1',
    `--screenshot=${pngPath}`,
    url,
  ]);
  await chromeRun([
    '--print-to-pdf-no-header',
    `--print-to-pdf=${pdfPath}`,
    url,
  ]);
}

async function main() {
  await mkdir(shotDir, { recursive: true });
  await waitForServer();

  const studentShot = await screenshotRoute('ojt-student-portal', '/ojt');
  const coordinatorShot = await screenshotRoute('ojt-coordinator-portal', '/ojtcoordinator');

  const posters = [
    {
      slug: 'ojt-student-portal-poster',
      screenshot: studentShot,
      eyebrow: 'For OJT Students',
      badge: 'OJT Portal',
      title: 'Track your OJT hours with ease.',
      subtitle: 'Time in, time out, add daily notes, and see approved rendered hours in one simple student portal.',
      points: [
        { title: 'Simple login', text: 'Students use their registered email and date of birth.' },
        { title: 'Daily time logs', text: 'Record time in, time out, and notes for the day.' },
        { title: 'Progress view', text: 'Approved hours count toward the required OJT total.' },
      ],
      cta: { title: 'OJT inquiries are welcome.', text: 'Schools and students may contact any PSYZYGY branch.' },
    },
    {
      slug: 'ojt-coordinator-portal-poster',
      screenshot: coordinatorShot,
      eyebrow: 'For School Coordinators',
      badge: 'Coordinator Portal',
      title: 'Monitor your students online.',
      subtitle: 'School coordinators can check student status, rendered hours, pending logs, and progress anytime.',
      points: [
        { title: 'Student overview', text: 'See linked OJT students from your school in one dashboard.' },
        { title: 'Smart filters', text: 'Filter by status, course, progress, and pending logs.' },
        { title: 'Download reports', text: 'Export the visible student list for easy school monitoring.' },
      ],
      cta: { title: 'Partner with a clinic that keeps coordinators informed.', text: 'Message us for OJT placement inquiries.' },
    },
    {
      slug: 'ojt-system-poster',
      screenshot: coordinatorShot,
      eyebrow: 'For Schools and Students',
      badge: 'OJT System',
      title: 'A smoother OJT experience for everyone.',
      subtitle: 'PSYZYGY welcomes OJT partnerships and supports students, schools, and clinic admins with an organized tracking system.',
      points: [
        { title: 'Students log hours', text: 'OJT trainees submit daily time logs from their own portal.' },
        { title: 'Admins review logs', text: 'Clinic admins approve, adjust, or reject submitted time.' },
        { title: 'Coordinators monitor', text: 'Schools can follow student status and progress online.' },
      ],
      cta: { title: 'Now welcoming OJT inquiries.', text: 'Schools and students can message us to learn more.' },
    },
  ];

  for (const poster of posters) {
    await exportPoster(poster.slug, posterPage(poster));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

require('dotenv').config();
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

let poolConfig = undefined;
if (process.env.DATABASE_URL) {
  const urlString = process.env.DATABASE_URL.trim();
  const parsed = new URL(urlString);
  poolConfig = {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.substring(1),
    ssl: parsed.searchParams.get('sslaccept') === 'strict' ? { rejectUnauthorized: false } : undefined,
    connectionLimit: 5
  };
}

const adapter = new PrismaMariaDb(poolConfig);
const prisma = new PrismaClient({ adapter });

async function seedDefaults() {
  console.log("Seeding default SiteContent into TiDB...");

  const defaults = [
    {
      key: "call_for_papers",
      value: {
        volume: "12",
        issue: "2",
        submissionDeadline: "2025-03-31",
        reviewNotification: "Within 4-6 weeks",
        publication: "2025-06-30",
        indianAmount: 5000,
        internationalAmount: 50,
        announcementTitle: "📢 Submissions Now Open",
        announcementText: "IJEEQT invites original research manuscripts for Volume 12, Issue 2.",
        importantDates: []
      }
    },
    {
      key: "indexing_abstracting",
      value: [
        "Scopus",
        "Web of Science",
        "DOAJ",
        "CrossRef",
        "Google Scholar",
        "PubMed"
      ]
    },
    {
      key: "editorial_board",
      value: {
        "Editor-in-Chief": [
          {
            "name": "Prof. Dr. Rajesh Kumar",
            "email": "editor@ijart.org",
            "institution": "IIT Delhi",
            "country": "India",
            "specialization": "AI"
          }
        ]
      }
    },
    {
      key: "contacts",
      value: [
        { "icon": "📧", "label": "Editorial Email", "value": "editor@ijart.org" },
        { "icon": "📧", "label": "Submissions", "value": "submit@ijart.org" },
        { "icon": "📞", "label": "Phone", "value": "+91 8072287692" },
        { "icon": "📍", "label": "Address", "value": "Academic Research Press" }
      ]
    }
  ];

  for (const item of defaults) {
    try {
      await prisma.siteContent.upsert({
        where: { key: item.key },
        update: {}, // Don't overwrite if it already exists
        create: {
          key: item.key,
          value: item.value
        }
      });
      console.log(`Successfully seeded ${item.key}`);
    } catch (error) {
      console.error(`Failed to seed ${item.key}:`, error);
    }
  }

  // HeaderLayout default
  try {
    await prisma.headerLayout.upsert({
      where: { journalName: "IJEEQT" },
      update: {},
      create: {
        journalName: "IJEEQT",
        layout: []
      }
    });
    console.log(`Successfully seeded default HeaderLayout for IJEEQT`);
  } catch(error) {
    console.error(`Failed to seed HeaderLayout:`, error);
  }

  await prisma.$disconnect();
  console.log("Seeding complete!");
}

seedDefaults();

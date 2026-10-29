// Creates (or recreates) a demo user and portfolio for local development.
// Sign in as demo@profyle.local with an email code (read it in Mailpit at http://localhost:8025).
import { eq } from "drizzle-orm";

try {
  process.loadEnvFile();
} catch {}

const { db } = await import("@/server/db");
const { item, link, profile, section, user } = await import("@/server/db/schema");

const DEMO_EMAIL = "demo@profyle.local";

await db.transaction(async (tx) => {
  await tx.delete(user).where(eq(user.email, DEMO_EMAIL));

  const [demoUser] = await tx
    .insert(user)
    .values({ id: crypto.randomUUID(), name: "Demo User", email: DEMO_EMAIL, emailVerified: true })
    .returning();

  const [demo] = await tx
    .insert(profile)
    .values({
      userId: demoUser.id,
      handle: "demo",
      displayName: "Demo User",
      headline: "Full-stack developer",
      bio: "I build small, fast web apps.\nCurrently studying computer science.",
      location: "Toronto, Canada",
    })
    .returning();

  await tx.insert(link).values([
    { profileId: demo.id, kind: "github", url: "https://github.com/demo", position: 0 },
    { profileId: demo.id, kind: "linkedin", url: "https://www.linkedin.com/in/demo", position: 1 },
    { profileId: demo.id, kind: "email", url: "mailto:demo@profyle.local", position: 2 },
  ]);

  const sections = await tx
    .insert(section)
    .values([
      { profileId: demo.id, type: "projects", title: "Projects", position: 0 },
      { profileId: demo.id, type: "experience", title: "Experience", position: 1 },
      { profileId: demo.id, type: "education", title: "Education", position: 2 },
      { profileId: demo.id, type: "skills", title: "Skills", position: 3 },
    ] as const)
    .returning();
  const sectionId = (type: (typeof sections)[number]["type"]) =>
    sections.find((s) => s.type === type)!.id;

  await tx.insert(item).values([
    {
      sectionId: sectionId("projects"),
      title: "Trailhead",
      subtitle: "Offline-first hiking log",
      description: "A PWA that records routes without a signal and syncs when you're back online.",
      url: "https://example.com/trailhead",
      sourceUrl: "https://github.com/demo/trailhead",
      position: 0,
    },
    {
      sectionId: sectionId("projects"),
      title: "Ledgerly",
      subtitle: "Shared expenses for roommates",
      description: "Split bills, settle up, and export a monthly summary.",
      sourceUrl: "https://github.com/demo/ledgerly",
      position: 1,
    },
    {
      sectionId: sectionId("experience"),
      title: "Software Engineering Intern",
      subtitle: "Northwind",
      description: "Built internal dashboards in React and TypeScript.",
      startDate: "2025-05-01",
      endDate: "2025-08-01",
      position: 0,
    },
    {
      sectionId: sectionId("experience"),
      title: "Teaching Assistant",
      subtitle: "University of Toronto",
      startDate: "2025-09-01",
      position: 1,
    },
    {
      sectionId: sectionId("education"),
      title: "University of Toronto",
      subtitle: "BSc Computer Science",
      startDate: "2023-09-01",
      endDate: "2027-04-01",
      position: 0,
    },
    ...["TypeScript", "React", "Next.js", "PostgreSQL", "Docker", "Python"].map((name, i) => ({
      sectionId: sectionId("skills"),
      title: name,
      position: i,
    })),
  ]);
});

console.log(`Seeded demo portfolio: handle "demo", sign in as ${DEMO_EMAIL}`);
await db.$client.end();

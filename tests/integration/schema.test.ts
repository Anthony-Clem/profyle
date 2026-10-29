import { count, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { handleHold, profile, profileVersion, user } from "@/server/db/schema";

async function createLiveProfile() {
  await db.insert(user).values({ id: "user-a", name: "A", email: "a@example.com" });
  const [created] = await db
    .insert(profile)
    .values({ userId: "user-a", handle: "anthony", displayName: "A" })
    .returning();
  const [version] = await db
    .insert(profileVersion)
    .values({ profileId: created.id, snapshot: {} })
    .returning();
  await db
    .update(profile)
    .set({ liveVersionId: version.id, isLive: true })
    .where(eq(profile.id, created.id));
  await db.insert(handleHold).values({
    handle: "old-handle",
    profileId: created.id,
    heldUntil: new Date(Date.now() + 14 * 86_400_000),
  });
  return created;
}

describe("schema", () => {
  it("cascades a user delete to the profile, versions, and holds", async () => {
    await createLiveProfile();

    await db.delete(user).where(eq(user.id, "user-a"));

    for (const table of [profile, profileVersion, handleHold]) {
      const [{ value }] = await db.select({ value: count() }).from(table);
      expect(value).toBe(0);
    }
  });

  it("rejects a live profile without a live version", async () => {
    await db.insert(user).values({ id: "user-b", name: "B", email: "b@example.com" });

    await expect(
      db.insert(profile).values({ userId: "user-b", handle: "bee", displayName: "B", isLive: true }),
    ).rejects.toThrow();
  });

  it("rejects a handle that breaks the format rules", async () => {
    await db.insert(user).values({ id: "user-c", name: "C", email: "c@example.com" });

    await expect(
      db.insert(profile).values({ userId: "user-c", handle: "Bad--Handle", displayName: "C" }),
    ).rejects.toThrow();
  });
});

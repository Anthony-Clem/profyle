import { z } from "zod";

// NEXT_PUBLIC_* vars are inlined at build time, so each must be referenced literally.
export const publicEnv = z
  .object({
    rootDomain: z.string().min(1),
    s3PublicUrl: z.url(),
  })
  .parse({
    rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    s3PublicUrl: process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
  });

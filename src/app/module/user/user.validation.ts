// model User {
//     id            String         @id @default(uuid())
//     name          String
//     email         String         @unique
//     password      String
//     role          Role           @default(USER)
//     reviews       Review[]
//     likes         Like[]
//     comments      Comment[]
//     watchlist     Watchlist[]
//     subscriptions Subscription[]

//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt

//     @@index([email], name: "idx_user_email")
//     @@map("users")
// }

// enum Role {
//     USER
//     ADMIN
// }

import z from 'zod';

export const createUserZodSchema = z.object({
  name: z
    .string('Name is required')
    .min(5, 'Name must be at least 5 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.email('Invalid email address'),
  password: z
    .string('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(20, 'Password must be at most 20 characters'),
});

export const loginUserZodSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string('Password is required'),
});

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

export interface ICreateUserPayload {
  name: string;
  email: string;
  password: string;
}

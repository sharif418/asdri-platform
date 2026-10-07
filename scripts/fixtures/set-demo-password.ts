import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
const email = process.argv[2];
const password = process.argv[3];
await db.user.update({ where: { email }, data: { passwordHash: hashPassword(password) } });
console.log("password set for", email);
process.exit(0);

import "dotenv/config";

import { sql } from "drizzle-orm";

import db from "@/db";

async function main() {
  const users = await db.execute(
    sql.raw(
      "select id, user_id, name, role, created_at from users order by id"
    )
  );

  console.log(JSON.stringify(users.rows, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

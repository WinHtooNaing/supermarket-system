import "dotenv/config";

import { sql } from "drizzle-orm";

import db from "@/db";

async function main() {
  const columns = await db.execute(
    sql.raw(
      "select table_name, column_name, data_type, is_nullable " +
        "from information_schema.columns " +
        "where table_schema = 'public' " +
        "order by table_name, ordinal_position"
    )
  );

  console.log(JSON.stringify(columns.rows, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

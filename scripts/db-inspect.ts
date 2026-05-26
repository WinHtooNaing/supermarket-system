import "dotenv/config";

import { sql } from "drizzle-orm";

import db from "@/db";

async function main() {
  const tables = await db.execute(
    sql.raw(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
    )
  );

  const counts = await db.execute(
    sql.raw(
      "select 'users' as table_name, count(*)::int as count from users union all " +
        "select 'categories', count(*)::int from categories union all " +
        "select 'products', count(*)::int from products union all " +
        "select 'sales', count(*)::int from sales union all " +
        "select 'sale_items', count(*)::int from sale_items"
    )
  );

  console.log(
    JSON.stringify(
      {
        tables: tables.rows,
        counts: counts.rows,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

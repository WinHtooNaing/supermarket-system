import "dotenv/config";

import { getPosBootstrapData } from "@/server/pos-data";

async function main() {
  const data = await getPosBootstrapData();

  console.log(
    JSON.stringify(
      {
        users: data.users.length,
        categories: data.categories.length,
        products: data.products.length,
        sales: data.sales.length,
        sampleUser: data.users[0]?.userId,
        sampleProduct: data.products[0]?.name,
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

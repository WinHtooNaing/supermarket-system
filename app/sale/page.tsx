"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Trash2 } from "lucide-react";

import {
  clearSession,
  readSession,
  type SessionUser,
} from "@/lib/auth-session";
import { BarcodeLabel } from "@/components/barcode-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
};

type CartItem = Product & {
  qty: number;
};

const products: Product[] = [
  {
    id: 1,
    name: "Coke 325ml",
    price: 1500,
    stock: 24,
    barcode: "8801111111111",
  },
  {
    id: 2,
    name: "White Bread",
    price: 2200,
    stock: 18,
    barcode: "8802222222222",
  },
  {
    id: 3,
    name: "Potato Chips",
    price: 1200,
    stock: 40,
    barcode: "8803333333333",
  },
  {
    id: 4,
    name: "Mineral Water",
    price: 800,
    stock: 52,
    barcode: "8804444444444",
  },
  {
    id: 5,
    name: "Instant Coffee",
    price: 3200,
    stock: 11,
    barcode: "8805555555555",
  },
  {
    id: 6,
    name: "Chocolate Bar",
    price: 1000,
    stock: 28,
    barcode: "8806666666666",
  },
];

export default function SalePage() {
  const router = useRouter();
  const [session] = useState<SessionUser | null>(() => readSession());
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
      return;
    }

    if (session.role !== "seller") {
      router.replace("/admin/dashboard");
    }
  }, [router, session]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.barcode.includes(keyword),
    );
  }, [search]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  );

  const totalQty = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart],
  );
  const change = Math.max(payment - subtotal, 0);
  const canCheckout = cart.length > 0 && payment >= subtotal;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.qty < item.stock
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(id: number, qty: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const nextQty = Math.max(1, Math.min(qty, item.stock));
          return { ...item, qty: nextQty };
        })
        .filter((item) => item.qty > 0),
    );
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function handleCheckout() {
    if (!canCheckout) return;
    setCart([]);
    setPayment(0);
  }

  function handleLogout() {
    clearSession();
    router.replace("/auth");
  }

  if (!session) {
    return <div className="p-6">Checking session...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Cashier</p>
              <h1 className="text-2xl font-bold">Supermarket Sale Counter</h1>
              <p className="text-sm text-muted-foreground">
                Logged in as {session.name} ({session.userId})
              </p>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-4" />
                Product Catalog
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search by product name or barcode"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    className="rounded-lg border bg-card p-3 text-left transition hover:border-primary"
                    onClick={() => addToCart(product)}
                    type="button"
                  >
                    <p className="font-semibold">{product.name}</p>
                    <div className="mt-2">
                      <BarcodeLabel
                        value={product.barcode}
                        showValue={false}
                        className="p-1"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Barcode: {product.barcode}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="secondary">Stock {product.stock}</Badge>
                      <p className="font-bold">{product.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-4" />
                Cart ({totalQty})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.qty}
                          onChange={(e) =>
                            updateQty(item.id, Number(e.target.value || 1))
                          }
                          className="h-8 w-16"
                        />
                      </TableCell>
                      <TableCell>{item.qty * item.price}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!cart.length && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No items in cart.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="space-y-2 rounded-md border p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{subtotal}</span>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="payment">
                    Payment
                  </label>
                  <Input
                    id="payment"
                    type="number"
                    min={0}
                    value={payment}
                    onChange={(e) => setPayment(Number(e.target.value || 0))}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Change</span>
                  <span className="font-semibold">{change}</span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!canCheckout}
                onClick={handleCheckout}
              >
                Complete Sale
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Search, ShoppingCart, Trash2 } from "lucide-react";

// import {
//   clearSession,
//   readSession,
//   type SessionUser,
// } from "@/lib/auth-session";
// import { BarcodeLabel } from "@/components/barcode-label";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// type Product = {
//   id: number;
//   name: string;
//   price: number;
//   stock: number;
//   barcode: string;
// };

// type CartItem = Product & {
//   qty: number;
// };

// const products: Product[] = [
//   {
//     id: 1,
//     name: "Coke 325ml",
//     price: 1500,
//     stock: 24,
//     barcode: "8801111111111",
//   },
//   {
//     id: 2,
//     name: "White Bread",
//     price: 2200,
//     stock: 18,
//     barcode: "8802222222222",
//   },
//   {
//     id: 3,
//     name: "Potato Chips",
//     price: 1200,
//     stock: 40,
//     barcode: "8803333333333",
//   },
//   {
//     id: 4,
//     name: "Mineral Water",
//     price: 800,
//     stock: 52,
//     barcode: "8804444444444",
//   },
//   {
//     id: 5,
//     name: "Instant Coffee",
//     price: 3200,
//     stock: 11,
//     barcode: "8805555555555",
//   },
//   {
//     id: 6,
//     name: "Chocolate Bar",
//     price: 1000,
//     stock: 28,
//     barcode: "8806666666666",
//   },
// ];

// export default function SalePage() {
//   const router = useRouter();
//   const barcodeRef = useRef<HTMLInputElement>(null);

//   const [session] = useState<SessionUser | null>(() => readSession());
//   const [search, setSearch] = useState("");
//   const [payment, setPayment] = useState<number>(0);
//   const [cart, setCart] = useState<CartItem[]>([]);

//   useEffect(() => {
//     if (!session) {
//       router.replace("/auth");
//       return;
//     }

//     if (session.role !== "seller") {
//       router.replace("/admin/dashboard");
//     }
//   }, [router, session]);

//   // 🔥 Auto focus barcode input
//   useEffect(() => {
//     barcodeRef.current?.focus();
//   }, []);

//   const filteredProducts = useMemo(() => {
//     const keyword = search.trim().toLowerCase();
//     if (!keyword) return products;

//     return products.filter(
//       (product) =>
//         product.name.toLowerCase().includes(keyword) ||
//         product.barcode.includes(keyword),
//     );
//   }, [search]);

//   const subtotal = useMemo(
//     () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
//     [cart],
//   );

//   const totalQty = useMemo(
//     () => cart.reduce((sum, item) => sum + item.qty, 0),
//     [cart],
//   );

//   const change = Math.max(payment - subtotal, 0);
//   const canCheckout = cart.length > 0 && payment >= subtotal;

//   // 🔥 Add to cart
//   function addToCart(product: Product) {
//     setCart((prev) => {
//       const existing = prev.find((item) => item.id === product.id);

//       if (existing) {
//         return prev.map((item) =>
//           item.id === product.id && item.qty < item.stock
//             ? { ...item, qty: item.qty + 1 }
//             : item,
//         );
//       }

//       return [...prev, { ...product, qty: 1 }];
//     });
//   }

//   // 🔥 Barcode scan
//   function handleScan(barcode: string) {
//     const product = products.find((p) => p.barcode === barcode);

//     if (!product) {
//       alert("❌ Product not found");
//       return;
//     }

//     addToCart(product);
//   }

//   // 🔥 Update qty
//   function updateQty(id: number, qty: number) {
//     setCart((prev) =>
//       prev
//         .map((item) => {
//           if (item.id !== id) return item;
//           const nextQty = Math.max(1, Math.min(qty, item.stock));
//           return { ...item, qty: nextQty };
//         })
//         .filter((item) => item.qty > 0),
//     );
//   }

//   function removeItem(id: number) {
//     setCart((prev) => prev.filter((item) => item.id !== id));
//   }

//   function handleCheckout() {
//     if (!canCheckout) return;

//     alert(`
// 🧾 Receipt
// Total: ${subtotal}
// Paid: ${payment}
// Change: ${change}
//     `);

//     setCart([]);
//     setPayment(0);
//     barcodeRef.current?.focus();
//   }

//   function handleLogout() {
//     clearSession();
//     router.replace("/auth");
//   }

//   if (!session) {
//     return <div className="p-6">Checking session...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-muted/30 p-4 md:p-6">
//       <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
//         {/* HEADER */}
//         <Card>
//           <CardContent className="flex justify-between p-4">
//             <div>
//               <h1 className="text-2xl font-bold">🛒 POS Sale Counter</h1>
//               <p className="text-sm text-muted-foreground">
//                 {session.name} ({session.userId})
//               </p>
//             </div>
//             <Button variant="destructive" onClick={handleLogout}>
//               Logout
//             </Button>
//           </CardContent>
//         </Card>

//         {/* MAIN */}
//         <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
//           {/* LEFT - PRODUCTS */}
//           <Card className="lg:col-span-2">
//             <CardHeader>
//               <CardTitle>Products</CardTitle>
//             </CardHeader>

//             <CardContent className="space-y-4">
//               {/* 🔥 BARCODE INPUT */}
//               <Input
//                 ref={barcodeRef}
//                 placeholder="🔍 Scan barcode..."
//                 className="h-12 text-lg"
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleScan(e.currentTarget.value);
//                     e.currentTarget.value = "";
//                   }
//                 }}
//               />

//               {/* SEARCH */}
//               <Input
//                 placeholder="Search product..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />

//               {/* PRODUCT GRID */}
//               <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
//                 {filteredProducts.map((product) => (
//                   <button
//                     key={product.id}
//                     className="rounded-lg border p-3 hover:border-primary"
//                     onClick={() => addToCart(product)}
//                   >
//                     <p className="font-semibold">{product.name}</p>
//                     <Badge>Stock {product.stock}</Badge>
//                     <p className="font-bold mt-2">{product.price}</p>
//                   </button>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* RIGHT - CART */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Cart ({totalQty})</CardTitle>
//             </CardHeader>

//             <CardContent className="space-y-4">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Item</TableHead>
//                     <TableHead>Qty</TableHead>
//                     <TableHead>Total</TableHead>
//                     <TableHead></TableHead>
//                   </TableRow>
//                 </TableHeader>

//                 <TableBody>
//                   {cart.map((item) => (
//                     <TableRow key={item.id}>
//                       <TableCell>{item.name}</TableCell>

//                       <TableCell>
//                         <div className="flex items-center gap-2">
//                           <Button
//                             size="icon"
//                             onClick={() => updateQty(item.id, item.qty - 1)}
//                           >
//                             -
//                           </Button>
//                           <span>{item.qty}</span>
//                           <Button
//                             size="icon"
//                             onClick={() => updateQty(item.id, item.qty + 1)}
//                           >
//                             +
//                           </Button>
//                         </div>
//                       </TableCell>

//                       <TableCell>{item.qty * item.price}</TableCell>

//                       <TableCell>
//                         <Button
//                           size="icon"
//                           variant="ghost"
//                           onClick={() => removeItem(item.id)}
//                         >
//                           <Trash2 className="size-4" />
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   ))}

//                   {!cart.length && (
//                     <TableRow>
//                       <TableCell colSpan={4} className="text-center">
//                         No items
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>

//               {/* PAYMENT */}
//               <div className="space-y-2 border p-3 rounded">
//                 <div className="flex justify-between">
//                   <span>Subtotal</span>
//                   <span>{subtotal}</span>
//                 </div>

//                 <Input
//                   placeholder="Payment"
//                   type="number"
//                   value={payment}
//                   onChange={(e) => setPayment(Number(e.target.value))}
//                 />

//                 <div className="flex justify-between">
//                   <span>Change</span>
//                   <span>{change}</span>
//                 </div>
//               </div>

//               <Button
//                 className="w-full"
//                 disabled={!canCheckout}
//                 onClick={handleCheckout}
//               >
//                 Complete Sale
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

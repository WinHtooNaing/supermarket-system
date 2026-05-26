"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Trash2 } from "lucide-react";

import {
  clearSession,
  readSession,
  type SessionUser,
} from "@/lib/auth-session";
import { BarcodeLabel } from "@/components/barcode-label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recordSale, usePosData } from "@/lib/pos-store";
import { toast } from "sonner";

type CartItem = {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  qty: number;
};

export default function SalePage() {
  const router = useRouter();
  const barcodeRef = useRef<HTMLInputElement>(null);
  const { products, sales, users, isLoading, error } = usePosData();
  const [session] = useState<SessionUser | null>(() => readSession());
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
      return;
    }

    if (session.role !== "seller") {
      router.replace("/admin/dashboard");
    }
  }, [router, session]);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const seller = users.find((user) => user.userId === session?.userId);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(keyword) ||
        product.barcode.includes(keyword)
    );
  }, [products, search]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const totalQty = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );
  const change = Math.max(payment - subtotal, 0);
  const canCheckout = cart.length > 0 && payment >= subtotal && Boolean(seller);

  const recentSales = useMemo(() => {
    if (!seller) return [];
    return sales.filter((sale) => sale.sellerId === seller.id).slice(0, 5);
  }, [sales, seller]);

  function addToCart(productId: number) {
    const liveProduct = products.find((product) => product.id === productId);
    if (!liveProduct || liveProduct.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === liveProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.id === liveProduct.id && item.qty < liveProduct.stock
            ? {
                ...item,
                qty: item.qty + 1,
                stock: liveProduct.stock,
                price: liveProduct.price,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: liveProduct.id,
          name: liveProduct.name,
          price: liveProduct.price,
          stock: liveProduct.stock,
          barcode: liveProduct.barcode,
          qty: 1,
        },
      ];
    });
  }

  function handleScan(barcode: string) {
    const product = products.find((item) => item.barcode === barcode.trim());
    if (!product) {
      const message = "Scanned barcode was not found.";
      setCheckoutMessage(message);
      toast.error(message);
      return;
    }

    if (product.stock <= 0) {
      const message = `${product.name} is out of stock.`;
      setCheckoutMessage(message);
      toast.error(message);
      return;
    }

    setCheckoutMessage("");
    addToCart(product.id);
  }

  function updateQty(id: number, qty: number) {
    const liveProduct = products.find((product) => product.id === id);

    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const maxStock = liveProduct?.stock ?? item.stock;
        const nextQty = Math.max(1, Math.min(qty, maxStock));
        return {
          ...item,
          qty: nextQty,
          stock: maxStock,
          price: liveProduct?.price ?? item.price,
        };
      })
    );
  }

  function removeItem(id: number) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleCheckout() {
    if (!canCheckout || !seller) return;

    try {
      setIsCheckingOut(true);
      const savedSale = await recordSale({
        sellerId: seller.id,
        paymentAmount: payment,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.qty,
          price: item.price,
        })),
      });

      setCheckoutMessage(
        `Sale #${savedSale.id} completed. Change: MMK ${savedSale.changeAmount.toLocaleString()}`
      );
      toast.success(`Sale #${savedSale.id} completed successfully.`);
      setCart([]);
      setPayment(0);
      barcodeRef.current?.focus();
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to complete sale.";
      setCheckoutMessage(message);
      toast.error(message);
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    clearSession();
    router.replace("/auth");
    router.refresh();
  }

  if (!session) {
    return <div className="p-6">Checking session...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-[420px] w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-[360px] w-full rounded-xl" />
              <Skeleton className="h-[220px] w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
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
              {error && <p className="text-sm text-destructive">{error}</p>}
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
                ref={barcodeRef}
                placeholder="Scan barcode and press Enter"
                className="h-11"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleScan(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />

              <Input
                placeholder="Search by product name or barcode"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    className="rounded-lg border bg-card p-3 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock <= 0}
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
                      <Badge
                        variant={
                          product.stock <= product.reorderLevel
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        Stock {product.stock}
                      </Badge>
                      <p className="font-bold">MMK {product.price.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
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
                        <TableCell>
                          MMK {(item.qty * item.price).toLocaleString()}
                        </TableCell>
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
                    <span className="font-semibold">
                      MMK {subtotal.toLocaleString()}
                    </span>
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
                    <span className="font-semibold">MMK {change.toLocaleString()}</span>
                  </div>
                </div>

                {checkoutMessage && (
                  <p className="text-sm text-muted-foreground">{checkoutMessage}</p>
                )}

                <Button
                  className="w-full"
                  disabled={!canCheckout || isCheckingOut}
                  onClick={() => void handleCheckout()}
                >
                  {isCheckingOut ? (
                    <>
                      <Spinner className="mr-2" />
                      Completing...
                    </>
                  ) : (
                    "Complete Sale"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Sale #{sale.id}</p>
                      <Badge variant="secondary">
                        MMK {sale.totalAmount.toLocaleString()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items sold
                    </p>
                  </div>
                ))}

                {!recentSales.length && (
                  <p className="text-sm text-muted-foreground">
                    No completed sales yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

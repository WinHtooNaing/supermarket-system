"use client";

import { useMemo } from "react";

import { PosPageSkeleton } from "@/components/pos-page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePosData } from "@/lib/pos-store";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function getStartOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export default function DashboardPage() {
  const { products, sales, users, isLoading, error } = usePosData();

  const metrics = useMemo(() => {
    const todayStart = getStartOfToday();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);

    const todaySales = sales.filter((sale) => new Date(sale.createdAt) >= todayStart);
    const currentMonthSales = sales.filter((sale) => {
      const date = new Date(sale.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    const previousMonthSales = sales.filter((sale) => {
      const date = new Date(sale.createdAt);
      return (
        date.getMonth() === previousMonthDate.getMonth() &&
        date.getFullYear() === previousMonthDate.getFullYear()
      );
    });

    const todayAmount = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const currentMonthAmount = currentMonthSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const previousMonthAmount = previousMonthSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const lowStockItems = products.filter(
      (product) => product.stock <= product.reorderLevel
    );

    return {
      todaySales,
      currentMonthSales,
      previousMonthAmount,
      todayAmount,
      currentMonthAmount,
      lowStockItems,
    };
  }, [products, sales]);

  const monthlySalesData = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const amount = sales
        .filter((sale) => {
          const saleDate = new Date(sale.createdAt);
          return (
            saleDate.getMonth() === date.getMonth() &&
            saleDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, sale) => sum + sale.totalAmount, 0);

      return {
        month: monthFormatter.format(date),
        amount,
      };
    });
  }, [sales]);

  const sellerPerformance = useMemo(() => {
    const sellers = users.filter((user) => user.role === "seller");
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    return sellers
      .map((seller) => {
        const sellerSales = sales.filter((sale) => sale.sellerId === seller.id);
        const amount = sellerSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const count = sellerSales.length;
        const target = totalAmount ? Math.round((amount / totalAmount) * 100) : 0;

        return {
          name: seller.name,
          salesCount: count,
          amount,
          target,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [sales, users]);

  const topProducts = useMemo(() => {
    const soldMap = new Map<number, { units: number; revenue: number }>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const current = soldMap.get(item.productId) ?? { units: 0, revenue: 0 };
        soldMap.set(item.productId, {
          units: current.units + item.quantity,
          revenue: current.revenue + item.quantity * item.price,
        });
      }
    }

    return products
      .map((product) => ({
        name: product.name,
        units: soldMap.get(product.id)?.units ?? 0,
        revenue: soldMap.get(product.id)?.revenue ?? 0,
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [products, sales]);

  const stockTracking = useMemo(() => {
    return products
      .map((product) => ({
        name: product.name,
        stock: product.stock,
        reorderLevel: product.reorderLevel,
        status:
          product.stock === 0
            ? "Out"
            : product.stock <= product.reorderLevel / 2
              ? "Critical"
              : product.stock <= product.reorderLevel
                ? "Low"
                : "Healthy",
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);
  }, [products]);

  const stockChartData = stockTracking.map((item) => ({
    name: item.name,
    stock: item.stock,
    reorderLevel: item.reorderLevel,
  }));

  const topSeller = sellerPerformance[0];
  const previousMonthDelta = metrics.previousMonthAmount
    ? Math.round(
        ((metrics.currentMonthAmount - metrics.previousMonthAmount) /
          metrics.previousMonthAmount) *
          100
      )
      : 100;

  if (isLoading) {
    return <PosPageSkeleton hasFilters={false} hasTable={false} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live overview generated from the same POS data used by admin and cashier screens.
        </p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Today Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              MMK {metrics.todayAmount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {metrics.todaySales.length} completed bills today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              MMK {metrics.currentMonthAmount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {previousMonthDelta >= 0 ? "+" : ""}
              {previousMonthDelta}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topSeller?.name ?? "No sales yet"}</p>
            <p className="text-sm text-muted-foreground">
              {topSeller
                ? `${topSeller.salesCount} sales, MMK ${topSeller.amount.toLocaleString()}`
                : "Create sales to populate ranking"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {metrics.lowStockItems.length} Items
            </p>
            <p className="text-sm text-muted-foreground">Need restock attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [
                  `MMK ${Number(value ?? 0).toLocaleString()}`,
                  "Sales",
                ]}
              />
              <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seller Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerPerformance.map((seller) => (
                  <TableRow key={seller.name}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.salesCount}</TableCell>
                    <TableCell>MMK {seller.amount.toLocaleString()}</TableCell>
                    <TableCell>{seller.target}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((product, idx) => (
              <div
                key={product.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">
                    #{idx + 1} {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sold {product.units} units
                  </p>
                </div>
                <p className="font-semibold">MMK {product.revenue.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Tracking Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reorderLevel" fill="#94a3b8" name="Reorder Level" />
                <Bar dataKey="stock" name="Current Stock">
                  {stockChartData.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.stock <= item.reorderLevel ? "#ef4444" : "#22c55e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Tracking Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stockTracking.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {item.stock} | Reorder: {item.reorderLevel}
                  </p>
                </div>
                <Badge
                  variant={item.status === "Healthy" ? "secondary" : "destructive"}
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

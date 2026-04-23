"use client";

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

const monthlySalesData = [
  { month: "Jan", amount: 2100000 },
  { month: "Feb", amount: 2350000 },
  { month: "Mar", amount: 2480000 },
  { month: "Apr", amount: 2620000 },
  { month: "May", amount: 2780000 },
  { month: "Jun", amount: 2940000 },
  { month: "Jul", amount: 3010000 },
  { month: "Aug", amount: 3180000 },
  { month: "Sep", amount: 3270000 },
  { month: "Oct", amount: 3390000 },
  { month: "Nov", amount: 3520000 },
  { month: "Dec", amount: 3680000 },
];

const sellerPerformance = [
  { name: "Kyaw Zin", salesCount: 124, amount: 1860000, target: 90 },
  { name: "Moe Thu", salesCount: 113, amount: 1695000, target: 82 },
  { name: "Hnin Ei", salesCount: 98, amount: 1520000, target: 78 },
  { name: "Aung Min", salesCount: 88, amount: 1315000, target: 71 },
];

const topProducts = [
  { name: "Coke 325ml", units: 460, revenue: 690000 },
  { name: "White Bread", units: 395, revenue: 869000 },
  { name: "Mineral Water", units: 372, revenue: 297600 },
  { name: "Potato Chips", units: 315, revenue: 378000 },
  { name: "Instant Coffee", units: 205, revenue: 656000 },
];

const stockTracking = [
  { name: "Eggs", stock: 5, reorderLevel: 20, status: "Critical" },
  { name: "Cooking Oil", stock: 12, reorderLevel: 25, status: "Low" },
  { name: "Rice 5kg", stock: 18, reorderLevel: 20, status: "Low" },
  { name: "Sugar", stock: 42, reorderLevel: 30, status: "Healthy" },
  { name: "Coke 325ml", stock: 24, reorderLevel: 20, status: "Healthy" },
];

const stockChartData = stockTracking.map((item) => ({
  name: item.name,
  stock: item.stock,
  reorderLevel: item.reorderLevel,
}));

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          UI-only analytics overview for supermarket management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Today Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">MMK 186,500</p>
            <p className="text-sm text-muted-foreground">52 completed bills today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">MMK 3,680,000</p>
            <p className="text-sm text-muted-foreground">+8.4% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Kyaw Zin</p>
            <p className="text-sm text-muted-foreground">124 sales, MMK 1,860,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">3 Items</p>
            <p className="text-sm text-muted-foreground">Need restock immediately</p>
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
              <Tooltip formatter={(value: number) => [`MMK ${value.toLocaleString()}`, "Sales"]} />
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
              <div key={product.name} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">#{idx + 1} {product.name}</p>
                  <p className="text-sm text-muted-foreground">Sold {product.units} units</p>
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
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
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
              <div key={item.name} className="flex items-center justify-between rounded-md border p-3">
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

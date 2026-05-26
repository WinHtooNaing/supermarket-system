"use client";

import { useMemo, useState } from "react";

import { PosPageSkeleton } from "@/components/pos-page-skeleton";
import { SellerDialog, type SellerRecord } from "@/components/seller-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { deleteUser, saveUser, usePosData } from "@/lib/pos-store";
import { toast } from "sonner";

function toSellerRecord(user: {
  id: number;
  userId: string;
  password: string;
  name: string;
  role: "admin" | "seller";
  createdAt: string;
}): SellerRecord {
  return {
    id: user.id,
    userId: user.userId,
    password: user.password,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.slice(0, 10),
  };
}

export default function SellerPage() {
  const { users, sales, isLoading, error: loadError } = usePosData();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredSellers = useMemo(() => {
    const keyword = search.toLowerCase();
    return users.filter((seller) => {
      return (
        seller.name.toLowerCase().includes(keyword) ||
        seller.userId.toLowerCase().includes(keyword)
      );
    });
  }, [search, users]);

  const salesBySeller = useMemo(() => {
    return sales.reduce<Record<number, { count: number; amount: number }>>(
      (acc, sale) => {
        const current = acc[sale.sellerId] ?? { count: 0, amount: 0 };
        acc[sale.sellerId] = {
          count: current.count + 1,
          amount: current.amount + sale.totalAmount,
        };
        return acc;
      },
      {},
    );
  }, [sales]);

  async function handleSaveSeller(
    data: Omit<SellerRecord, "id" | "createdAt"> & { id?: number },
  ) {
    try {
      setError("");
      // await saveUser(data);
      await saveUser({
        ...data,
        id: data.id ?? 0,
      });
      toast.success(
        data.id ? "User updated successfully." : "User created successfully.",
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Unable to save user.";
      setError(message);
      toast.error(message);
    }
  }

  async function handleDeleteSeller(id: number) {
    const target = users.find((user) => user.id === id);
    if (!target) return;

    const adminCount = users.filter((user) => user.role === "admin").length;
    if (target.role === "admin" && adminCount === 1) {
      const message = "At least one admin account must remain.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setError("");
      setDeletingId(id);
      await deleteUser(id);
      toast.success("User deleted successfully.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete user.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <PosPageSkeleton hasFilters />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Sellers / Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage login accounts and see live cashier activity.
          </p>
        </div>
        <SellerDialog onSave={handleSaveSeller} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="mt-2 text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Cashiers</p>
          <p className="mt-2 text-2xl font-bold">
            {users.filter((user) => user.role === "seller").length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="mt-2 text-2xl font-bold">
            {users.filter((user) => user.role === "admin").length}
          </p>
        </div>
      </div>

      <Input
        placeholder="Search by name or user ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {(error || loadError) && (
        <p className="text-sm text-destructive">{error || loadError}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Sales</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredSellers.map((seller) => {
            const performance = salesBySeller[seller.id] ?? {
              count: 0,
              amount: 0,
            };

            return (
              <TableRow key={seller.id}>
                <TableCell>{seller.userId}</TableCell>
                <TableCell className="font-medium">{seller.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={seller.role === "admin" ? "secondary" : "outline"}
                  >
                    {seller.role.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{performance.count}</TableCell>
                <TableCell>MMK {performance.amount.toLocaleString()}</TableCell>
                <TableCell>{seller.createdAt.slice(0, 10)}</TableCell>
                <TableCell className="space-x-2">
                  <SellerDialog
                    seller={toSellerRecord(seller)}
                    onSave={handleSaveSeller}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deletingId === seller.id}
                    onClick={() => void handleDeleteSeller(seller.id)}
                  >
                    {deletingId === seller.id ? (
                      <>
                        <Spinner className="mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {!filteredSellers.length && (
            <TableRow>
              <TableCell
                className="text-center text-muted-foreground"
                colSpan={7}
              >
                No sellers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import { SellerDialog, SellerRecord } from "@/components/seller-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sellerSeed: SellerRecord[] = [
  {
    id: 1,
    userId: "seller001",
    password: "seller001",
    name: "Kyaw Zin",
    role: "seller",
    createdAt: "2026-04-13",
  },
  {
    id: 2,
    userId: "admin001",
    password: "admin123",
    name: "Moe Thu",
    role: "admin",
    createdAt: "2026-04-14",
  },
];

export default function SellerPage() {
  const [sellers, setSellers] = useState<SellerRecord[]>(sellerSeed);
  const [search, setSearch] = useState("");

  const filteredSellers = useMemo(() => {
    const keyword = search.toLowerCase();
    return sellers.filter((seller) => {
      return (
        seller.name.toLowerCase().includes(keyword) ||
        seller.userId.toLowerCase().includes(keyword)
      );
    });
  }, [search, sellers]);

  function handleSaveSeller(data: Omit<SellerRecord, "id" | "createdAt"> & { id?: number }) {
    if (data.id) {
      setSellers((prev) =>
        prev.map((seller) => (seller.id === data.id ? { ...seller, ...data } : seller))
      );
      return;
    }

    setSellers((prev) => [
      ...prev,
      {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ]);
  }

  function handleDeleteSeller(id: number) {
    setSellers((prev) => prev.filter((seller) => seller.id !== id));
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Sellers / Users</h1>
        <SellerDialog onSave={handleSaveSeller} />
      </div>

      <Input
        placeholder="Search by name or user ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredSellers.map((seller) => (
            <TableRow key={seller.id}>
              <TableCell>{seller.userId}</TableCell>
              <TableCell>{seller.name}</TableCell>
              <TableCell className="uppercase">{seller.role}</TableCell>
              <TableCell>{seller.createdAt}</TableCell>
              <TableCell className="space-x-2">
                <SellerDialog seller={seller} onSave={handleSaveSeller} />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteSeller(seller.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {!filteredSellers.length && (
            <TableRow>
              <TableCell className="text-center text-muted-foreground" colSpan={5}>
                No sellers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

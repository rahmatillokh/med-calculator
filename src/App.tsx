import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Trash2, Plus, Factory, Percent, PackageOpen } from "lucide-react";

// -------------------- Types --------------------
export type Category = string;
export type Product = {
  id: string;
  name: string;
  qty: number;
  price: number;
  category: Category | "";
};

// -------------------- Storage Keys --------------------
const LS_PRODUCTS = "app.products";
const LS_CATEGORIES = "app.categories";

// -------------------- Helpers --------------------
function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.log("CATCHED");
  }
}

function fmtPct(n: number) {
  if (!isFinite(n)) return "0%";
  const val = Math.round(n * 100) / 100;
  return `${val}%`;
}

// -------------------- Component --------------------
const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() =>
    loadLS<Category[]>(LS_CATEGORIES, ["Xitoy", "O'zbekiston"])
  );

  const [products, setProducts] = useState<Product[]>(() =>
    loadLS<Product[]>(LS_PRODUCTS, [
      { id: uuid(), name: "Telefon", qty: 10, price: 200, category: "Xitoy" },
      { id: uuid(), name: "Non", qty: 20, price: 10, category: "O'zbekiston" },
    ])
  );

  useEffect(() => saveLS(LS_PRODUCTS, products), [products]);
  useEffect(() => saveLS(LS_CATEGORIES, categories), [categories]);

  // Summary (category -> total sum & share)
  const { totalSum, rows } = useMemo(() => {
    const map = new Map<Category, number>();
    let total = 0;
    for (const p of products) {
      const sum = (Number(p.qty) || 0) * (Number(p.price) || 0);
      total += sum;
      if (!p.category) continue;
      map.set(p.category, (map.get(p.category) ?? 0) + sum);
    }
    const out = Array.from(map.entries()).map(([cat, sum]) => ({
      cat,
      sum,
      share: total > 0 ? (sum / total) * 100 : 0,
    }));
    out.sort((a, b) => b.sum - a.sum);
    return { totalSum: total, rows: out };
  }, [products]);

  const addRow = () =>
    setProducts((prev) => [
      ...prev,
      { id: uuid(), name: "", qty: 0, price: 0, category: categories[0] ?? "" },
    ]);

  const removeRow = (id: string) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const updateRow = (id: string, patch: Partial<Product>) =>
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );

  const [openAddCat, setOpenAddCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) setCategories((c) => [...c, trimmed]);
    setNewCat("");
    setOpenAddCat(false);
  };

  const resetAll = () => {
    if (!confirm("Barchasini tozalaysizmi?")) return;
    setProducts([]);
    setCategories(["Xitoy", "O'zbekiston"]);
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("uz-UZ", {
      useGrouping: true,
    })
      .format(value)
      .replace(/,/g, " "); // vergulni space bilan almashtirish

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="mx-auto max-w-6xl grid gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Mahsulotlar ulushi hisoblagich
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kategoriya bo‘yicha umumiy summa hisoblanadi va ulushlari
              aniqlanadi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={openAddCat} onOpenChange={setOpenAddCat}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Factory className="h-4 w-4" />
                  Kategoriya qo‘shish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Yangi kategoriya</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <Label htmlFor="newCat">Kategoriya nomi</Label>
                  <Input
                    id="newCat"
                    placeholder="Masalan: Turkiya"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCategory();
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={addCategory} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Qo‘shish
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" onClick={resetAll} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Tozalash
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen className="h-5 w-5" />
              Mahsulotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="text-sm text-muted-foreground">
                Jadvalga yangi qator qo‘shing. Ulush hisoblashda miqdor × narx
                summasi olinadi.
              </div>
              <div className="flex-1" />
              <Button onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />
                Qator qo‘shish
              </Button>
            </div>

            <div className="rounded-2xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Mahsulot nomi</TableHead>
                    <TableHead className="w-40">Soni</TableHead>
                    <TableHead className="w-40">Narxi</TableHead>
                    <TableHead className="w-40">Umumiy summa</TableHead>
                    <TableHead className="w-56">Kategoriya</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-10 text-muted-foreground"
                      >
                        Hozircha mahsulot yo‘q.
                      </TableCell>
                    </TableRow>
                  )}
                  {products.map((p, idx) => {
                    const sum = (Number(p.qty) || 0) * (Number(p.price) || 0);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-center">{idx + 1}</TableCell>
                        <TableCell>
                          <Input
                            placeholder="Masalan: Telefon"
                            value={p.name}
                            onChange={(e) =>
                              updateRow(p.id, { name: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={p.qty}
                            onChange={(e) =>
                              updateRow(p.id, { qty: Number(e.target.value) })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={p.price}
                            onChange={(e) =>
                              updateRow(p.id, { price: Number(e.target.value) })
                            }
                          />
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">
                          {formatNumber(sum)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={p.category}
                            onValueChange={(v) =>
                              updateRow(p.id, { category: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Kategoriya tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Kategoriya bo‘yicha natija
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <Badge variant="secondary" className="rounded-xl">
                Jami summa:{" "}
                <span className="ml-1 font-semibold text-foreground">
                  {formatNumber(totalSum)}
                </span>
              </Badge>
              <Separator orientation="vertical" className="h-5" />
              <span>Ulushlar umumiy summa asosida hisoblanadi.</span>
            </div>

            <div className="grid gap-3">
              {rows.length === 0 && (
                <div className="text-muted-foreground text-sm">
                  Hali natija yo‘q — jadvalga kamida bitta mahsulot kiriting.
                </div>
              )}
              {rows.map((r) => (
                <div key={r.cat} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-xl" variant="outline">
                        {r.cat}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(r.sum)}
                      </span>
                    </div>
                    <div className="font-semibold tabular-nums">
                      {fmtPct(r.share)}
                    </div>
                  </div>
                  <Progress value={r.share} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <footer className="text-xs text-muted-foreground text-center py-6">
          <span>
            Made with{" "}
            <a href="https://t.me/onlaynmiz" className="text-xl">
              Rahmatillokh Dev
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
};

export default App;

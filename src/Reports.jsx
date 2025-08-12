import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const handleFetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("transactions")
      .select("*, categories(name), pockets(name)")
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lte("created_at", nextDay.toISOString().split("T")[0]);
    }

    const { data, error } = await query;

    if (error) {
      toast.error(error.message);
      setTransactions([]);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    handleFetchReports();
  }, [handleFetchReports]);

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === "pemasukan") {
          acc.income += tx.amount;
        } else {
          acc.expense += tx.amount;
        }
        acc.net = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, net: 0 }
    );
  }, [transactions]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <Link
        to="/"
        className="inline-block mb-6 text-indigo-600 hover:underline"
      >
        &larr; Kembali ke Dashboard
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Laporan Transaksi</h1>
        <p className="text-gray-500">
          Lihat riwayat pemasukan dan pengeluaran Anda.
        </p>
      </header>

      <section className="p-6 bg-white rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Pilih Periode Laporan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Dari Tanggal
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              Sampai Tanggal
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={handleFetchReports}
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Tampilkan Laporan"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-green-100 text-green-800 rounded-lg">
          <p className="text-sm">Total Pemasukan</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(summary.income)}
          </p>
        </div>
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <p className="text-sm">Total Pengeluaran</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(summary.expense)}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            summary.net >= 0
              ? "bg-blue-100 text-blue-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          <p className="text-sm">Selisih</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(summary.net)}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Detail Transaksi</h2>
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-gray-500">Memuat transaksi...</p>
          ) : transactions.length > 0 ? (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-bold capitalize">{tx.description}</p>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                    <span>
                      {new Date(tx.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {tx.pockets && (
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
                        {tx.pockets.name}
                      </span>
                    )}
                    {tx.categories && (
                      <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">
                        {tx.categories.name}
                      </span>
                    )}
                  </div>
                </div>
                <p
                  className={`font-bold text-lg ${
                    tx.type === "pemasukan" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "pemasukan" ? "+" : "-"}{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(tx.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-6 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">
                Tidak ada transaksi pada periode yang dipilih.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

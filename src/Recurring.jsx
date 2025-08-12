import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Recurring() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [pockets, setPockets] = useState([]);
  const [categories, setCategories] = useState([]);

  // State untuk form
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("pengeluaran");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [selectedPocket, setSelectedPocket] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rulesPromise = supabase
      .from("recurring_transactions")
      .select("*, pockets(name), categories(name)")
      .eq("user_id", user.id)
      .order("day_of_month");
    const pocketsPromise = supabase
      .from("pockets")
      .select("id, name")
      .eq("user_id", user.id);
    const categoriesPromise = supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", user.id);

    const [
      { data: rulesData },
      { data: pocketsData },
      { data: categoriesData },
    ] = await Promise.all([rulesPromise, pocketsPromise, categoriesPromise]);

    setRules(rulesData || []);
    setPockets(pocketsData || []);
    setCategories(categoriesData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let ruleData = {
      user_id: user.id,
      description,
      amount: parseFloat(amount),
      type,
      frequency: "monthly", // Untuk saat ini kita hanya mendukung bulanan
      day_of_month: parseInt(dayOfMonth),
      is_active: true,
    };
    if (selectedPocket) ruleData.pocket_id = parseInt(selectedPocket);
    if (selectedCategory) ruleData.category_id = parseInt(selectedCategory);

    const { error } = await supabase
      .from("recurring_transactions")
      .insert([ruleData]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Aturan baru berhasil ditambahkan!");
      // Reset form
      setDescription("");
      setAmount("");
      // Refresh data
      await fetchData();
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm("Yakin ingin menghapus aturan ini?")) {
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", ruleId);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Aturan berhasil dihapus.");
        await fetchData();
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <Link
        to="/"
        className="inline-block mb-6 text-indigo-600 hover:underline"
      >
        &larr; Kembali ke Dashboard
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Transaksi Otomatis</h1>
        <p className="text-gray-500">
          Atur pemasukan dan pengeluaran rutin Anda di sini.
        </p>
      </header>

      {/* Form Tambah Aturan Baru */}
      <section className="p-6 bg-white rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Tambah Aturan Baru</h2>
        <form
          onSubmit={handleAddRule}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end"
        >
          <div className="md:col-span-2 lg:col-span-3">
            <label htmlFor="desc" className="block text-sm font-medium">
              Deskripsi
            </label>
            <input
              id="desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium">
              Jumlah (Rp)
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium">
              Tipe
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md bg-white"
            >
              <option value="pengeluaran">Pengeluaran</option>
              <option value="pemasukan">Pemasukan</option>
            </select>
          </div>
          <div>
            <label htmlFor="day" className="block text-sm font-medium">
              Setiap Tanggal
            </label>
            <input
              id="day"
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="pocket" className="block text-sm font-medium">
              Pocket (Opsional)
            </label>
            <select
              id="pocket"
              value={selectedPocket}
              onChange={(e) => setSelectedPocket(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md bg-white"
            >
              <option value="">-- Umum --</option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cat" className="block text-sm font-medium">
              Kategori (Opsional)
            </label>
            <select
              id="cat"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md bg-white"
            >
              <option value="">-- Tanpa Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Simpan Aturan
            </button>
          </div>
        </form>
      </section>

      {/* Daftar Aturan yang Sudah Ada */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Aturan Aktif</h2>
        <div className="space-y-3">
          {loading ? (
            <p>Memuat aturan...</p>
          ) : rules.length > 0 ? (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-bold">{rule.description}</p>
                  <p
                    className={`text-sm font-semibold ${
                      rule.type === "pemasukan"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(rule.amount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Setiap tanggal {rule.day_of_month}
                    {rule.pockets ? ` • Ke Pocket: ${rule.pockets.name}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">
              Belum ada aturan transaksi otomatis.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

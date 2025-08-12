import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import toast from "react-hot-toast";

const TransferModal = React.memo(function TransferModal({
  isOpen,
  onClose,
  onTransfer,
  currentPocketId,
  allPockets,
}) {
  const [amount, setAmount] = useState("");
  const [destinationPocketId, setDestinationPocketId] = useState("");
  const [loading, setLoading] = useState(false);
  const destinationPockets = useMemo(
    () => allPockets.filter((p) => p.id !== currentPocketId),
    [allPockets, currentPocketId]
  );
  useEffect(() => {
    if (destinationPockets.length > 0)
      setDestinationPocketId(destinationPockets[0].id);
  }, [destinationPockets]);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !destinationPocketId) {
      toast.error("Jumlah dan pocket tujuan harus diisi.");
      return;
    }
    setLoading(true);
    await onTransfer(parseFloat(amount), parseInt(destinationPocketId, 10));
    setLoading(false);
    setAmount("");
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Transfer Saldo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="transferAmount"
              className="block text-sm font-medium"
            >
              Jumlah Transfer
            </label>
            <input
              id="transferAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="destinationPocket"
              className="block text-sm font-medium"
            >
              Ke Pocket
            </label>
            <div className="relative mt-1">
              <select
                id="destinationPocket"
                value={destinationPocketId}
                onChange={(e) => setDestinationPocketId(e.target.value)}
                required
                className="w-full px-3 py-2 pr-8 border border-gray-300 bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {destinationPockets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-md"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function PocketDetail() {
  const { id: pocketId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pocket, setPocket] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pocketSaldo, setPocketSaldo] = useState(0);
  const [allPockets, setAllPockets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("pengeluaran");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchPageData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const pocketPromise = supabase
      .from("pockets")
      .select("id, name")
      .eq("id", pocketId)
      .single();
    const allPocketsPromise = supabase
      .from("pockets")
      .select("id, name")
      .eq("user_id", user.id);
    const categoriesPromise = supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", user.id);
    const [
      { data: pocketData, error: pocketError },
      { data: allPocketsData },
      { data: categoriesData },
    ] = await Promise.all([
      pocketPromise,
      allPocketsPromise,
      categoriesPromise,
    ]);
    if (pocketError) {
      toast.error("Pocket tidak ditemukan.");
      navigate("/");
      return;
    }
    setPocket(pocketData);
    setAllPockets(allPocketsData || []);
    setCategories(categoriesData || []);
  }, [pocketId, navigate]);

  const fetchTransactions = useCallback(async () => {
    const { data: transData, error: transError } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("pocket_id", pocketId)
      .order("created_at", { ascending: false });
    if (transError)
      toast.error("Gagal memuat transaksi: " + transError.message);
    else setTransactions(transData || []);
  }, [pocketId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPageData(), fetchTransactions()]).finally(() =>
      setLoading(false)
    );
  }, [fetchPageData, fetchTransactions]);

  useEffect(() => {
    const saldo = transactions.reduce(
      (acc, tx) =>
        tx.type === "pemasukan" ? acc + tx.amount : acc - tx.amount,
      0
    );
    setPocketSaldo(saldo);
  }, [transactions]);

  const addTransactionToPocket = async (e) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const transactionData = {
      description,
      amount: parseFloat(amount),
      type,
      user_id: user.id,
      pocket_id: pocketId,
    };
    if (selectedCategory)
      transactionData.category_id = parseInt(selectedCategory);
    await supabase.from("transactions").insert([transactionData]);
    toast.success("Catatan berhasil ditambahkan!");
    setDescription("");
    setAmount("");
    setSelectedCategory("");
    await fetchTransactions();
  };

  const deletePocket = async () => {
    if (
      window.confirm(
        `Yakin ingin menghapus pocket "${pocket?.name}"? SEMUA transaksi di dalamnya juga akan terhapus PERMANEN.`
      )
    ) {
      await supabase.from("pockets").delete().eq("id", pocketId);
      toast.success("Pocket berhasil dihapus!");
      navigate("/");
    }
  };

  const handleTransfer = async (amount, destinationId) => {
    await supabase.rpc("transfer_between_pockets", {
      amount_to_transfer: amount,
      source_pocket_id: parseInt(pocketId, 10),
      destination_pocket_id: destinationId,
    });
    toast.success("Transfer berhasil!");
    setIsTransferModalOpen(false);
    await fetchTransactions();
  };

  if (loading)
    return <div className="p-4 text-center">Memuat data pocket...</div>;

  return (
    <>
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleTransfer}
        currentPocketId={parseInt(pocketId, 10)}
        allPockets={allPockets}
      />
      <div className="container mx-auto p-4 max-w-4xl">
        <Link
          to="/"
          className="inline-block mb-6 text-indigo-600 hover:underline"
        >
          &larr; Kembali ke Dashboard
        </Link>
        <header className="p-6 bg-white rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {pocket?.name}
              </h1>
              <p className="text-lg text-gray-500 mt-1">Saldo di Pocket Ini</p>
              <p
                className={`text-3xl font-bold ${
                  pocketSaldo >= 0 ? "text-gray-900" : "text-red-600"
                }`}
              >
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(pocketSaldo)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Transfer
              </button>
              <button
                onClick={deletePocket}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
              >
                Hapus
              </button>
            </div>
          </div>
        </header>
        <section className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Tambah Catatan di "{pocket?.name}"
          </h2>
          <form
            onSubmit={addTransactionToPocket}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Deskripsi
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700"
              >
                Jumlah (Rp)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Tipe
              </label>
              <div className="relative mt-1">
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="pengeluaran">Pengeluaran</option>
                  <option value="pemasukan">Pemasukan</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Kategori
              </label>
              <div className="relative mt-1">
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Tanpa Kategori --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Simpan ke Pocket
              </button>
            </div>
          </form>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-4">Riwayat Pocket Ini</h2>
          <div className="space-y-3">
            {transactions.map((tx) => (
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
            ))}
            {transactions.length === 0 && !loading && (
              <div className="text-center py-10 px-6 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">
                  Belum ada catatan di pocket ini.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

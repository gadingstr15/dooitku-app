import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddGeneralTransaction() {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("pengeluaran");
  const [pockets, setPockets] = useState([]);
  const [selectedPocket, setSelectedPocket] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const pocketsPromise = supabase
        .from("pockets")
        .select("id, name")
        .eq("user_id", user.id);
      const categoriesPromise = supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", user.id);

      const [{ data: pocketsData }, { data: categoriesData }] =
        await Promise.all([pocketsPromise, categoriesPromise]);

      if (pocketsData) setPockets(pocketsData);
      if (categoriesData) setCategories(categoriesData);
    };
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Menyimpan...");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let transactionData = {
        description,
        amount: parseFloat(amount),
        type,
        user_id: user.id,
      };

      if (selectedPocket)
        transactionData.pocket_id = parseInt(selectedPocket, 10);
      if (selectedCategory)
        transactionData.category_id = parseInt(selectedCategory, 10);

      const { error } = await supabase
        .from("transactions")
        .insert([transactionData]);

      if (error) throw error;
      toast.success("Transaksi berhasil ditambahkan!");

      if (selectedPocket) {
        navigate(`/pocket/${selectedPocket}`);
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <Link to="/" className="text-indigo-600 hover:underline mb-6 block">
        &larr; Kembali ke Dashboard
      </Link>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Tambah Transaksi Baru</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="pocket"
              className="block text-sm font-medium text-gray-700"
            >
              Tujuan Catatan
            </label>
            <div className="relative mt-1">
              <select
                id="pocket"
                value={selectedPocket}
                onChange={(e) => setSelectedPocket(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Umum (Tidak Masuk Pocket)</option>
                {pockets.map((pocket) => (
                  <option key={pocket.id} value={pocket.id}>
                    {pocket.name}
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

          <div>
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </form>
      </div>
    </div>
  );
}

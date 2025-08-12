import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

// Komponen Modal untuk Tambah Pocket
const AddPocketModal = React.memo(function AddPocketModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [pocketName, setPocketName] = useState("");
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pocketName) {
      toast.error("Nama pocket tidak boleh kosong.");
      return;
    }
    setLoading(true);
    await onSave(pocketName);
    setLoading(false);
    setPocketName("");
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Buat Pocket Baru</h2>
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="pocketName"
            className="block text-sm font-medium text-gray-700"
          >
            Nama Pocket
          </label>
          <input
            id="pocketName"
            type="text"
            value={pocketName}
            onChange={(e) => setPocketName(e.target.value)}
            placeholder="cth: Dana Darurat"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            autoFocus
          />
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// Komponen untuk Mengelola Kategori
const CategoryManager = React.memo(function CategoryManager({
  categories,
  onAddCategory,
  onDeleteCategory,
}) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    if (!newCategoryName) return;
    setLoading(true);
    await onAddCategory(newCategoryName);
    setNewCategoryName("");
    setLoading(false);
  };
  return (
    <div className="p-5 bg-white rounded-xl shadow">
      <h3 className="font-bold text-lg mb-3">Kelola Kategori</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nama Kategori Baru"
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Tambah
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
          >
            <span>{cat.name}</span>
            <button
              onClick={() => onDeleteCategory(cat.id, cat.name)}
              className="ml-2 text-red-500 hover:text-red-700 font-bold"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

// Komponen untuk Menampilkan Progress Budget
const BudgetProgress = React.memo(function BudgetProgress({
  budgets,
  expensesByCategory,
}) {
  if (budgets.length === 0) {
    return (
      <div className="p-5 bg-white rounded-xl shadow text-center">
        <p className="text-gray-500">
          Anda belum mengatur budget untuk bulan ini.
        </p>
      </div>
    );
  }
  return (
    <div className="p-5 bg-white rounded-xl shadow">
      <h3 className="font-bold text-lg mb-4">Lacak Anggaran Bulan Ini</h3>
      <div className="space-y-4">
        {budgets.map((budget) => {
          const spent = expensesByCategory[budget.categories.name] || 0;
          const percentage = Math.min((spent / budget.amount) * 100, 100);
          let bgColor = "bg-green-500";
          if (percentage > 75) bgColor = "bg-yellow-500";
          if (percentage >= 100) bgColor = "bg-red-500";
          return (
            <div key={budget.id}>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>{budget.categories.name}</span>
                <span className="text-gray-500">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(spent)}{" "}
                  /{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(budget.amount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${bgColor} h-2.5 rounded-full`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Komponen untuk Mengelola Budget
const BudgetManager = React.memo(function BudgetManager({
  categories,
  budgets,
  onAddBudget,
  onDeleteBudget,
}) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  useEffect(() => {
    if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
  }, [categories, categoryId]);
  const handleAdd = async () => {
    if (!categoryId || !amount) {
      toast.error("Kategori dan jumlah harus diisi.");
      return;
    }
    await onAddBudget(parseInt(categoryId), parseFloat(amount));
    setAmount("");
  };
  return (
    <div className="p-5 bg-white rounded-xl shadow">
      <h3 className="font-bold text-lg mb-3">Atur Anggaran Bulan Ini</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 items-center">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full p-2 border rounded-md bg-white"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Jumlah (Rp)"
          className="w-full p-2 border rounded-md"
        />
        <button
          onClick={handleAdd}
          className="w-full p-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Set
        </button>
      </div>
      <div className="text-sm space-y-1">
        {budgets.map((b) => (
          <div
            key={b.id}
            className="flex justify-between items-center bg-gray-50 p-1 rounded"
          >
            <span>{b.categories.name}</span>
            <div className="flex items-center gap-2">
              <span>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(b.amount)}
              </span>
              <button
                onClick={() => onDeleteBudget(b.id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Komponen Utama Dashboard
export default function Dashboard({ session }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pockets, setPockets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pocketBalances, setPocketBalances] = useState({});
  const [currentDate, setCurrentDate] = useState("");
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const [filterStartDate, setFilterStartDate] = useState(
    new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0]
  );
  const [filterEndDate, setFilterEndDate] = useState(
    today.toISOString().split("T")[0]
  );
  const userName = session.user.user_metadata.full_name || session.user.email;

  const loadAllDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const goalsPromise = supabase
      .from("goals")
      .select("*")
      .eq("user_id", session.user.id);
    const allTransPromise = supabase
      .from("transactions")
      .select("amount, type, pocket_id")
      .eq("user_id", session.user.id);
    const pocketsPromise = supabase
      .from("pockets")
      .select("id, name")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    const catPromise = supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", session.user.id)
      .order("name", { ascending: true });
    const budgetPromise = supabase
      .from("budgets")
      .select("*, categories(name)")
      .eq("user_id", session.user.id)
      .eq("month", currentMonth)
      .eq("year", currentYear);
    let filteredQuery = supabase
      .from("transactions")
      .select("amount, type, categories(name)")
      .eq("user_id", session.user.id);
    if (filterStartDate)
      filteredQuery = filteredQuery.gte("created_at", filterStartDate);
    if (filterEndDate) {
      const nextDay = new Date(filterEndDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filteredQuery = filteredQuery.lte(
        "created_at",
        nextDay.toISOString().split("T")[0]
      );
    }
    const [
      { data: goalsData },
      { data: allTransData },
      { data: pocketsData },
      { data: catData },
      { data: budgetData },
      { data: filteredTransData },
    ] = await Promise.all([
      goalsPromise,
      allTransPromise,
      pocketsPromise,
      catPromise,
      budgetPromise,
      filteredQuery,
    ]);
    setGoals(goalsData || []);
    const saldo = (allTransData || []).reduce(
      (acc, tx) =>
        tx.type === "pemasukan" ? acc + tx.amount : acc - tx.amount,
      0
    );
    setTotalSaldo(saldo);
    const balances = (allTransData || []).reduce((acc, tx) => {
      if (tx.pocket_id) {
        const currentBalance = acc[tx.pocket_id] || 0;
        acc[tx.pocket_id] =
          tx.type === "pemasukan"
            ? currentBalance + tx.amount
            : currentBalance - tx.amount;
      }
      return acc;
    }, {});
    setPocketBalances(balances);
    setPockets(pocketsData || []);
    setCategories(catData || []);
    setBudgets(budgetData || []);
    setTransactions(filteredTransData || []);
    setLoading(false);
  }, [
    session.user.id,
    filterStartDate,
    filterEndDate,
    currentMonth,
    currentYear,
  ]);

  useEffect(() => {
    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
    setCurrentDate(formattedDate);
    loadAllDashboardData();
    window.addEventListener("focus", loadAllDashboardData);
    return () => window.removeEventListener("focus", loadAllDashboardData);
  }, [loadAllDashboardData]);

  const handleAddPocket = async (pocketName) => {
    await supabase
      .from("pockets")
      .insert([{ name: pocketName, user_id: session.user.id }]);
    toast.success(`Pocket "${pocketName}" berhasil dibuat!`);
    setIsModalOpen(false);
    await loadAllDashboardData();
  };

  const handleAddCategory = async (name) => {
    await supabase
      .from("categories")
      .insert([{ name, user_id: session.user.id }]);
    toast.success("Kategori berhasil dibuat!");
    await loadAllDashboardData();
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus kategori "${name}"?`)) {
      await supabase.from("categories").delete().eq("id", id);
      toast.success("Kategori berhasil dihapus!");
      await loadAllDashboardData();
    }
  };

  const handleAddBudget = async (categoryId, amount) => {
    const existingBudget = budgets.find((b) => b.category_id === categoryId);
    if (existingBudget) {
      await supabase
        .from("budgets")
        .update({ amount })
        .eq("id", existingBudget.id);
      toast.success("Anggaran berhasil diperbarui!");
    } else {
      await supabase
        .from("budgets")
        .insert([
          {
            user_id: session.user.id,
            category_id: categoryId,
            amount,
            month: currentMonth,
            year: currentYear,
          },
        ]);
      toast.success("Anggaran berhasil dibuat!");
    }
    await loadAllDashboardData();
  };

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm("Yakin ingin menghapus anggaran ini?")) {
      await supabase.from("budgets").delete().eq("id", budgetId);
      toast.success("Anggaran berhasil dihapus!");
      await loadAllDashboardData();
    }
  };

  const expensesByCategory = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === "pengeluaran" && tx.categories)
      .reduce((acc, tx) => {
        const categoryName = tx.categories.name;
        acc[categoryName] = (acc[categoryName] || 0) + tx.amount;
        return acc;
      }, {});
  }, [transactions]);

  const chartData = useMemo(() => {
    return {
      labels: Object.keys(expensesByCategory),
      datasets: [
        {
          data: Object.values(expensesByCategory),
          backgroundColor: [
            "#4F46E5",
            "#EC4899",
            "#10B981",
            "#F59E0B",
            "#6366F1",
            "#D946EF",
            "#EF4444",
            "#3B82F6",
          ],
          borderColor: "#FFFFFF",
          borderWidth: 2,
        },
      ],
    };
  }, [expensesByCategory]);

  if (loading)
    return <div className="p-4 text-center">Menyiapkan Dashboard...</div>;

  return (
    <>
      <AddPocketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddPocket}
      />
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 max-w-6xl">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Hi, {userName}!
              </h1>
              <p className="text-gray-500">{currentDate}</p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
            >
              Logout
            </button>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-lg">
                <h2 className="text-base font-medium uppercase tracking-wider opacity-80">
                  Total Saldo
                </h2>
                <p className="text-4xl font-bold tracking-tighter">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(totalSaldo)}
                </p>
              </section>
              <section>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-gray-800">Pockets</h2>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    + Tambah Pocket
                  </button>
                </div>
                {pockets.length > 0 ? (
                  <div className="space-y-3">
                    {pockets.map((pocket) => (
                      <Link
                        to={`/pocket/${pocket.id}`}
                        key={pocket.id}
                        className="block p-4 bg-white rounded-xl shadow hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-md text-gray-900">
                            {pocket.name}
                          </h3>
                          <span className="font-semibold text-gray-700">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(pocketBalances[pocket.id] || 0)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-white rounded-xl shadow">
                    <p className="text-gray-500 text-sm">
                      Anda belum punya pocket.
                    </p>
                  </div>
                )}
              </section>
              <section>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    Tabungan Impian
                  </h2>
                  <Link
                    to="/goals"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    + Kelola Impian
                  </Link>
                </div>
                {goals.length > 0 ? (
                  <div className="space-y-3">
                    {goals.map((goal) => {
                      const percentage =
                        goal.target_amount > 0
                          ? Math.min(
                              (goal.current_amount / goal.target_amount) * 100,
                              100
                            )
                          : 0;
                      return (
                        <Link
                          to="/goals"
                          key={goal.id}
                          className="block p-4 bg-white rounded-xl shadow hover:shadow-md transition"
                        >
                          <h3 className="font-bold text-md text-gray-900">
                            {goal.name}
                          </h3>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
                            <div
                              className="bg-yellow-400 h-2.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs flex justify-between">
                            <span>
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                              }).format(goal.current_amount)}
                            </span>
                            <span className="text-gray-500">
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                              }).format(goal.target_amount)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-white rounded-xl shadow">
                    <p className="text-gray-500 text-sm">
                      Anda belum punya impian untuk ditabung.
                    </p>
                    <Link
                      to="/goals"
                      className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Ayo Buat Impian Pertamamu &rarr;
                    </Link>
                  </div>
                )}
              </section>
              <section>
                <BudgetManager
                  categories={categories}
                  budgets={budgets}
                  onAddBudget={handleAddBudget}
                  onDeleteBudget={handleDeleteBudget}
                />
              </section>
              <section>
                <CategoryManager
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              </section>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/add-transaction"
                  title="Tambah Transaksi"
                  className="block w-full text-center p-4 bg-green-500 text-white rounded-xl shadow-lg hover:bg-green-600 transition"
                >
                  <span className="text-lg font-bold">+ Transaksi</span>
                </Link>
                <Link
                  to="/reports"
                  title="Lihat Laporan"
                  className="block w-full text-center p-4 bg-blue-500 text-white rounded-xl shadow-lg hover:bg-blue-600 transition"
                >
                  <span className="text-lg font-bold">📄 Laporan</span>
                </Link>
                <Link
                  to="/recurring"
                  title="Transaksi Otomatis"
                  className="block w-full text-center p-4 bg-purple-500 text-white rounded-xl shadow-lg hover:bg-purple-600 transition"
                >
                  <span className="text-lg font-bold">🤖 Otomatis</span>
                </Link>
              </div>
              <div className="p-5 bg-white rounded-xl shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Laporan Pengeluaran
                </h2>
                <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="text-sm font-medium text-gray-600"
                    >
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="text-sm font-medium text-gray-600"
                    >
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="w-full max-w-md mx-auto">
                  {transactions.length > 0 ? (
                    chartData.labels.length > 0 ? (
                      <Pie data={chartData} options={{ responsive: true }} />
                    ) : (
                      <p className="text-center text-gray-400 py-16">
                        Tidak ada data pengeluaran berkategori pada periode ini.
                      </p>
                    )
                  ) : (
                    <p className="text-center text-gray-400 py-16">
                      Tidak ada transaksi pada periode ini.
                    </p>
                  )}
                </div>
              </div>
              <section>
                <BudgetProgress
                  budgets={budgets}
                  expensesByCategory={expensesByCategory}
                />
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

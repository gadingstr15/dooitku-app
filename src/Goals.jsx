import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// Komponen Modal untuk Tambah Impian Baru
const AddGoalModal = React.memo(function AddGoalModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      toast.error("Nama dan Target Dana harus diisi.");
      return;
    }
    setLoading(true);
    await onSave(name, parseFloat(targetAmount));
    setLoading(false);
    setName("");
    setTargetAmount("");
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Buat Impian Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goalName" className="block text-sm font-medium">
              Nama Impian
            </label>
            <input
              id="goalName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Laptop Baru"
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium">
              Target Dana (Rp)
            </label>
            <input
              id="targetAmount"
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="15000000"
              className="mt-1 w-full p-2 border rounded-md"
            />
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
              className="px-4 py-2 text-white bg-indigo-600 rounded-md"
            >
              {loading ? "Menyimpan..." : "Simpan Impian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// Komponen Modal untuk Menambah Dana ke Impian
const AddFundsModal = React.memo(function AddFundsModal({
  isOpen,
  onClose,
  onSave,
  pockets,
}) {
  const [amount, setAmount] = useState("");
  const [sourcePocketId, setSourcePocketId] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (pockets.length > 0) setSourcePocketId(pockets[0].id);
  }, [pockets]);
  if (!isOpen) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !sourcePocketId) {
      toast.error("Jumlah dan sumber pocket harus diisi.");
      return;
    }
    setLoading(true);
    await onSave(parseFloat(amount), parseInt(sourcePocketId));
    setLoading(false);
    setAmount("");
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Tambah Dana</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fundAmount" className="block text-sm font-medium">
              Jumlah (Rp)
            </label>
            <input
              id="fundAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="sourcePocket" className="block text-sm font-medium">
              Ambil Dari Pocket
            </label>
            <select
              id="sourcePocket"
              value={sourcePocketId}
              onChange={(e) => setSourcePocketId(e.target.value)}
              required
              className="mt-1 w-full p-2 border rounded-md bg-white"
            >
              <option value="" disabled>
                Pilih Pocket
              </option>
              {pockets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
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
              className="px-4 py-2 text-white bg-green-600 rounded-md"
            >
              {loading ? "Menabung..." : "Tabung"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// Komponen Utama Halaman Goals
export default function Goals() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [pockets, setPockets] = useState([]);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    const goalsPromise = supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    const pocketsPromise = supabase
      .from("pockets")
      .select("id, name")
      .eq("user_id", user.id);
    const [{ data: goalsData }, { data: pocketsData }] = await Promise.all([
      goalsPromise,
      pocketsPromise,
    ]);
    setGoals(goalsData || []);
    setPockets(pocketsData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddGoal = async (name, targetAmount) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("goals")
      .insert([{ name, target_amount: targetAmount, user_id: user.id }]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Impian baru berhasil dibuat!");
    setIsAddGoalModalOpen(false);
    await fetchData();
  };

  const handleAddFunds = async (amount, sourcePocketId) => {
    const { error } = await supabase.rpc("add_funds_to_goal", {
      p_goal_id: selectedGoal.id,
      p_pocket_id: sourcePocketId,
      p_amount: amount,
    });
    if (error) {
      toast.error("Gagal menabung: " + error.message);
      return;
    }
    toast.success(`Berhasil menabung untuk "${selectedGoal.name}"!`);
    setIsAddFundsModalOpen(false);
    // KUNCI PERBAIKAN: Panggil ulang fetch setelah berhasil
    await fetchData();
  };

  const handleDeleteGoal = async (goalId, goalName) => {
    if (
      window.confirm(
        `Yakin ingin menghapus impian "${goalName}"? Dana yang terkumpul tidak akan dikembalikan.`
      )
    ) {
      const { error } = await supabase.from("goals").delete().eq("id", goalId);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Impian berhasil dihapus.");
      await fetchData();
    }
  };

  return (
    <>
      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onSave={handleAddGoal}
      />
      <AddFundsModal
        isOpen={isAddFundsModalOpen}
        onClose={() => setIsAddFundsModalOpen(false)}
        onSave={handleAddFunds}
        pockets={pockets}
      />

      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <Link
          to="/"
          className="inline-block mb-6 text-indigo-600 hover:underline"
        >
          &larr; Kembali ke Dashboard
        </Link>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Tabungan Impian
            </h1>
            <p className="text-gray-500">
              Kelola dan lacak semua tujuan finansial Anda.
            </p>
          </div>
          <button
            onClick={() => setIsAddGoalModalOpen(true)}
            className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Buat Impian Baru
          </button>
        </header>

        <section className="space-y-4">
          {loading ? (
            <p>Memuat...</p>
          ) : goals.length > 0 ? (
            goals.map((goal) => {
              const percentage =
                goal.target_amount > 0
                  ? Math.min(
                      (goal.current_amount / goal.target_amount) * 100,
                      100
                    )
                  : 0;
              return (
                <div
                  key={goal.id}
                  className="p-4 bg-white rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-bold text-lg">{goal.name}</h2>
                      <p className="text-sm text-gray-500">
                        Terkumpul:{" "}
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(goal.current_amount)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedGoal(goal);
                          setIsAddFundsModalOpen(true);
                        }}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
                      >
                        Tabung
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id, goal.name)}
                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 my-2">
                    <div
                      className="bg-yellow-400 h-4 rounded-full text-center text-white text-xs font-bold flex items-center justify-center"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 10 && `${Math.round(percentage)}%`}
                    </div>
                  </div>
                  <p className="text-xs text-right text-gray-500">
                    Target:{" "}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(goal.target_amount)}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-10">
              Anda belum memiliki impian. Ayo buat satu!
            </p>
          )}
        </section>
      </div>
    </>
  );
}

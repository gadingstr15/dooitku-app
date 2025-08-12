// src/Auth.jsx
import { useState } from "react";
import { supabase } from "./supabaseClient";
import toast from "react-hot-toast"; // <-- Import toast

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // <-- State baru untuk nama

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) toast.error(error.error_description || error.message); // <-- Ganti alert
    setLoading(false);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (!fullName) {
      toast.error("Nama lengkap tidak boleh kosong."); // <-- Ganti alert
      return;
    }
    setLoading(true);
    // Di sini kita tambahkan 'options' untuk menyimpan data tambahan (nama)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.error_description || error.message); // <-- Ganti alert
    } else {
      toast.success("Pendaftaran berhasil! Silakan login."); // <-- Ganti alert
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-indigo-600">
          DooitKu
        </h1>
        <p className="text-center text-gray-500">Masuk atau buat akun baru</p>
        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Input Nama Lengkap (hanya untuk daftar, tapi kita tampilkan saja) */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Nama Lengkap
            </label>
            <input
              id="fullName"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              type="text"
              placeholder="Gading Marten"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              placeholder="email@anda.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Memuat..." : "Masuk"}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="w-full px-4 py-2 font-bold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50"
            >
              {loading ? "Memuat..." : "Daftar Akun Baru"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

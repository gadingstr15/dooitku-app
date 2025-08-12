import React, { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

// Impor semua halaman secara dinamis untuk code-splitting
const Auth = lazy(() => import("./Auth"));
const Dashboard = lazy(() => import("./Dashboard"));
const PocketDetail = lazy(() => import("./PocketDetail"));
const AddGeneralTransaction = lazy(() => import("./AddGeneralTransaction"));
const Reports = lazy(() => import("./Reports"));
const Recurring = lazy(() => import("./Recurring"));
const Goals = lazy(() => import("./Goals"));

// Komponen placeholder untuk layar tunggu saat halaman diunduh
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-50">
    <p className="text-lg text-gray-600">Memuat halaman...</p>
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === "SIGNED_OUT") {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Layar tunggu awal untuk pemeriksaan sesi
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Memuat aplikasi...</p>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      {/* Bungkus semua rute dengan Suspense */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {!session ? (
            <Route path="*" element={<Auth />} />
          ) : (
            <>
              <Route path="/" element={<Dashboard session={session} />} />
              <Route
                path="/pocket/:id"
                element={<PocketDetail session={session} />}
              />
              <Route
                path="/add-transaction"
                element={<AddGeneralTransaction session={session} />}
              />
              <Route path="/reports" element={<Reports session={session} />} />
              <Route
                path="/recurring"
                element={<Recurring session={session} />}
              />
              <Route path="/goals" element={<Goals session={session} />} />
            </>
          )}
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;

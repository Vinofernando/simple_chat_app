import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../utils/axiosIntsance";
import "../styles/popup-card.css";
import { usePopup } from "..//context/PopupContext";

export default function Login() {
  const { showPopup } = usePopup();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginFailed, setLoginFailed] = useState("");
  const navigate = useNavigate();

  const loginHandler = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post("/auth/login", {
        email,
        password,
      });

      showPopup("Login berhasil", true);
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Struktur Error Lengkap dari Axios:", error.response);
        const errorMessage =
          error.response?.data?.message || "Terjadi kesalahan pada server";
        // callPopup("Email atau password salah");
        showPopup("Email atau password salah", false);
        console.error("Pesan Eror yang Ditangkap FE:", errorMessage);
        setLoginFailed(errorMessage);
      } else if (error instanceof Error) {
        console.error("Generic Error:", error.message);
      }
    }
  };

  useEffect(() => {
    if (!loginFailed) return;

    const timeOut = setTimeout(() => {
      setLoginFailed("");
    }, 3000);
    return () => clearTimeout(timeOut);
  }, [loginFailed]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="flex flex-col">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={loginHandler}>
          <div className="space-y-4 rounded-md">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="relative block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="relative block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

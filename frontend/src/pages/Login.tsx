import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../utils/axiosIntsance";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const loginHandler = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log(response);
      alert("login berhasil");
      setIsLoading(false);
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 1. LOG TERLEBIH DAHULU UNTUK INSPEKSI
        console.log("Struktur Error Lengkap dari Axios:", error.response);

        // 2. Ambil data pesan dengan aman
        // Sesuaikan dengan apa yang dikirim backend (res.status(400).send({ message: ... }))
        const errorMessage =
          error.response?.data?.message || "Terjadi kesalahan pada server";

        console.error("Pesan Eror yang Ditangkap FE:", errorMessage);
        alert(errorMessage);
        // Tampilkan errorMessage ini ke UI/State kamu
      } else if (error instanceof Error) {
        console.error("Generic Error:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading-center">Memuat data user</div>;
  }

  return (
    <form action="submit" onSubmit={loginHandler}>
      <input
        type="text"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <input
        type="text"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      <button>Login</button>
    </form>
  );
}

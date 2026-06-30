import axios from "axios";

// Buat instance khusus agar interceptor tidak mengganggu request lain
const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// Response Interceptor: Menangkap semua respon dari backend sebelum masuk ke block catch() fungsi kamu
api.interceptors.response.use(
  (response) => response, // Jika sukses (2xx), teruskan saja
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      try {
        console.log("Acces token kedaluwarsa, mencoba refresh token...");

        await axios.get("http://localhost:3000/auth/refresh", {
          withCredentials: true,
        });

        console.log("Refresh token sukses! Mengulangi request yang gagal...");

        return api(originalRequest);
      } catch (refreshError) {
        console.log(
          "Refresh token juga expired atau tidak valid. User harus login ulang",
        );

        alert("Sesi anda telah berakhir sepenuhnya. Silahkan login kembali");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

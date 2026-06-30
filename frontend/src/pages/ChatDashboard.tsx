import { useEffect, useState } from "react";
import api from "../utils/axiosIntsance";
import axios from "axios";
import type { Friend } from "../interface/connectionInterface";

export default function ChatDashbord() {
  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function getFriendList() {
    setIsLoading(true);
    try {
      const response = await api.get("/connection/friend-list");

      setFriendList(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Struktur Error Lengkap dari Axios:", error.response);

        const errorMessage =
          error.response?.data?.message || "Terjadi kesalahan pada server";

        console.error("Pesan Eror yang Ditangkap FE:", errorMessage);
        alert(errorMessage);
      } else if (error instanceof Error) {
        console.error("Generic Error:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getFriendList();
    console.log(friendList);
  }, []);

  if (isLoading) {
    return <div className="loading-center">Memuat data user</div>;
  }

  return (
    <div>
      <ul>
        {friendList.map((friend) => (
          <li key={friend.friend_code}>
            {friend.to_user} | {friend.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

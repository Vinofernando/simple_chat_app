import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import api from "../utils/axiosIntsance";
import defaultProfile from "../assets/default-profile.jpg";
import "../styles/popup-card.css";
import { usePopup } from "../context/PopupContext";

interface Profile {
  username: string;
  friend_code: string;
}

interface SendRequest {
  from_user: string;
  from_code: string;
}

interface SendedRequest {
  to_name: string;
  friend_code: string;
}

export default function AddFriendCard({
  toggleHandleFriendMenu,
  handleAddFriend,
  setFriendCode,
  friendCode,
  setFriendList,
  profile,
}: any) {
  // State untuk melacak tab mana yang sedang aktif
  const { showPopup } = usePopup();
  const [activeTab, setActiveTab] = useState("add");
  const [sendedRequest, setSendedRequest] = useState<SendedRequest[]>([]);
  const [getStrangerProfile, setGetStrangerProfile] = useState<Profile[]>([]);
  const [friendRequest, setFriendRequest] = useState<SendRequest[]>([]);
  const [getAddedUser, setGetAddedUser] = useState("");

  const tabs = [
    { id: "add", label: "Add Friend" },
    { id: "request", label: "Request" },
    { id: "sent", label: "Sent" },
  ];

  const fetchSendedRequest = async () => {
    try {
      const response = await api.get("/connection/sended-request");
      console.log(response.data.data);
      setSendedRequest(response.data.data);
    } catch (error) {
      console.error("Error medapatkan list:", error);
    }
  };

  useEffect(() => {
    fetchSendedRequest();
  }, []);

  const getProfileByCode = async () => {
    if (friendCode.length > 0) {
      try {
        const response = await api.get(
          `/connection/get-profile-by-code?friendCode=${friendCode ? encodeURIComponent(friendCode) : ""}`,
        );

        setGetStrangerProfile(response.data.data);
        console.log(response);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message || "Terjadi kesalahan pada server";
          console.error("Pesan Eror yang Ditangkap FE:", errorMessage);
          alert(errorMessage);
        } else if (error instanceof Error) {
          console.error("Generic Error:", error.message);
        }
      }
    } else {
      setGetStrangerProfile([]);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getProfileByCode();
    }, 500);
    return () => {
      clearTimeout(delayDebounce);
    };
  }, [friendCode]);

  useEffect(() => {
    async function fetchFriendRequest() {
      try {
        const response = await api.get("/connection/get-friend-request");
        console.log("friend request: ", response);
        setFriendRequest(response.data.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorMessage =
            error.response?.data?.message || "Terjadi kesalahan pada server";
          console.error("Pesan Eror yang Ditangkap FE:", errorMessage);
          alert(errorMessage);
        } else if (error instanceof Error) {
          console.error("Generic Error:", error.message);
        }
      }
    }
    fetchFriendRequest();
  }, []);

  const handleRequest = async (
    status: any,
    toCode: any,
    username: string | "",
  ) => {
    try {
      await api.post("/connection/friend-request", {
        toCode,
        status,
      });
      if (status === "cancel") {
        const newFriendReq = friendRequest.filter(
          (item) => item.from_code !== toCode,
        );
        const newFriendSent = sendedRequest.filter(
          (item) => item.friend_code !== toCode,
        );
        setFriendRequest(newFriendReq);
        setSendedRequest(newFriendSent);
        showPopup("Berhasil membatalkan permintaan teman", true);
        return;
      }
      if (status === "accept") {
        showPopup("Berhasil menerima permintaan teman", true);
        const newFriend = {
          friend_code: toCode,
          from_user: profile.name,
          status: status,
          to_name: username,
        };
        setFriendList((prev: any) => [...prev, newFriend]);
        const newFriendReq = friendRequest.filter(
          (item) => item.from_code !== toCode,
        );
        setFriendRequest(newFriendReq);
        return newFriend;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Terjadi kesalahan pada server";
        console.error("Pesan Eror yang Ditangkap FE:", errorMessage);
        alert(errorMessage);
      } else if (error instanceof Error) {
        console.error("Generic Error:", error.message);
      }
    }
  };

  return (
    // Animasi munculnya backdrop saat modal terbuka

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
    >
      {/* Animasi Pop-up Card Utama */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl h-2/3"
      >
        {/* Header Card */}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-200 tracking-tight">
            Menu Pertemanan
          </h2>
          <button
            onClick={toggleHandleFriendMenu}
            className="text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/60 mb-4 relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-2 px-3 text-xs font-semibold rounded-lg transition-colors duration-200 cursor-pointer z-10 ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {/* Ini adalah background pill yang akan bergeser secara halus.
                  Framer motion mendeteksi layoutId yang sama dan menganimasikan perpindahannya.
                */}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-indigo-600 rounded-lg shadow-md -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Konten Berubah Tergantung Tab yang Aktif */}
        <div className="py-8 border-t border-dashed border-slate-800 text-center text-sm text-slate-500">
          {activeTab === "add" && (
            <div>
              <form
                onSubmit={handleAddFriend}
                className="gap-2 flex justify-center"
              >
                <input
                  type="text"
                  placeholder="Ex: #123456"
                  className="bg-slate-700 rounded-xl p-1 text-amber-50 w-full"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-slate-50 px-3 py-2 rounded-xl"
                >
                  Add
                </button>
              </form>
              {getStrangerProfile.length > 0 &&
                getStrangerProfile.map((item) => (
                  <div
                    key={item.friend_code}
                    className="flex flex-col justify-center items-center bg-indigo-800 h-full my-7.5 rounded-2xl"
                  >
                    <img
                      src={defaultProfile}
                      className="w-1/3 rounded-[50%]"
                    ></img>
                    <h1 className="text-slate-50">{item.username}</h1>
                    <h1 className="text-slate-50">{item.friend_code}</h1>
                  </div>
                ))}
            </div>
          )}
          {activeTab === "request" && (
            <div>
              {friendRequest.length > 0 &&
                friendRequest.map((friend) => (
                  <div className="flex justify-between bg-slate-700 px-2 py-1 rounded-2xl">
                    {" "}
                    <h1 className="text-slate-50">
                      {friend.from_user} | <span>{friend.from_code}</span>
                    </h1>
                    <div className="gap-2 flex">
                      <button
                        onClick={() => {
                          handleRequest("cancel", friend.from_code, "");
                        }}
                      >
                        ❌
                      </button>
                      <button
                        onClick={() => {
                          handleRequest(
                            "accept",
                            friend.from_code,
                            friend.from_user,
                          );
                        }}
                      >
                        ✅
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {activeTab === "sent" && (
            <div>
              <div>
                {sendedRequest.map((friend) => (
                  <div
                    key={friend.friend_code}
                    className="flex gap-1 justify-between bg-slate-700 p-2 rounded-2xl transition delay-10 duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
                    onClick={() => setGetAddedUser(friend.friend_code)}
                  >
                    <p className="text-slate-50">
                      {friend.to_name} |
                      <span className="text-gray-400">
                        {friend.friend_code}
                      </span>
                    </p>
                    <div className="flex g-2">
                      <button
                        onClick={() => {
                          handleRequest("cancel", friend.friend_code, "");
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

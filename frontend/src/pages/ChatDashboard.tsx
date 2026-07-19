import { useEffect, useState, useRef } from "react";
import api from "../utils/axiosIntsance";
import axios from "axios";
import type { Friend } from "../interface/connectionInterface";
import AddFriendCard from "./AddFriendCard";
import "../styles/chat-dashboard.css";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";

interface ChatMessage {
  fromCode?: string;
  toCode: string;
  from?: string;
  to?: string;
  text: string;
}
interface Profile {
  id: number;
  name: string;
  email: string;
  friendCode: string;
}

export default function ChatDashboard() {
  const { showPopup } = usePopup();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friendList, setFriendList] = useState<Friend[]>(() => {
    const savedFriends = localStorage.getItem("friendList");
    if (savedFriends) {
      try {
        return JSON.parse(savedFriends) as Friend[];
      } catch (error) {
        console.error("Failed to parse friendList from localStorage", error);
        return []; // Balikkan array kosong jika JSON corrupt
      }
    }

    return [];
  });
  const [searchFriend, setSearchFriend] = useState<string>("");

  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isWsReady, setIsWsReady] = useState(false);

  const [inputMessage, setInputMessage] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [friendTypingStatus, setFriendTypingStatus] = useState<
    "sedang_ketik" | ""
  >("");

  const [handleFriendMenu, setHandleFriendMenu] = useState(false);
  const [friendCode, setFriendCode] = useState("");
  // Menggunakan ref untuk menyimpan activeFriend agar bisa dibaca di dalam event listener WebSocket tanpa re-render socket
  const activeFriendRef = useRef<Friend | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const isFirstRender = useRef(true);

  const reconnectTimeoutRef = useRef<number | null>(null);

  const navigate = useNavigate();
  useEffect(() => {
    activeFriendRef.current = activeFriend;
  }, [activeFriend]);

  // Fetch Profil User
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        setProfile(response.data.user);
        profileRef.current = response.data.user;
        console.log("response data user: ", response.data.user);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  async function getFriendList() {
    try {
      const response = await api.get(
        `/connection/friend-list${searchFriend ? `?searchByName=${searchFriend}` : ""}`,
      );
      setFriendList(response.data.data);
      localStorage.setItem("friendList", JSON.stringify(response.data.data));
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

  const handleAddFriend = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await api.post("/connection/add-friend", {
        friendCode,
      });
      console.log(response);
      showPopup("Berhasil mengirim permintaan teman", true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(friendCode);
        console.log("Struktur Error Lengkap dari Axios:", error.response);
        const errorMessage =
          error.response?.data?.message || "Terjadi kesalahan pada server";
        alert(error.response?.data.error);
        console.error("Pesan Eror yang Ditangkap FE:", errorMessage);
      } else if (error instanceof Error) {
        console.error("Generic Error:", error.message);
      }
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getFriendList();
    }, 500);
    searchInputRef.current?.focus();
    return () => {
      clearTimeout(delayDebounce);
    };
  }, [searchFriend]);
  // Lifecycle untuk inisialisasi WebSocket dan Friend List
  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket(`ws://192.168.1.14:3000/chat`);
      ws.current = socket;

      socket.onopen = () => {
        console.log("Koneksi WebSocket berhasil dibuka.");
        setIsWsReady(true);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socket.onmessage = (event: any) => {
        const response = JSON.parse(event.data);
        console.log("response: ", response);
        if (response.action === "sedang_ketik") {
          const currentActiveFriend = activeFriendRef.current;
          if (
            currentActiveFriend &&
            response.payload.fromCode === currentActiveFriend.friend_code
          ) {
            setFriendTypingStatus("sedang_ketik");
          }
        } else if (response.action === "berhenti_mengetik") {
          const currentActiveFriend = activeFriendRef.current;
          if (
            currentActiveFriend &&
            response.payload.fromCode === currentActiveFriend.friend_code
          ) {
            setFriendTypingStatus("");
          }
        }

        const currentActiveFriend = activeFriendRef.current;
        // 🛠️ PERBAIKAN 1: Menangani pemuatan riwayat chat awal
        if (response.action === "riwayat_chat") {
          const { friendCode, messages } = response.payload;

          if (
            currentActiveFriend &&
            friendCode === currentActiveFriend.friend_code
          ) {
            setChatHistory(messages);
          }
          // setChatHistory(response.payload);
        }

        // 🛠️ PERBAIKAN 2: Menangani pesan masuk baru dari server (sesuaikan nama action "kirim_chat" / "terima_chat" dengan backend-mu)
        else if (response.action === "terima_chat_private") {
          const incomingMessage = response.payload;

          console.log("incoming message :", incomingMessage);
          // Pastikan pesan yang masuk berasal dari teman yang sedang aktif kita ajak chat
          const currentActiveFriend = activeFriendRef.current;
          const currentProfile = profileRef.current;

          console.log("currentActiveFriend: ", currentActiveFriend);
          console.log("currentProfile: ", currentProfile);
          if (
            currentActiveFriend &&
            (incomingMessage.fromCode === currentActiveFriend.friend_code ||
              incomingMessage.toCode === currentActiveFriend.friend_code)
          ) {
            // Hanya tambahkan ke layar jika pesannya bukan dari diri sendiri (karena kirim_chat lokal sudah nge-push manual)
            if (incomingMessage.fromCode !== currentProfile?.friendCode) {
              setChatHistory((prev) => [...prev, incomingMessage]);
            }
          }
        }
      };

      socket.onclose = (event) => {
        console.log(
          `Koneksi websocket ditutup ❌ (Code: ${event.code}). Memicu reconnect...`,
        );
        setIsWsReady(false);

        // Mencegah penumpukan timeout jika fungsi terpanggil dua kali (Strict Mode)
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);

        // 🛠️ AUTO-RECONNECT: Coba koneksi ulang otomatis setiap 3 detik jika terputus tidak normal
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket mendeteksi error:", error);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);

      if (
        ws.current &&
        (ws.current.readyState === WebSocket.OPEN ||
          ws.current.readyState === WebSocket.CONNECTING)
      ) {
        ws.current.close(1000, "Komponen di-unmount atau di-refresh");
      }
    };
  }, []);

  // Ambil riwayat chat setiap kali ganti teman
  useEffect(() => {
    if (
      activeFriend &&
      isWsReady &&
      ws.current?.readyState === WebSocket.OPEN
    ) {
      const requestPayload = {
        action: "riwayat_chat",
        payload: {
          toCode: activeFriend.friend_code,
        },
      };
      ws.current.send(JSON.stringify(requestPayload));
    }
  }, [activeFriend, isWsReady, searchFriend]);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFriendClick = (friend: Friend) => {
    if (activeFriend?.friend_code === friend.friend_code) {
      return; // Jika teman yang diklik sama dengan teman aktif, tidak perlu melakukan apa-apa
    }
    setChatHistory([]); // Reset chat history agar tidak berbayang dengan teman sebelumnya
    setFriendTypingStatus("");
    setActiveFriend(friend);
    setInputMessage("");
    console.log(activeFriend);
  };

  const handleSendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setInputMessage("");

    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      activeFriend
    ) {
      const requestPayload = {
        action: "kirim_chat",
        payload: {
          toCode: activeFriend.friend_code,
          to: activeFriend.to_name,
          text: inputMessage,
        },
      };

      ws.current.send(JSON.stringify(requestPayload));

      sendTypingStatus("berhenti_mengetik");
      // Menambahkan pesan secara lokal ke state agar UI langsung terupdate (Optimistic UI)
      const pesanBaruLokal: ChatMessage = {
        fromCode: profile?.friendCode,
        toCode: activeFriend.friend_code || "",
        from: profile?.name,
        to: activeFriend.to_name,
        text: inputMessage,
      };

      console.log(chatHistory.length);
      setChatHistory((prevHistory) => [...prevHistory, pesanBaruLokal]);
      console.log(chatHistory.length);
      console.log(chatHistory);
    }
  };

  const handleClearSearch = () => {
    setSearchFriend("");

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const sendTypingStatus = (status: "sedang_ketik" | "berhenti_mengetik") => {
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      activeFriend
    ) {
      const requestPayload = {
        action: status,
        payload: {
          to: activeFriend.friend_code,
        },
      };
      ws.current.send(JSON.stringify(requestPayload));
    }
  };
  useEffect(() => {
    if (!activeFriend) {
      return;
    }
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!inputMessage.trim()) {
      sendTypingStatus("berhenti_mengetik");
      return;
    }

    sendTypingStatus("sedang_ketik");

    const debounceTimeout = setTimeout(() => {
      sendTypingStatus("berhenti_mengetik");
    }, 500);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [inputMessage, activeFriend]);

  const toggleHandleFriendMenu = async () => {
    setHandleFriendMenu((prev) => !prev);
  };
  useEffect(() => {
    console.log("Chat history terbaru:", chatHistory);
    console.log("Panjang data terbaru:", chatHistory.length);
    console.log("FriendList:", friendList);
  }, [chatHistory, friendList]);

  const handleLogout = async () => {
    navigate("/login");
    return;
  };
  return (
    <div className="chat-dashboard flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR: FRIEND LIST */}
      <div className="friend-list w-80 border-r border-slate-800 bg-slate-900 flex flex-col p-4 shrink-0">
        <div className="flex items-center justify-between mb-4 bg-white/10 backdrop-blur-sm p-3 rounded-xl">
          <h1 className=" font-bold tracking-tight text-sky-400 truncate mr-3">
            {profile?.name}
            <span className="text-gray-400">{profile?.friendCode}</span>
          </h1>
          <button
            className="bg-red-700 px-3 py-2 rounded-2xl transition-colors delay-10 duration-300 ease-in-out hover:bg-red-900"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
        <div className="relative flex items-center mb-4">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari teman..."
            value={searchFriend}
            onChange={(e) => setSearchFriend(e.target.value)}
            className="w-full rounded-full bg-slate-800 border border-slate-700 py-2 pl-4 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />

          {searchFriend.length > 0 && (
            <button
              onClick={handleClearSearch}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              className="absolute right-3 text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <div>
          <button className="handle-friend" onClick={toggleHandleFriendMenu}>
            Friend
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {friendList.map((friend) => {
            const isActive = activeFriend?.friend_code === friend.friend_code;
            return (
              <li
                key={friend.friend_code}
                onClick={() => handleFriendClick(friend)}
                className={`friend-item flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              >
                <span className="truncate">{friend.to_name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md ${isActive ? "bg-indigo-700 text-indigo-200" : "bg-slate-800 text-slate-500"}`}
                >
                  {friend.friend_code}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {handleFriendMenu && (
        <AddFriendCard
          handleAddFriend={handleAddFriend}
          toggleHandleFriendMenu={toggleHandleFriendMenu}
          setFriendCode={setFriendCode}
          friendCode={friendCode}
          friendList={friendList}
          setFriendList={setFriendList}
          profile={profile}
        />
      )}
      {/* MAIN AREA: CHAT SCREEN */}
      <div className="chat-area flex-1 flex flex-col bg-slate-950">
        {activeFriend ? (
          <div className="chat-box flex flex-col h-full">
            {/* CHAT HEADER */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <h3 className="text-base font-semibold text-slate-200">
                Chat dengan{" "}
                <span className="text-indigo-400">{activeFriend.to_name}</span>
              </h3>
            </div>

            {/* MESSAGES BODY */}
            <div className="messages flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="no-chat text-sm text-slate-500 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                    Belum ada obrolan
                  </p>
                </div>
              ) : (
                chatHistory.map((message, index) => {
                  const isMe = message.fromCode === profile?.friendCode;

                  return (
                    <div
                      key={index}
                      className={`message-wrapper flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`message-bubble max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all
                      ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50"
                      }`}
                      >
                        <strong
                          className={`block text-[10px] uppercase tracking-wider mb-1 opacity-75 font-bold ${isMe ? "text-indigo-200" : "text-slate-400"}`}
                        >
                          {isMe ? "Saya" : message.from}
                        </strong>
                        <span className="whitespace-pre-wrap wrap-break-words leading-relaxed">
                          {message.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* TYPING INDICATOR & INPUT FORM */}
            <div className="p-4 bg-slate-900/40 border-t border-slate-800/80">
              {friendTypingStatus === "sedang_ketik" && (
                <div className="typing-indicator text-xs italic text-indigo-400 mb-2 animate-pulse flex items-center gap-1 pl-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  {activeFriend?.to_name} sedang mengetik...
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="chat-form flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Tulis pesan..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer shrink-0"
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="empty-chat h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-slate-600 rounded-2xl flex items-center justify-center mb-4 text-2xl">
              💬
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Pilih teman di sebelah kiri untuk mulai melihat dan mengirim
              riwayat obrolan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

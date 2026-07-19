import { createContext, useContext, useState, type ReactNode } from "react";
import PopupEvent from "..//components/popupEvent"; // Sesuaikan path komponen kamu
import { AnimatePresence } from "framer-motion";

interface PopupContextType {
  showPopup: (message: string, status: boolean) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function PopupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(true);

  function showPopup(msg: string, stat: boolean = true) {
    setMessage(msg);
    setStatus(stat);
    setIsOpen(true);

    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 2000);

    return () => clearTimeout(timer);
  }

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}
      <AnimatePresence mode="wait">
        {isOpen && <PopupEvent loginStatus={status} popupMessage={message} />}
      </AnimatePresence>
    </PopupContext.Provider>
  );
}
export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup harus digunakan di dalam PopupProvider");
  }
  return context;
}

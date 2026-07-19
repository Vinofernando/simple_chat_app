import "../styles/popup-card.css";
import { motion } from "framer-motion";

export default function PopupEvent({ loginStatus, popupMessage }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "-100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{
        duration: 0.4,
        ease: "easeInOut",
      }}
      id="custom-toast"
      className={`toast-card ${loginStatus ? "bg-[#bfffc0]" : "bg-[#f94d4db0]"}`}
    >
      <div className="toast-icon">{loginStatus ? "✓" : "X"}</div>
      <div className="toast-content">
        <p id="toast-message">{popupMessage}</p>
      </div>
    </motion.div>
  );
}

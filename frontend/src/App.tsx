import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatDashbord from "./pages/ChatDashboard";
import Login from "./pages/Login";
import { PopupProvider } from "./context/PopupContext";

function App() {
  return (
    <PopupProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChatDashbord />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </PopupProvider>
  );
}

export default App;

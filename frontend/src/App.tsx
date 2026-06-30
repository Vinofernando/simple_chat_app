import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatDashbord from "./pages/ChatDashboard";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatDashbord />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

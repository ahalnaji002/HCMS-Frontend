import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import Login from "./pages/auth/Login";
import RegisterPatient from "./pages/auth/RegisterPatient";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register/patient" element={<RegisterPatient />} />
    </Routes>
  );
}

export default App;

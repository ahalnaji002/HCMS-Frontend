import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import Login from "./pages/auth/Login";
import RegisterPatient from "./pages/auth/RegisterPatient";
import RegisterProfessional from "./pages/auth/RegisterProfessional";
import RequireRole from "./components/auth/RequireRole";
import RoleHome from "./pages/role/RoleHome";
import { roleRoutes } from "./services/roleRoutes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register/patient" element={<RegisterPatient />} />
      <Route
        path="/register/doctor"
        element={<RegisterProfessional role="doctor" />}
      />
      <Route
        path="/register/ngo"
        element={<RegisterProfessional role="ngo" />}
      />
      {Object.entries(roleRoutes).map(([role, path]) => (
        <Route
          key={role}
          path={path}
          element={
            <RequireRole role={role}>
              <RoleHome role={role} />
            </RequireRole>
          }
        />
      ))}
    </Routes>
  );
}

export default App;

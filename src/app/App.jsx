import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import RequireRole from "@/presentation/components/auth/RequireRole";
import RouteLoadingFallback from "@/presentation/components/common/RouteLoadingFallback";
import { ToastProvider } from "@/presentation/components/ui";
import { roleRoutes } from "@/presentation/routing/roleRoutes";

const LandingPage = lazy(() => import("@/presentation/pages/landing/LandingPage"));
const Login = lazy(() => import("@/presentation/pages/auth/Login"));
const RegisterPatient = lazy(
  () => import("@/presentation/pages/auth/RegisterPatient"),
);
const RegisterProfessional = lazy(
  () => import("@/presentation/pages/auth/RegisterProfessional"),
);
const RoleHome = lazy(() => import("@/presentation/pages/role/RoleHome"));
const PatientHome = lazy(() => import("@/presentation/pages/role/PatientHome"));
const AdminHome = lazy(() => import("@/presentation/pages/role/AdminHome"));
const DoctorHome = lazy(() => import("@/presentation/pages/role/DoctorHome"));
const NgoHome = lazy(() => import("@/presentation/pages/role/NgoHome"));
// Component gallery: development builds only, never shipped.
const UiGallery = import.meta.env.DEV ? lazy(() => import("@/presentation/pages/dev/UiGallery")) : null;

function App() {
  return (
    <ToastProvider>
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        {UiGallery && <Route path="/dev/ui" element={<UiGallery />} />}
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
            path={`${path}/*`}
            element={
              <RequireRole role={role}>
                {role === "PATIENT" ? (
                  <PatientHome />
                ) : role === "ADMIN" ? (
                  <AdminHome />
                ) : role === "DOCTOR" ? (
                  <DoctorHome />
                ) : role === "NGO" ? (
                  <NgoHome />
                ) : (
                  <RoleHome role={role} />
                )}
              </RequireRole>
            }
          />
        ))}
      </Routes>
    </Suspense>
    </ToastProvider>
  );
}

export default App;

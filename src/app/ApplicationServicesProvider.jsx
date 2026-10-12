import { ApplicationServicesContext } from "@/app/applicationServicesContext";

export function ApplicationServicesProvider({ services, children }) {
  return (
    <ApplicationServicesContext.Provider value={services}>
      {children}
    </ApplicationServicesContext.Provider>
  );
}

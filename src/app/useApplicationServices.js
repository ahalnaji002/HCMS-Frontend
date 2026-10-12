import { useContext } from "react";
import { ApplicationServicesContext } from "@/app/applicationServicesContext";

export function useApplicationServices() {
  const services = useContext(ApplicationServicesContext);
  if (!services) throw new Error("Application services provider is missing");
  return services;
}

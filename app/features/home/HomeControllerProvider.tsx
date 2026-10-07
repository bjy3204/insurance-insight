"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useHomeController, type HomeController } from "./hooks/useHomeController";
import NpsTableModal from "@/app/components/NpsTableModal";
import MenuContextMenu from "./components/MenuContextMenu";
import QuickMenuPanel from "./components/QuickMenuPanel";
import QuickMenuSelectionDialog from "./components/QuickMenuSelectionDialog";
import QuickMenuLimitDialog from "./components/QuickMenuLimitDialog";
import DeleteQuickMenuDialog from "./components/DeleteQuickMenuDialog";
import HospitalDialog from "./components/HospitalDialog";
import DiseaseDialog from "./components/DiseaseDialog";
import BankRatesDialog from "./components/BankRatesDialog";
import LifeExpectancyDialog from "./components/LifeExpectancyDialog";
import PressDialog from "./components/PressDialog";

const HomeControllerContext = createContext<HomeController | null>(null);

export function useSharedHomeController() {
  const controller = useContext(HomeControllerContext);
  if (!controller) throw new Error("HomeControllerProvider is required");
  return controller;
}

export default function HomeControllerProvider({ children }: { children: ReactNode }) {
  const controller = useHomeController();
  return (
    <HomeControllerContext.Provider value={controller}>
      {children}
      <MenuContextMenu controller={controller} />
      <QuickMenuPanel controller={controller} />
      <QuickMenuSelectionDialog controller={controller} />
      <QuickMenuLimitDialog controller={controller} />
      <DeleteQuickMenuDialog controller={controller} />
      <HospitalDialog controller={controller} />
      <DiseaseDialog controller={controller} />
      <BankRatesDialog controller={controller} />
      <LifeExpectancyDialog controller={controller} />
      <PressDialog controller={controller} />
      {controller.npsTableOpen && (
        <NpsTableModal onClose={() => controller.setNpsTableOpen(false)} />
      )}
    </HomeControllerContext.Provider>
  );
}

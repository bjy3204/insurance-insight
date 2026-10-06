"use client";

import FortuneCookie from "@/app/components/FortuneCookie";
import type { HomeController } from "../hooks/useHomeController";
export default function FortuneWidget({ controller }: { controller: HomeController }) {
const { fortuneOpen, setFortuneOpen, open } = controller;
return (<><FortuneCookie
    open={fortuneOpen}
    onClose={() => setFortuneOpen(false)}
  /></>);
}

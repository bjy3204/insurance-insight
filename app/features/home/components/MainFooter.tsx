"use client";
import SiteFooter from '@/app/components/SiteFooter';
import type { HomeController } from '../hooks/useHomeController';

export default function MainFooter({ controller }: { controller: HomeController }) {
  return controller.mainMenuManageMode === 'normal' ? <SiteFooter /> : null;
}

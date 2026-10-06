import type { ReactNode } from "react";
import styles from "./SiteHeader.module.css";

type SiteHeaderProps = {
  children: ReactNode;
  variant?: "main" | "page";
};

/** Page-owned controls retain their handlers and permission checks. */
export default function SiteHeader({ children, variant = "page" }: SiteHeaderProps) {
  return (
    <header className={`${styles.header} ${variant === "main" ? styles.main : ""}`}>
      <div className={styles.inner}>{children}</div>
    </header>
  );
}

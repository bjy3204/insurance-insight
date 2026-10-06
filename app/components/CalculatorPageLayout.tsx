import type { ReactNode } from 'react';
import styles from './CalculatorPageLayout.module.css';

export default function CalculatorPageLayout({ children }: { children: ReactNode }) {
  return <div className={styles.layout}>{children}</div>;
}

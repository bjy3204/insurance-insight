import type { ReactNode } from 'react';
import styles from './CalculatorPageLayout.module.css';

export default function CalculatorPageLayout({ children }: { children: ReactNode }) {
  return <div data-page-content="true" className={styles.layout}>{children}</div>;
}

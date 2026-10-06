import type { ButtonHTMLAttributes } from 'react';
import styles from './CalculatorOptionButton.module.css';

export default function CalculatorOptionButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`${styles.button} ${className}`} />;
}

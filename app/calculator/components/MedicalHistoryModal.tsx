"use client";

import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import MedicalOverview from './MedicalOverview';
import MedicalGenerationContent from './MedicalGenerationContent';
import { medicalGenerations } from './medicalGenerationData';
import styles from './MedicalHistoryModal.module.css';


export default function MedicalHistoryModal({ onClose }: { onClose: () => void }) {
  const [generationId, setGenerationId] = useState('gen1');
  const [periodIndex, setPeriodIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const [overviewType, setOverviewType] = useState<'medical' | 'exemption'>('medical');
  const generation = medicalGenerations.find(item => item.id === generationId);
  const period = generation?.periods[periodIndex];
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus({ preventScroll: true }); };
  }, [onClose]);
  return <div className={styles.overlay}>
    <div ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="medical-history-title" data-popup-frame="true">
      <div className={styles.header}><h2 id="medical-history-title"><BookOpen size={20} />실손백과</h2><button ref={closeRef} onClick={onClose} className={styles.close} aria-label="닫기" data-popup-close="true"><X size={20} /></button></div>
      <div className={styles.body}>
        <nav className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`} aria-label="실손 정보 선택">
          <button className={styles.collapseButton} onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? '왼쪽 메뉴 펼치기' : '왼쪽 메뉴 접기'} aria-expanded={!collapsed}>{collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}</button>
          <button className={generationId === 'overview' ? styles.activeGeneration : ''} title="한눈에보기" aria-pressed={generationId === 'overview'} onClick={() => {setGenerationId('overview');}}>{collapsed ? <BookOpen size={18}/> : '한눈에보기'}</button>
          {!collapsed && generationId === 'overview' && <div className={styles.subTabs}>
            {(['medical','exemption'] as const).map(value => <button key={value} className={overviewType === value ? styles.activePeriod : ''} aria-pressed={overviewType === value} onClick={() => setOverviewType(value)}>{value === 'medical' ? '실손의료비 변천사' : '면부책 변천사'}</button>)}
          </div>}
          {medicalGenerations.map((item, index) => <button key={item.id} data-generation={index+1} className={`${styles.generationButton} ${generationId === item.id ? styles.activeGeneration : ''}`} title={item.name} aria-pressed={generationId === item.id} onClick={() => {if(generationId !== item.id) {setGenerationId(item.id);setPeriodIndex(0);} contentRef.current?.scrollTo({top:0});}}>{collapsed ? index+1 : item.name}</button>)}
        </nav>
        <div className={styles.main}>
          <div className={styles.generationHeading}><h3>{generation ? `${generation.name} 실손` : '한눈에보기'}</h3><span>{period ? period.title : overviewType === 'medical' ? '실손의료비 변천사' : '실손 면부책 변천사'}</span></div>
          {generation && generation.periods.length > 1 && <div className={styles.miniTabs} aria-label={`${generation.name} 가입 시기 선택`}>
            {generation.periods.map((entry, index) => <button key={entry.column} className={periodIndex === index ? styles.activePeriod : ''} aria-pressed={periodIndex === index} onClick={() => {setPeriodIndex(index);contentRef.current?.scrollTo({top:0});}}>{entry.title}</button>)}
          </div>}
          {period ? <div ref={contentRef} className={styles.content}><MedicalGenerationContent column={period.column} /></div> : <MedicalOverview key={overviewType} exemption={overviewType === 'exemption'} />}
        </div>
      </div>
      <p className={styles.disclaimer}>세부 보장내용은 가입하신 보험상품의 약관을 참조하시기 바랍니다.</p>
    </div>
  </div>;
}

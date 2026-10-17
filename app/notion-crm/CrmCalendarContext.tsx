"use client";
import {createContext,useContext} from 'react';
import type {CrmData,CrmRow,CrmValue} from '@/lib/notion-crm/model';
export const CrmCalendarContext=createContext<{data:CrmData;accountEvents:CrmRow[];reload:()=>void;saveEvent:(row:CrmRow|undefined,values:Record<string,CrmValue>)=>Promise<CrmRow>;deleteEvent:(row:CrmRow)=>Promise<void>}|null>(null);
export const useCrmCalendar=()=>useContext(CrmCalendarContext);

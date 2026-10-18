"use client";
import {useEffect,useRef,useState,type ClipboardEvent,type PointerEvent,type KeyboardEvent,type Dispatch,type SetStateAction} from 'react';
import {clipboardRows,copyReportCells,pasteReportCells,clearReportCells,type CellRange,type ReportCell} from './coverage-cell-clipboard';
import type {CoverageReport} from './coverage-report-model';
const MIME='application/x-insurance-coverage-cells';
export default function useCoverageCellSelection(report:CoverageReport,setReport:Dispatch<SetStateAction<CoverageReport>>,page:number){
  const [range,setRange]=useState<CellRange|null>(null);
  const active=useRef<{row:number;column:number;dragged:boolean;root:HTMLElement}|null>(null);
  const history=useRef({items:[report],index:0});
  useEffect(()=>{
    const state=history.current;
    if(state.items[state.index]===report)return;
    state.items=state.items.slice(0,state.index+1);
    state.items.push(report);
    if(state.items.length>60)state.items.shift();
    state.index=state.items.length-1;
  },[report]);
  useEffect(()=>{setRange(null);},[page]);
  useEffect(()=>{
    const move=(event:globalThis.PointerEvent)=>{
      const drag=active.current;if(!drag||!(event.buttons&1))return;
      const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-grid-row][data-grid-column]');
      if(!cell||!drag.root.contains(cell))return;
      const row=Number(cell.dataset.gridRow),column=Number(cell.dataset.gridColumn);
      if(row===drag.row&&column===drag.column&&!drag.dragged)return;
      drag.dragged=true;event.preventDefault();window.getSelection()?.removeAllRanges();
      setRange({row:drag.row,column:drag.column,endRow:row,endColumn:column});
    };
    const end=()=>{const drag=active.current;if(drag?.dragged)drag.root.focus({preventScroll:true});active.current=null;};
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
    return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);};
  },[]);
  function pointerDown(event:PointerEvent<HTMLElement>){
    if(event.pointerType==='touch')return;
    if(event.button!==0||(event.target as Element).closest('button'))return;
    const cell=(event.target as Element).closest<HTMLElement>('[data-grid-row][data-grid-column]');if(!cell)return;
    const row=Number(cell.dataset.gridRow),column=Number(cell.dataset.gridColumn);
    active.current={row,column,dragged:false,root:event.currentTarget};
    setRange(previous=>event.shiftKey&&previous?{...previous,endRow:row,endColumn:column}:{row,column,endRow:row,endColumn:column});
  }
  function copy(event:ClipboardEvent<HTMLElement>){
    if(!range)return;
    const multiple=range.row!==range.endRow||range.column!==range.endColumn;
    const input=event.target as HTMLInputElement;
    if(!multiple&&typeof input.selectionStart==='number'&&input.selectionStart!==input.selectionEnd)return;
    const cells=copyReportCells(report,range);
    event.preventDefault();event.clipboardData.setData(MIME,JSON.stringify({version:1,cells}));
    event.clipboardData.setData('text/plain',cells.map(line=>line.map(cell=>(cell.value+(cell.value&&cell.unit?cell.unit:'')).replace(/[\t\r\n]/g,' ')).join('\t')).join('\n'));
  }
  function paste(event:ClipboardEvent<HTMLElement>){
    const target=(event.target as Element).closest<HTMLElement>('[data-grid-row][data-grid-column]');
    const row=target?Number(target.dataset.gridRow):range?Math.min(range.row,range.endRow):-1;
    const column=target?Number(target.dataset.gridColumn):range?Math.min(range.column,range.endColumn):-1;
    if(row<0||column<0)return;
    let cells:ReportCell[][]|undefined;
    const custom=event.clipboardData.getData(MIME),text=event.clipboardData.getData('text/plain');
    if(custom){try{const data=JSON.parse(custom);if(data.version===1&&Array.isArray(data.cells)&&data.cells.length<=60&&data.cells.every((line:unknown)=>Array.isArray(line)&&line.length<=200&&line.every(cell=>cell&&typeof cell.value==='string'&&(cell.unit===undefined||typeof cell.unit==='string'))))cells=data.cells;}catch{}}
    if(!cells&&/[\t\n]/.test(text))cells=text.replace(/\r/g,'').replace(/\n$/,'').split('\n').map(line=>line.split('\t').map(value=>({value})));
    if(!cells?.length)return;
    event.preventDefault();setReport(current=>pasteReportCells(current,row,column,cells!));
    setRange({row,column,endRow:Math.min(clipboardRows(report).length-1,row+cells.length-1),endColumn:Math.min(199,column+Math.max(...cells.map(line=>line.length))-1)});
  }
  function selected(row:number,column:number){return !!range&&row>=Math.min(range.row,range.endRow)&&row<=Math.max(range.row,range.endRow)&&column>=Math.min(range.column,range.endColumn)&&column<=Math.max(range.column,range.endColumn);}
  function keyDown(event:KeyboardEvent<HTMLElement>){
    if((event.key==='Delete'||event.key==='Backspace')&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.nativeEvent.isComposing&&range){
      const multiple=range.row!==range.endRow||range.column!==range.endColumn;
      const editing=(event.target as Element).closest('input,textarea,[contenteditable=true]');
      if(multiple||!editing){event.preventDefault();event.stopPropagation();setReport(current=>clearReportCells(current,range));return;}
    }
    if(!(event.ctrlKey||event.metaKey)||event.altKey||event.nativeEvent.isComposing)return;
    const key=event.key.toLowerCase();
    if(key==='z'||key==='y'){
      event.preventDefault();event.stopPropagation();
      const state=history.current,step=key==='y'||event.shiftKey?1:-1;
      const next=state.index+step;
      if(next>=0&&next<state.items.length){state.index=next;setReport(state.items[next]);}
    }
  }
  return {pointerDown,copy,paste,selected,keyDown};
}

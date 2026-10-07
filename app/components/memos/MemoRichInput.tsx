"use client";
import ReactQuill from "react-quill-new";
import type { Ref, ComponentProps } from "react";
export default function MemoRichInput({editorRef,...props}:ComponentProps<typeof ReactQuill> & {editorRef:Ref<ReactQuill>}) {return <ReactQuill ref={editorRef} {...props}/>;}

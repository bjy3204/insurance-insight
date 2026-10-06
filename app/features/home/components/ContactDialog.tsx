"use client";

import { X } from "lucide-react";
import type { HomeController } from "../hooks/useHomeController";
export default function ContactDialog({ controller }: { controller: HomeController }) {
const { open, setOpen, startPopupDrag, getPopupStyle, fixMessage, setFixMessage, addMessage, setAddMessage, contact, setContact, sendMessage } = controller;
return (<>{open && (

        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">
          <div
  style={getPopupStyle("message")}
  className="bg-white rounded-3xl p-6 w-full max-w-md relative"
>
            <button data-popup-close="true"
              onClick={() => setOpen(false)}
              className="
  absolute
  right-5
  top-5
  w-9
  h-9
  rounded-full
  flex
  items-center
  justify-center
  text-gray-400
  hover:bg-gray-100
  transition
  cursor-pointer
"
            >
              <X className="w-5 h-5" />
            </button>

            <div
  onPointerDown={(e) => startPopupDrag("message", e)}
  className="mb-4"
>
  <h2 className="text-2xl font-black text-gray-900">
    보험나무에게 메세지 보내기
  </h2>

  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
    수정이 필요한 부분이나
    <br />
    추가하고 싶은 기능이 있다면 편하게 남겨주세요.
  </p>
</div>

            <div className="mb-3">
  <p className="text-sm font-bold text-gray-700 mb-1.5">
    수정할 내용
  </p>

              <textarea
                value={fixMessage}
                onChange={(e) => setFixMessage(e.target.value)}
                placeholder="예) 고객센터 팩스번호 수정 부탁드립니다"
                className="
                  w-full
                  h-28
                  border
                  border-gray-200
                  rounded-2xl
                  p-4
                  outline-none
                  resize-none
                "
              />
            </div>

            <div className="mb-3">
  <p className="text-sm font-bold text-gray-700 mb-1.5">
    추가하고 싶은 내용
  </p>
              <textarea
                value={addMessage}
                onChange={(e) => setAddMessage(e.target.value)}
                placeholder="예) 새로운 기능이 추가되면 좋겠습니다"
                className="
                  w-full
                  h-28
                  border
                  border-gray-200
                  rounded-2xl
                  p-4
                  outline-none
                  resize-none
                "
              />
            </div>

<p className="text-sm font-bold text-gray-700 mb-1.5 px-1">
  요청사항 변경 확인 메세지를 보내드립니다 !
</p>

            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              
              placeholder="연락처 또는 이름 (선택사항)"
              
              className="
                w-full
                border
                border-gray-200
                rounded-2xl
                p-4
                outline-none
                mb-6
              "
            />

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="
  flex-1
  py-4
  rounded-2xl
  bg-gray-100
  font-bold
  text-gray-700
  hover:bg-gray-200
  active:scale-[0.98]
  transition
"
              >
                취소
              </button>

              <button
                onClick={sendMessage}
                className="
  flex-1
  py-4
  rounded-2xl
  bg-blue-600
  hover:bg-blue-700
  text-white
  font-bold
  active:scale-[0.98]
  transition
"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}</>);
}

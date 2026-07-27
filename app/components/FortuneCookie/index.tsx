"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FortuneCookie.module.css";
import fortunes from "./fortunes";

type Position = {
  x: number;
  y: number;
};

type SavedFortune = {
  date: string;
  message: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const STORAGE_FORTUNE_KEY = "fortune-cookie-result";
const STORAGE_POSITION_KEY = "fortune-cookie-position";

function getKoreaDate() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
}

export default function FortuneCookie({
  open,
  onClose,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [fortune, setFortune] = useState("");
const [position, setPosition] = useState<Position>({
  x: 820,
  y: 300,
});
  const [ready, setReady] = useState(false);
  const [isPc, setIsPc] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  /*
   * 처음 실행할 때 PC 여부와 저장된 위치 확인
   */
  useEffect(() => {
    const pc = window.innerWidth >= 768;

    setIsPc(pc);

    const savedPosition = localStorage.getItem(
      STORAGE_POSITION_KEY
    );

    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);

        if (
          typeof parsed.x === "number" &&
          typeof parsed.y === "number"
        ) {
          setPosition(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_POSITION_KEY);
      }
    }

    setReady(true);
  }, []);

  /*
   * 상단 날짜를 눌러 포춘쿠키를 열 때마다
   * 오늘 저장된 결과가 있는지 다시 확인
   */
  useEffect(() => {
    if (!open || !ready || !isPc) return;

    const today = getKoreaDate();
    const savedResult = localStorage.getItem(
      STORAGE_FORTUNE_KEY
    );

    if (!savedResult) {
      setOpened(false);
      setFortune("");
      return;
    }

    try {
      const parsed = JSON.parse(
        savedResult
      ) as SavedFortune;

      /*
       * 오늘 이미 쿠키를 열었다면
       * 같은 열린 쿠키와 문구를 보여줌
       */
      if (
        parsed.date === today &&
        typeof parsed.message === "string"
      ) {
        setOpened(true);
        setFortune(parsed.message);
        return;
      }

      /*
       * 한국시간 기준 날짜가 바뀌었다면
       * 이전 결과를 지우고 닫힌 쿠키 표시
       */
      localStorage.removeItem(STORAGE_FORTUNE_KEY);
      setOpened(false);
      setFortune("");
    } catch {
      localStorage.removeItem(STORAGE_FORTUNE_KEY);
      setOpened(false);
      setFortune("");
    }
  }, [open, ready, isPc]);

  const handleOpen = () => {
    if (dragRef.current?.moved || opened) return;

    const today = getKoreaDate();
/*
 * 오늘 처음 열 때 랜덤 문구 선택
 * 선택된 문구는 오늘 하루 동안 저장됨
 */
const randomIndex = Math.floor(
  Math.random() * fortunes.length
);

const selectedFortune = fortunes[randomIndex];

    setFortune(selectedFortune);
    setOpened(true);

    const result: SavedFortune = {
      date: today,
      message: selectedFortune,
    };

    localStorage.setItem(
      STORAGE_FORTUNE_KEY,
      JSON.stringify(result)
    );
  };

  const handleClose = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    /*
     * 닫기만 하고 오늘의 결과는 삭제하지 않음
     * 다시 날짜를 누르면 같은 결과가 표시됨
     */
    onClose();
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const target = event.target as HTMLElement;

    if (target.closest("button")) return;

    event.preventDefault();

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };

    const handlePointerMove = (
      moveEvent: PointerEvent
    ) => {
      if (!dragRef.current) return;

      const dx =
        moveEvent.clientX - dragRef.current.startX;
      const dy =
        moveEvent.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragRef.current.moved = true;
      }

const COOKIE_W = opened ? 300 : 230;
const COOKIE_H = opened ? 210 : 230;

const rawX = dragRef.current.originX + dx;
const rawY = dragRef.current.originY + dy;

/*
 * 쿠키가 화면 밖으로 절반까지만 나갈 수 있도록 제한
 */
const nextX = Math.max(
  -COOKIE_W / 2,
  Math.min(
    window.innerWidth - COOKIE_W / 2,
    rawX
  )
);

const nextY = Math.max(
  -COOKIE_H / 2,
  Math.min(
    window.innerHeight - COOKIE_H / 2,
    rawY
  )
);

      setPosition({
        x: nextX,
        y: nextY,
      });
    };

    const handlePointerUp = () => {
      setTimeout(() => {
        dragRef.current = null;
      }, 0);

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );
  };

  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(
      STORAGE_POSITION_KEY,
      JSON.stringify(position)
    );
  }, [position, ready]);

  if (!ready || !isPc || !open) return null;

  return (
    <div
      className={`${styles.wrapper} ${
        opened ? styles.openedWrapper : ""
      }`}
style={{
  left: position.x,
  top: position.y,
}}
      onPointerDown={handlePointerDown}
      onClick={handleOpen}
    >
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="포춘쿠키 닫기"
      >
        ×
      </button>

      <img
        src={
          opened
            ? "/fortune/broken-cookie.png"
            : "/fortune/cookie.png"
        }
        alt={
          opened
            ? "열린 포춘쿠키"
            : "오늘의 포춘쿠키"
        }
        className={`${styles.cookieImage} ${
          opened ? styles.brokenImage : ""
        }`}
        draggable={false}
      />



      {opened && (
        <div className={styles.message}>
          {fortune}
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import Image from "next/image";
import { Newspaper, MessageCircle } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import styles from "../HomePage.module.css";

const links = [
  { name: "보험사별 소식지", href: "https://naver.me/xsZ8mk7H", image: "insurance-news.png", icon: Newspaper },
  { name: "보험인사이트 카카오톡", href: "https://open.kakao.com/o/gD7ej63h", image: "kakao.png", icon: MessageCircle },
  { name: "보험나무 인스타그램", href: "https://www.instagram.com/g__tree_/", image: "instagram.png", icon: FaInstagram },
];

function LinkLogo({ item }: { item: typeof links[number] }) {
  const [failed, setFailed] = useState(false);
  const Icon = item.icon;
  return failed ? <Icon size={34} aria-hidden="true" /> : <Image src={`/images/links/${item.image}`} alt="" width={40} height={40} unoptimized onError={() => setFailed(true)} />;
}

export default function QuickLinksBar() {
  return <nav className={styles.quickLinks} aria-label="소식지와 소셜 채널">{links.map(item => <a key={item.image} href={item.href} target="_blank" rel="noopener noreferrer"><LinkLogo item={item} /><span>{item.name}</span></a>)}</nav>;
}

"use client";

/* eslint-disable @next/next/no-img-element */

import { useFloralClick } from "./FloralClickContext";
import styles from "./Curtain.module.css";

interface CurtainProps {
  open: boolean;
  gone: boolean;
}

export default function Curtain({ open, gone }: CurtainProps) {
  const handleFloralClick = useFloralClick();

  const curtainClassName = [styles.curtain, open ? styles.open : "", gone ? styles.gone : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={curtainClassName}>
      <div className={`${styles.curtainHalf} ${styles.left}`}>
        <img className="floral" src="/assets/spray.webp" style={{ top: "-6%", right: "-40px" }} alt="" onClick={handleFloralClick} />
        <img className="floral" src="/assets/spray.webp" style={{ top: "26%", right: "6px" }} alt="" onClick={handleFloralClick} />
        <img className="floral" src="/assets/spray.webp" style={{ top: "58%", right: "-46px" }} alt="" onClick={handleFloralClick} />
        <img className="floral" src="/assets/spray.webp" style={{ top: "80%", right: "14px" }} alt="" onClick={handleFloralClick} />
        <div className={styles.curtainEdge} />
      </div>
      <div className={`${styles.curtainHalf} ${styles.right}`}>
        <img className="floral" src="/assets/spray.webp" style={{ top: "-4%", left: "-40px" }} alt="" onClick={handleFloralClick} />
        <img className="floral" src="/assets/spray.webp" style={{ top: "30%", left: "8px" }} alt="" onClick={handleFloralClick} />
        <img className="floral" src="/assets/spray.webp" style={{ top: "60%", left: "-44px" }} alt="" onClick={handleFloralClick} />
        <img className="floral" src="/assets/spray.webp" style={{ top: "82%", left: "12px" }} alt="" onClick={handleFloralClick} />
        <div className={styles.curtainEdge} />
      </div>
    </div>
  );
}

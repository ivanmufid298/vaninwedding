"use client";

import QRCode from "react-qr-code";
import styles from "./GuestQrCard.module.css";

interface GuestQrCardProps {
  /** the invitation id encoded in the QR; nothing renders without one */
  value: string | null;
  /** shown under the code */
  label?: string;
  /** keep the plate's box even with no value, for callers using this block as a height spacer */
  keepSpace?: boolean;
}

/* The code carries the bare invitation id rather than the whole invitation URL: the scanner at the
   door accepts either, and a short payload makes for a sparser, more forgiving code to read off a
   phone screen in low light. Nothing is generated or stored — react-qr-code draws the SVG inline. */
export default function GuestQrCard({
  value,
  label = "QR Code Kehadiran",
  keepSpace = false,
}: GuestQrCardProps) {
  if (!value && !keepSpace) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.plate}>
        {value ? (
          <QRCode
            value={value}
            // fills the plate, which is what actually sets the size
            style={{ width: "100%", height: "auto" }}
            // the plate is white, so the code keeps maximum contrast rather than the page's sage
            bgColor="#ffffff"
            fgColor="#333f2a"
            level="M"
            viewBox="0 0 256 256"
          />
        ) : null}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}

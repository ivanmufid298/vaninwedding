import { Suspense } from "react";
import Invitation from "@/components/invitation/Invitation";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Invitation />
    </Suspense>
  );
}

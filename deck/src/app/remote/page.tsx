"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RemoteControl } from "@/deck/remote/RemoteControl";

function RemoteFromSearch() {
  const room = useSearchParams().get("room");
  return <RemoteControl room={room} />;
}

export default function RemotePage() {
  return (
    <Suspense>
      <RemoteFromSearch />
    </Suspense>
  );
}

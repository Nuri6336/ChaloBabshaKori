"use client";

import { use } from "react";
import { DocView } from "@/components/Docs";

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DocView kind="purchase" id={id} />;
}

import { DishPageClient } from "@/components/DishPageClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default function DishPage({ params }: { params: { id: string } }) {
  return <DishPageClient id={params.id} />;
}

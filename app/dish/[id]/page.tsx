import { DISHES } from "@/lib/dishes";
import { DishPageClient } from "@/components/DishPageClient";

export function generateStaticParams() {
  return Object.keys(DISHES).map((id) => ({
    id,
  }));
}

export default function DishPage({ params }: { params: { id: string } }) {
  return <DishPageClient id={params.id} />;
}

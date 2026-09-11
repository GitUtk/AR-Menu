import { DishPageClient } from "@/components/DishPageClient";

export const dynamicParams = true;

export function generateStaticParams() {
  return [
    { id: "butter_chicken" },
    { id: "chili_panner" },
    { id: "burger" },
    { id: "pizza" },
    { id: "dosa" },
    { id: "pasta" },
    { id: "biryani" },
  ];
}

export default function DishPage({ params }: { params: { id: string } }) {
  return <DishPageClient id={params.id} />;
}

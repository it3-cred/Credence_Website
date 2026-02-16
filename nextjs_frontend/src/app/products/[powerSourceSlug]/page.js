import ProductsPage from "@/components/Products";

export default async function ProductsByPowerSourcePage({ params }) {
  const routeParams = await params;
  return <ProductsPage initialPowerSourceSlug={routeParams?.powerSourceSlug || ""} />;
}

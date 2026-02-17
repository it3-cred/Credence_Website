import ProductDetails from "@/components/ProductDetails";

export default async function ProductDetailPage({ params }) {
  const routeParams = await params;
  return <ProductDetails slugAndId={routeParams?.slugAndId || ""} />;
}

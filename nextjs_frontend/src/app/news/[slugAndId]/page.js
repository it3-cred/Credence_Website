import ContentTemplate from "@/components/content";

function extractId(slugAndId) {
  if (!slugAndId) return "";
  const value = Array.isArray(slugAndId) ? slugAndId[0] : slugAndId;
  const parts = String(value).split("-");
  return parts[parts.length - 1] || "";
}

export default async function NewsDetailPage({ params }) {
  const routeParams = await params;
  const id = extractId(routeParams?.slugAndId);
  return <ContentTemplate type="news" id={id} />;
}

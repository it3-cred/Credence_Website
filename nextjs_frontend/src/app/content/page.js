import ContentTemplate from "@/components/content";

export default async function ContentPage({ searchParams }) {
  const params = await searchParams;
  const type = params?.type || "news";
  const id = params?.id || "1";

  return <ContentTemplate type={type} id={id} />;
}

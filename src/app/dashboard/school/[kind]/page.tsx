import { SchoolPage, type SchoolQuery } from "@/modules/school/page";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<SchoolQuery>;
}) {
  return SchoolPage({ kind: (await params).kind, query: await searchParams });
}

import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/messages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  redirect(
    `/dashboard/school/years?locale=${getLocale((await searchParams).locale)}`,
  );
}

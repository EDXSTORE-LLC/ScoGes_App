import Link from "next/link";
import { getLocale } from "@/i18n/messages";
import { schoolContext } from "@/modules/school/context";
import { schoolText } from "@/modules/school/messages";
import { hasPermission } from "@/modules/identity/permissions";
import { ImportForm } from "@/modules/imports/form";
import { importLimits } from "@/modules/imports/limits";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const locale = getLocale((await searchParams).locale),
    ctx = await schoolContext("imports.preview");
  if (!ctx) return <p role="alert">{schoolText(locale, "denied")}</p>;
  const limits = importLimits();
  const policy =
    locale === "fr"
      ? `Limites : ${limits.maxBytes / 1048576} Mio, ${limits.maxRows} lignes. Aperçu valable ${limits.previewSeconds / 60} minutes. Aucun enregistrement pendant la prévisualisation, aucune notification envoyée.`
      : `Limits: ${limits.maxBytes / 1048576} MiB, ${limits.maxRows} rows. Preview valid for ${limits.previewSeconds / 60} minutes. No records are saved during preview and no notifications are sent.`;
  return (
    <section lang={locale} className="grid gap-5">
      <h1 className="text-3xl font-bold">{schoolText(locale, "imports")}</h1>
      <Link href={`/dashboard/school/students?locale=${locale}`}>
        {schoolText(locale, "title")}
      </Link>
      <ImportForm
        locale={locale}
        tenantId={ctx.membership.tenantId}
        canCommit={hasPermission(ctx.membership.roles, "imports.commit")}
        policy={policy}
      />
    </section>
  );
}

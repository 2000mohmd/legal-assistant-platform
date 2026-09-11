import { getLocale, getTranslations } from "next-intl/server";
import { Scale } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { LocaleToggle } from "./locale-toggle";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "common" });
  const authT = await getTranslations({ locale, namespace: "auth" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-line bg-white">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Scale size={18} aria-hidden />
          </span>
          <span className="font-serif text-lg text-ink">{t("firmPlaceholder")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{t("brandTagline")}</span>
          {user ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-body hover:bg-primary-tint"
            >
              {authT("signIn")}
            </Link>
          )}
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}

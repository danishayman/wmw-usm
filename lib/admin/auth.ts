import "server-only";

type UserLike = {
  email?: string | null;
};

type AdminAllowlistQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{
        data: { email: string } | null;
        error: { message: string } | null;
      }>;
    };
  };
};

type SupabaseAuthClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: UserLike | null };
      error: { message: string } | null;
    }>;
  };
  from: (table: string) => AdminAllowlistQuery;
};

export type AdminGuardResult =
  | { ok: true; email: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "error"; message: string };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getSessionEmail(user: UserLike | null): string | null {
  if (!user?.email) {
    return null;
  }

  return normalizeEmail(user.email);
}

export async function isAdminForEmail(
  supabase: Pick<SupabaseAuthClient, "from">,
  email: string
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("[wmw-usm]", {
      area: "auth",
      operation: "admin_allowlist_lookup",
      message: error.message,
    });
    return false;
  }

  return Boolean(data?.email);
}

export async function requireAdminUser(
  supabase: SupabaseAuthClient
): Promise<AdminGuardResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[wmw-usm]", {
      area: "auth",
      operation: "auth_get_user",
      message: userError.message,
    });
    return {
      ok: false,
      reason: "error",
      message: "Could not verify the current session.",
    };
  }

  const email = getSessionEmail(user);
  if (!email) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "Please sign in to continue.",
    };
  }

  const isAdmin = await isAdminForEmail(supabase, email);
  if (!isAdmin) {
    return {
      ok: false,
      reason: "forbidden",
      message: "This account is not authorized for admin access.",
    };
  }

  return { ok: true, email };
}

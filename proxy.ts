import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PUBLICAS = ["/login", "/auth"];

// Renova a sessão do Supabase a cada requisição e manda para /login quem não está logado.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Chave no banco: com login desligado, ninguém é mandado para /login.
  const { data: config, error: configError } = await supabase
    .from("app_config")
    .select("login_obrigatorio")
    .eq("id", 1)
    .maybeSingle();
  const exigeLogin = configError || !config ? true : config.login_obrigatorio;

  const publica = ROTAS_PUBLICAS.some((r) => request.nextUrl.pathname.startsWith(r));
  if (exigeLogin && !user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo, menos arquivos estáticos, ícones e manifest.
    "/((?!_next/static|_next/image|favicon.ico|icons/|apple-touch-icon.png|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};

export const env = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3100),
  cors: {
    origin: process.env.CORS_ORIGIN ?? "*",
  },
  linkedin: {
    cookie: process.env.LINKEDIN_COOKIE ?? "",
    liAt: process.env.LINKEDIN_LI_AT ?? "",
    jsessionId: process.env.LINKEDIN_JSESSIONID ?? "",
    csrfToken: process.env.LINKEDIN_CSRF_TOKEN ?? "",
    bscookie: process.env.LINKEDIN_BSCOOKIE ?? "",
    liTheme: process.env.LINKEDIN_LI_THEME ?? "light",
    userAgent:
      process.env.LINKEDIN_USER_AGENT ??
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
  },
} as const;

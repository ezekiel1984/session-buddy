export const LOGO_URL = "https://media.base44.com/images/public/user_68e73b784b80ba2433b37285/b5fdc00a5_C6BF9718-C909-4ACA-8D45-7B409E58D568.PNG";
export const SUPPORT_EMAIL = "support@verdelabs.com.au";
// Add the public product listing URLs here once each store listing is released.
// Keep null before release: never send customers to a search page or TestFlight.
export const STORE_LINKS = { apple: null, google: null };
export function verifiedStoreUrl(platform, value = STORE_LINKS[platform]) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (platform === "apple" && url.hostname === "apps.apple.com" && /\/id\d+/.test(url.pathname)) return url.href;
    if (platform === "google" && url.hostname === "play.google.com" && url.pathname === "/store/apps/details" && url.searchParams.get("id")) return url.href;
  } catch { /* An invalid listing stays unavailable. */ }
  return null;
}

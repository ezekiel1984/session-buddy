# Session Buddy public website — 15 November 2026

Converted the old app 68e77f1fff1fec8a8ec261d8 into the public marketing website for session-buddy.app. The current native/tracking app 6ac35d899ff0f653323b3809 is separate and unchanged.

## Website

Public homepage with the current approved leaf logo, forest/mint palette, illustrative phone and share-card previews, journal/insights/Buddy/stash/wellbeing/planning features, four-step introduction, FAQs and store availability section. Support, privacy/terms and account-deletion help routes are public. No login, journal queries, account writes or billing flow is mounted by the website. Legacy app source and entities remain retained; entity access policies were not widened.

## Store release configuration

Set apple and google in src/marketing/site-config.js to the real public product URLs when listings are released. Null means Coming soon. HTTPS and official product-listing URL validation prevents invalid or placeholder links from becoming download buttons. No TestFlight or Base44 app URL is advertised.

## Legal

LegalContent.jsx carries the current tracking app's legal content, adapted for public navigation. Its existing development notice and release/processor-retention caveats remain truthful; this conversion is not a new legal compliance certification. Operator: Kiel Spicer trading as Verde Labs Australia. Support: support@verdelabs.com.au.

## Verification

Production build, targeted ESLint and git diff whitespace checks pass. Eleven store-link assertions pass. Browser checked desktop and 390px iframe mobile layouts, responsive navigation, anchor navigation, FAQ interaction, public support/privacy and account-deletion routes. Mobile document width equals client width (375px with scrollbar), no horizontal overflow. Approved logos load. Temporary responsive QA fixture removed before publication.

Baseline checkpoint: 6af92c59bb6b77ef16f7c064. Final checkpoint and domain linking recorded in builder/API history.

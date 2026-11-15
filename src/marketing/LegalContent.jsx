import React from "react";
import { Link } from "react-router-dom";
import { LOGO_URL } from "./site-config";
const Wordmark = () => <img src={LOGO_URL} width="64" height="64" alt="Session Buddy" />;
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_MIN_AGE = 21;
import { ArrowLeft } from "lucide-react";

// Kiel confirmed sole-trader operation under his own ABN using Verde Labs Australia,
// and access to the support mailbox, on 7 November 2026.
// Public-release checks still needed: launch territories, journal/report retention
// and backup deletion, app-specific AI routing, processing locations and processor terms.
// Keep this build labelled as development copy until those facts are verified.

const LINK_STYLE = "rounded-sm text-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-6" aria-labelledby={`${id}-title`}>
      <Card>
        <CardContent className="space-y-4 p-5 text-sm leading-relaxed text-muted-foreground">
          <h2 id={`${id}-title`} className="text-base font-semibold text-foreground">{title}</h2>
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

export default function Legal() {


  return (
    <main className="site-legal min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <nav aria-label="Page navigation" className="flex items-center justify-between">
          <Link to="/" className="tap-target flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </Link>
          <Link to="/support" className="tap-target flex items-center text-sm text-primary underline-offset-4 hover:underline">Help</Link>
        </nav>

        <header className="flex flex-col items-center gap-3 pt-2 text-center">
          <Wordmark className="max-w-[200px]" alt="Session Buddy" />
          <h1 className="text-xl font-semibold text-foreground">Privacy, terms &amp; deletion</h1>
          <p className="max-w-md text-sm text-muted-foreground">How Session Buddy handles your information and what it is for.</p>
        </header>

        <aside aria-label="Development notice" className="rounded-xl border border-border bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">Development notice.</strong>{" "}
          Operated by Kiel Spicer trading as Verde Labs Australia. Contact <a className={LINK_STYLE} href="mailto:support@verdelabs.com.au">support@verdelabs.com.au</a>.
          Store account verification, launch territories, processor retention terms and installed-device checks remain in progress before release.
        </aside>

        <nav aria-label="Legal sections" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <a href="#privacy" className={`${LINK_STYLE} tap-target inline-flex items-center`}>Privacy</a>
          <a href="#terms" className={`${LINK_STYLE} tap-target inline-flex items-center`}>Terms &amp; safety</a>
          <a href="#deletion" className={`${LINK_STYLE} tap-target inline-flex items-center`}>Delete your data</a>
        </nav>

        <Section id="privacy" title="Privacy">
          <p>
            Session Buddy is operated by Kiel Spicer trading as Verde Labs Australia and hosted online on Base44. Your
            information is saved to your account rather than kept only on your
            device. Access controls are designed to keep other ordinary users
            from accessing your records. Authorized operator and service-provider
            access may be needed to run, support or secure the service; this is
            not a promise that nobody else can access it.
          </p>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Information used by the app</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>Account and sign-in information, including your email, is handled through Base44 authentication.</li>
              <li>Entries, product details, amounts and units, timestamps, check-ins, moods, notes, goals and preferences are stored when you save them.</li>
              <li>Optional session settings can include body weight, usual frequency of use and your chosen product-weight assumptions for joints, cones and dry-herb vape capsules. You can leave these values unknown, change them or remove them in Profile.</li>
              <li>My stash stores purchase dates, quantities, units, optional prices and notes, plus any manual stock balances. Sleep &amp; wellbeing stores the sleep observations, before/after scores, cravings and reflections you choose to record. Daily use confirmations are saved when you explicitly confirm them; missing days are unknown.</li>
              <li>Entries using these familiar units retain the count and the product-weight assumption saved with that entry. Exports include that snapshot and any calculable approximate product mass or labelled THC content. These are recorded quantities, not measured absorption or blood levels.</li>
              <li>Session plans store the intentions, times, responsibilities and notes you choose. Plans are separate from recorded use and are included in export and account deletion.</li>
              <li>Adult confirmation and sign-in state may be kept in your browser or installed app so it can remember your choices and session.</li>
              <li>AI consent choices, request counts, request times and any AI access restriction support the optional Buddy service, moderation and its usage allowance.</li>
              <li>Response reports are associated with your account and contain the content you review and submit for restricted operator review.</li>
              <li>New doses, check-ins and notes queued while offline are stored unencrypted in this browser or app until synced to your account. Pending records are not yet on the server. Clearing app data or uninstalling can remove them; reconnect in the same account and verify that syncing finishes first.</li>
              <li>Optional recap images are made on your device from the details shown in their preview. Session Buddy does not upload or publish these images; saving or sharing one is your choice, and the destination you select may keep a copy.</li>
            </ul>
          </div>

          <p>
            Records support your journal, historical Insights and chosen goals.
            This build includes no advertising. Subscription and access in Profile
            shows whether beta access or store billing applies. Where billing is enabled,
            Apple or Google processes the purchase; account-linked purchase identifiers,
            verification status and expiry support access and restore purchases.
            The app does not collect your card number. It does not
            add analytics that capture your journal or chat text. There is no
            connected social account or public share-link service in this build. Hosted services
            may process technical information needed to provide the service;
            their exact retention and processing arrangements still need
            confirmation for public release.
          </p>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Optional AI Buddy</h3>
            <p>
              Buddy sends requests through Base44's AI service to the model
              provider selected by Base44. If you enable it, your message and
              recent conversation turns are sent to generate a reply. The app does
              not identify which provider handled an individual reply. Do not include
              information you do not want processed by these services.
            </p>
            <p>
              Base44's{" "}
              <a href="https://trust.base44.com/" target="_blank" rel="noopener noreferrer" className={LINK_STYLE}>subprocessor directory</a>{" "}
              describes AI, hosting and logging providers in several countries.
              Examples include Anthropic, OpenAI and Gemini in the United States,
              Z.ai in China, and logging providers in Germany and the United Kingdom.
              This directory is not a record of where an individual request went.
              The exact routing and retention or training terms for this app still
              need confirmation before public release; do not assume processing
              stays in your country.
            </p>
            <p>
              Journal sharing is separate from enabling AI. Messages only sends
              no saved journal or profile context. Current session includes up to
              15 session entries and the latest relevant check-in. Recent history
              includes up to 15 entries from the last 30 days, the latest check-in
              and up to 5 active goals, including relevant notes. Context is fetched
              again for each request. You can use tracking and estimates without AI.
            </p>
            <p>
              Explicitly choosing a journal scope with live estimates also includes saved
              body weight, use frequency and model-derived current estimates,
              calculated from relevant prior doses using up to 1,000 loaded logs.
              Raw entries outside the chosen scope are not included in the AI
              prompt. Recent-history sharing can also include derived usage counts
              and time/date patterns from the previous 28 days, shortened to account
              creation. Missing days are not counted as no-use days. Previous sharing choices retain their prior limit of 15
              entries, one check-in and 5 goals, without profile or numerical model
              context, until a new scope is chosen. Turning sharing off stops new
              context retrieval; it cannot recall information already sent.
            </p>
            <p>Choosing My activity, products &amp; stash additionally shares recent check-ins, daily confirmations, sleep, before/after reports and reflections; saved product details, purchases, recorded stock balances and derived spending summaries; active goals, plans and profile defaults. Recent summaries cover up to 30 days, shortened to account creation for newer accounts. Records are bounded and missing or truncated categories are identified. Stash accounting uses up to 5,000 saved dose logs and does not infer unlogged use. Existing narrower sharing choices do not automatically expand.</p>
            <p>
              The visible conversation is saved locally on this device for the
              current calendar day, so you can return to it after reopening the
              app. It clears at the next local day, when you delete it, or when
              you sign out or change Buddy privacy choices. The app does not
              create a cloud chat-history record. Clearing the local conversation
              does not delete information already processed by service providers
              or a report you submitted. A response report is saved separately
              for restricted review to help improve safeguards.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Your choices and retention</h3>
            <p>
              You can edit or delete individual records through their controls,
              review AI choices in Buddy, and find export and account controls in
              Profile. Downloaded exports are copies that you control; deleting
              a record in the app does not remove a file you have downloaded.
            </p>
            <p>
              Saved account records remain until you delete them or your account. AI allowance metadata is pruned as later requests are processed. Provider logs and backups follow the platform’s retention arrangements, which are being confirmed for release. Account deletion does not promise immediate removal from every backup or processor system. Contact support for privacy or deletion questions.
            </p>
            <p>
              Base44 publishes its own{" "}
              <a href="https://base44.com/privacy-policy" target="_blank" rel="noopener noreferrer" className={LINK_STYLE}>privacy policy</a>{" "}
              and{" "}
              <a href="https://base44.com/dpa" target="_blank" rel="noopener noreferrer" className={LINK_STYLE}>data-processing terms</a>.
              These describe the platform and do not replace the completed
              Session Buddy privacy notice.
            </p>
            <p>
              For access, correction or a privacy complaint, email <a className={LINK_STYLE} href="mailto:support@verdelabs.com.au">support@verdelabs.com.au</a>.
              Describe the request without sending unnecessary journal details.
              We may verify account ownership, review the request and respond using
              your contact details. If the Australian Privacy Act applies, you can
              also review the <a className={LINK_STYLE} href="https://www.oaic.gov.au/privacy/privacy-complaints" target="_blank" rel="noopener noreferrer">OAIC privacy-complaint process</a>.
            </p>
          </div>
        </Section>

        <Section id="terms" title="Terms & safety">
          <p>
            Session Buddy is a journal and reflection companion for adults. The
            current product age threshold is {DEFAULT_MIN_AGE}+. This threshold
            is a product choice, not a statement about the legal age or cannabis
            laws in every location. Follow the laws that apply to you.
          </p>
          <p>
            It is not a medical device and does not diagnose, treat, cure or
            prevent any medical condition. Education and AI replies are general
            information, not personal medical advice. Consult a qualified
            healthcare professional for medical decisions. For an urgent health
            concern, seek local emergency assistance rather than waiting for Buddy.
          </p>
          <p>
            Potency values are information from the source you record, not
            measured absorbed THC. An effects rating is your own report at a
            particular time. Neither a rating nor a historical chart establishes
            sobriety, impairment, fitness to drive or a drug-test outcome.
            Testing shows illustrative modelled cutoff-crossing dates and
            separately labelled study examples. Model dates have not been validated
            as individual negative-test predictions. A result depends on the
            specimen, target, assay and cutoff; positive results can occur beyond
            the displayed range. The optional laboratory comparison only compares
            a result and cutoff you enter for one collected sample. It does not
            calibrate the model or establish a future test outcome.
          </p>
          <p>
            Joint, cone and dry-herb vape capsule sizes are editable templates,
            not universal amounts. Your saved assumptions can estimate product
            mass; a label percentage can describe labelled cannabinoid content.
            Body weight, use frequency and these quantities do not establish
            blood levels, impairment or a testing deadline. Changing a template
            does not rewrite assumptions saved with earlier entries.
          </p>
          <p>
            Sensitivity ratings are experimental estimates from recent logs and
            saved model settings, not validated measurements of biological tolerance
            or personal metabolism. Inhaled and swallowed groupings retain different
            route assumptions; neither a score nor a forecast recommends a dose.
            Sleep and wellbeing summaries describe your reports and do not establish
            that cannabis caused an outcome.
          </p>
          <p>
            Buddy offers general lower-risk education, label arithmetic for
            amounts you choose, and discussion of timing, your records and
            hypothetical plans. It does not select a personal dose or a stacking
            schedule to reach a chosen level of intoxication, change a prescription
            or establish sobriety. AI replies can be wrong; historical comfort,
            weight, frequency and sensitivity estimates do not establish a safe
            amount. Review any draft before choosing to save it; chat does not
            automatically record a session or check-in. Do not use the service to
            arrange cannabis purchases, encourage illegal or underage use, seek
            test-evasion instructions or obtain personal treatment advice.
          </p>
          <p>
            When store billing is enabled, Apple or Google handles payment. Session Buddy
            processes account-linked purchase identifiers and subscription status to manage
            access. These billing records cannot be edited by ordinary app accounts.
          </p>
          <p>
            Keep your account credentials secure. Do not access another person's
            records or attempt to bypass account protections. Session Buddy offers one
            full-access monthly subscription through Apple or Google where billing is enabled.
            Any beta access is identified on the access screen and cannot take payment
            while billing is disabled. The store must disclose the price, billing
            period and any eligible offer before a purchase is confirmed. AI usage limits
            still apply. Renewal can be managed in the store. Cancelling renewal keeps
            access until the paid period ends, unless a refund or revocation removes it.
            After expiry, account settings, export, deletion and support remain available;
            existing records are retained. Account deletion does not cancel a store subscription.
          </p>
          <p>
            These terms do not exclude rights or remedies that cannot lawfully be
            excluded, including applicable Australian Consumer Law guarantees.
            Contact support for access, billing or service complaints. Store refund
            processes and your statutory consumer rights are separate.
          </p>
        </Section>

        <Section id="deletion" title="Delete your account or records">
          <p>
            Use the individual record controls to delete an entry, check-in,
            product or goal. Deleting a saved product does not rewrite product
            details already saved with past entries; delete those entries if you
            also want to remove their snapshots.
          </p>
          <p>
            Open Profile to review export and deletion controls for the signed-in
            account. Choose Delete my account, review the warning and type DELETE to remove the account identity and associated personal records. Signing out alone does not delete them. If deletion only partly finishes, the app tells you to retry.
          </p>
          <p>In the native Session Buddy app, open Profile to manage your account. If you cannot access it, contact support using the deletion-request page below.</p>
          <p className="text-xs">
            Account deletion also covers plans, stash, sleep and wellbeing records,
            daily confirmations, preferences and app-side subscription records.
            Pending offline records on this device are removed first. Downloaded
            exports, shared images and store subscription records are separate;
            deleting the app account does not cancel store renewal.
          </p>
          <p className="text-xs">
            If you cannot sign in, visit the public deletion-request page to contact support. Ownership must be verified before a support-assisted deletion.
          </p>
          <Link className={LINK_STYLE} to="/delete-account">Public account-deletion requests</Link>
        </Section>

        <footer className="pb-4 text-center text-xs leading-relaxed text-muted-foreground">
          <p>For practical guidance, visit <Link to="/support" className={LINK_STYLE}>Help &amp; support</Link>.</p>
          <p className="mt-2">Development review copy · 26 October 2026</p>
        </footer>
      </div>
    </main>
  );
}

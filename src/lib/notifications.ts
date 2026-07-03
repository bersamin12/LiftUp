/**
 * Notification stubs — server-side only
 *
 * Every trigger point in the application calls one of these functions.
 * Currently they log to console with a structured payload.
 *
 * TODO: Replace console.log with OneSignal (or similar) push delivery.
 *       OneSignal integration guide: https://documentation.onesignal.com/docs/web-push-quickstart
 *       Suggested approach:
 *         1. Add ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY to .env.local
 *         2. Replace each stub body with a POST to
 *            https://onesignal.com/api/v1/notifications
 *         3. Map residentId → OneSignal external_id (set at signup)
 */

interface NotifyPayload {
  type: string;
  [key: string]: unknown;
}

function log(payload: NotifyPayload): void {
  // Structure: [NOTIFY] <type> — useful for grep in logs
  console.log(`[NOTIFY] ${payload.type}`, JSON.stringify(payload));
}

/** Fired when a new campaign is published near a resident's block. */
export function notifyNearbyCampaign(residentId: string, campaignId: string, campaignName: string): void {
  log({ type: 'nearby-campaign', residentId, campaignId, campaignName });
  // TODO: Push "A new donation drive is coming to your block!" to residentId
}

/** Fired when a coordinator marks a pledge as declined. */
export function notifyDeclined(residentId: string, pledgeId: string, reason: string): void {
  log({ type: 'pledge-declined', residentId, pledgeId, reason });
  // TODO: Push "Your donation wasn't collected this time — [reason]" to residentId
}

/** Fired when a coordinator postpones a pledge to a later run. */
export function notifyPostponed(
  residentId: string,
  pledgeId: string,
  nextRunId: string,
  nextRunDate: string
): void {
  log({ type: 'pledge-postponed', residentId, pledgeId, nextRunId, nextRunDate });
  // TODO: Push "Your donation has been moved to the next run on [date]" to residentId
}

/** Fired after a pledge is confirmed and a new badge is unlocked. */
export function notifyBadgeUnlocked(residentId: string, badgeId: string, badgeName: string): void {
  log({ type: 'badge-unlocked', residentId, badgeId, badgeName });
  // TODO: Push "You earned a new badge: [badgeName]! 🎉" to residentId
}

/** Fired when a referral is vested (invitee's first pledge confirmed). */
export function notifyReferralVested(
  inviterId: string,
  inviteeId: string,
  pointsAwarded: number
): void {
  log({ type: 'referral-vested', inviterId, inviteeId, pointsAwarded });
  // TODO: Push "+[points] points! Your neighbour just donated 🎉" to inviterId
}

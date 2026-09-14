import { recordReview, reviewFingerprint } from './preflight.mjs'
import { runReviewCommand } from './review-checks.mjs'

// Gate unit tests provide a tiny contracts script in their isolated repository. This exercises
// process receipts without pretending to run the real product's contract suite in a stub tree.
export function recordFixtureReview(root, session, report, snapshot, unsettled, checks) {
  const receipts = checks ?? [runReviewCommand(root, reviewFingerprint(root, session, snapshot, unsettled), ['scripts/contracts/check.mjs'])]
  return recordReview(root, session, report, snapshot, unsettled, receipts)
}

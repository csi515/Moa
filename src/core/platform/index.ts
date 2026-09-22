export {
  isNativeApp,
  isWebApp,
  isIOSApp,
  isAndroidApp,
  getCapacitorPlatform,
} from './capacitorPlatform';
export { parseDeepLinksFromUrl, parseDeepLinksFromHref } from './deepLinkParser';
export {
  applyDeepLinkFromString,
  bootstrapWebDeepLinks,
  GUARDIAN_LINK_PENDING_EVENT,
} from './bootstrapDeepLinks';
export { MobileBootstrap } from './MobileBootstrap';
export {
  MOBILE_FOREGROUND_EVENT,
  notifyMobileForeground,
  shouldRefreshSession,
} from './mobileLifecycle';
export {
  storePendingStaffLink,
  consumePendingStaffLink,
  parseStaffLinkFromUrl,
} from './pendingStaffLink';
export { shareLink, type ShareLinkResult } from './shareLink';

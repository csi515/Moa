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
} from './bootstrapDeepLinks';
export { MobileBootstrap } from './MobileBootstrap';
export {
  storePendingStaffLink,
  consumePendingStaffLink,
  parseStaffLinkFromUrl,
} from './pendingStaffLink';
export { shareLink, type ShareLinkResult } from './shareLink';

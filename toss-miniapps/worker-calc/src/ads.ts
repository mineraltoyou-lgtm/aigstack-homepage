import { TossAds } from '@apps-in-toss/web-framework';

// 앱인토스 콘솔에서 광고 그룹을 만든 뒤 발급된 ID로 바꿔 넣는다. 비어 있으면 광고를 붙이지 않는다.
export const BANNER_AD_GROUP_ID = '';

export function mountBanner(target: HTMLElement) {
  if (!BANNER_AD_GROUP_ID) return;
  try {
    if (!TossAds.initialize.isSupported() || !TossAds.attachBanner.isSupported()) return;
    TossAds.initialize({
      callbacks: {
        onInitialized: () => TossAds.attachBanner(BANNER_AD_GROUP_ID, target, { theme: 'auto', variant: 'card' }),
      },
    });
  } catch {
    // 일반 브라우저(토스 앱 밖)에서는 브리지가 없어 실패한다. 광고 없이 계속 동작.
  }
}

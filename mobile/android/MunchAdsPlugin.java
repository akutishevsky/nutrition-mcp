package business.munch.app;

import android.app.Activity;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

@CapacitorPlugin(name = "MunchAds")
public class MunchAdsPlugin extends Plugin {
    private ConsentInformation consentInformation;
    private boolean consentRefreshComplete = false;
    private boolean consentFormActive = false;
    private boolean bannerRequested = false;
    private boolean adsInitialized = false;
    private AdView bannerView;
    private View webView;
    private int webViewPaddingLeft;
    private int webViewPaddingTop;
    private int webViewPaddingRight;
    private int webViewPaddingBottom;
    private int bannerHeightPx;

    @Override
    public void load() {
        consentInformation = UserMessagingPlatform.getConsentInformation(getContext());
        Activity activity = getActivity();
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            ConsentRequestParameters parameters =
                new ConsentRequestParameters.Builder().build();
            consentInformation.requestConsentInfoUpdate(
                activity,
                parameters,
                () -> {
                    consentRefreshComplete = true;
                    if (bannerRequested) showConsentThenBanner();
                },
                requestError -> {
                    consentRefreshComplete = true;
                    // UMP retains a previous consent decision. If refreshing
                    // fails, only use ads when that stored decision permits it.
                    if (bannerRequested && consentInformation.canRequestAds()) {
                        initializeAndLoadBanner();
                    }
                }
            );
        });
    }

    @PluginMethod
    public void setBannerVisible(PluginCall call) {
        boolean visible = Boolean.TRUE.equals(call.getBoolean("visible", false));
        // Missing entitlement state fails closed: do not request an ad until
        // the signed-in bootstrap explicitly reports adFree=false.
        boolean adFree = Boolean.TRUE.equals(call.getBoolean("adFree", true));
        // ADS-FOUNDATION: the server-driven remote flag (bootstrap
        // ads.enabled, from MUNCH_ADS_ENABLED, DEFAULT OFF) must also
        // arrive as an explicit true. A caller that predates the flag —
        // or a bootstrap that never carried it — makes no ad load
        // attempt at all.
        boolean adsEnabled = Boolean.TRUE.equals(call.getBoolean("adsEnabled", false));
        String adUnitId = getContext().getString(R.string.munch_admob_banner_unit_id);
        bannerRequested = visible && adsEnabled && !adFree && adUnitId != null && !adUnitId.isBlank();

        if (!bannerRequested) {
            runOnUiThread(this::hideBanner);
            call.resolve();
            return;
        }

        call.resolve();
        if (consentRefreshComplete) runOnUiThread(this::showConsentThenBanner);
    }

    @PluginMethod
    public void showPrivacyOptions(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null || consentInformation == null) {
            call.reject("ad_privacy_options_unavailable");
            return;
        }
        activity.runOnUiThread(() ->
            UserMessagingPlatform.showPrivacyOptionsForm(activity, formError -> {
                JSObject result = new JSObject();
                result.put("available", formError == null);
                if (bannerRequested && consentInformation.canRequestAds()) {
                    initializeAndLoadBanner();
                } else if (bannerRequested) {
                    hideBanner();
                }
                call.resolve(result);
            })
        );
    }

    private void showConsentThenBanner() {
        if (!bannerRequested || consentFormActive || consentInformation == null) return;
        consentFormActive = true;
        Activity activity = getActivity();
        if (activity == null) {
            consentFormActive = false;
            return;
        }
        UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity, formError -> {
            consentFormActive = false;
            if (!bannerRequested) return;
            if (consentInformation.canRequestAds()) initializeAndLoadBanner();
            else hideBanner();
        });
    }

    private void initializeAndLoadBanner() {
        runOnUiThread(() -> {
            if (!bannerRequested || consentInformation == null || !consentInformation.canRequestAds()) {
                hideBanner();
                return;
            }
            if (adsInitialized) {
                loadBannerView();
                return;
            }
            adsInitialized = true;
            MobileAds.initialize(getContext(), initializationStatus -> {
                if (bannerRequested && consentInformation.canRequestAds()) loadBannerView();
            });
        });
    }

    private void loadBannerView() {
        Activity activity = getActivity();
        if (activity == null || !bannerRequested) return;
        activity.runOnUiThread(() -> {
            if (!bannerRequested || bannerView != null) return;
            View root = activity.findViewById(android.R.id.content);
            if (!(root instanceof FrameLayout)) return;
            FrameLayout frame = (FrameLayout) root;
            View currentWebView = getBridge() == null ? null : getBridge().getWebView();
            if (currentWebView == null) return;

            AdView adView = new AdView(activity);
            adView.setAdSize(AdSize.BANNER);
            adView.setAdUnitId(getContext().getString(R.string.munch_admob_banner_unit_id));
            adView.setBackgroundColor(Color.WHITE);
            int width = AdSize.BANNER.getWidthInPixels(activity);
            bannerHeightPx = AdSize.BANNER.getHeightInPixels(activity);
            FrameLayout.LayoutParams layout = new FrameLayout.LayoutParams(
                width,
                bannerHeightPx,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
            );

            webView = currentWebView;
            webViewPaddingLeft = webView.getPaddingLeft();
            webViewPaddingTop = webView.getPaddingTop();
            webViewPaddingRight = webView.getPaddingRight();
            webViewPaddingBottom = webView.getPaddingBottom();
            webView.setPadding(
                webViewPaddingLeft,
                webViewPaddingTop,
                webViewPaddingRight,
                webViewPaddingBottom + bannerHeightPx
            );
            bannerView = adView;
            frame.addView(adView, layout);
            adView.loadAd(new AdRequest.Builder().build());
        });
    }

    private void hideBanner() {
        Activity activity = getActivity();
        if (activity != null && !activity.isFinishing()) {
            ViewGroup parent = bannerView == null ? null : (ViewGroup) bannerView.getParent();
            if (parent != null) parent.removeView(bannerView);
            if (webView != null) {
                webView.setPadding(
                    webViewPaddingLeft,
                    webViewPaddingTop,
                    webViewPaddingRight,
                    webViewPaddingBottom
                );
            }
        }
        if (bannerView != null) {
            bannerView.destroy();
            bannerView = null;
        }
        webView = null;
        bannerHeightPx = 0;
    }

    private void runOnUiThread(Runnable action) {
        Activity activity = getActivity();
        if (activity != null && !activity.isFinishing()) activity.runOnUiThread(action);
    }

    @Override
    protected void handleOnPause() {
        if (bannerView != null) bannerView.pause();
    }

    @Override
    protected void handleOnResume() {
        if (bannerView != null) bannerView.resume();
    }

    @Override
    protected void handleOnDestroy() {
        runOnUiThread(this::hideBanner);
        super.handleOnDestroy();
    }
}

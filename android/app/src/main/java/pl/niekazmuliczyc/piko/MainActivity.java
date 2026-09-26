package pl.niekazmuliczyc.piko;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
            .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
            .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G).build());
        MobileAds.putPublisherFirstPartyIdEnabled(false);
        super.onCreate(state);
    }
}

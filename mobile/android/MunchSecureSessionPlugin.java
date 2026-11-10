package business.munch.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "MunchSecureSession")
public class MunchSecureSessionPlugin extends Plugin {
    private static final String KEY_ALIAS = "munch_installed_session_v1";
    private static final String PREFS_NAME = "munch_secure_session";
    private static final String PREF_TOKEN = "session_token";
    private static final String PREF_PENDING_AUTH = "pending_auth";
    private static final int MAX_TOKEN_LENGTH = 16384;
    private static final int MAX_PENDING_AUTH_LENGTH = 4096;
    private static final int GCM_TAG_BITS = 128;
    private static final int IV_BYTES = 12;

    @PluginMethod
    public void getToken(PluginCall call) {
        try {
            String encrypted = preferences().getString(PREF_TOKEN, null);
            JSObject result = new JSObject();
            result.put("token", encrypted == null ? "" : decrypt(encrypted));
            call.resolve(result);
        } catch (Exception error) {
            preferences().edit().remove(PREF_TOKEN).apply();
            call.reject("Unable to read the installed Munch session", error);
        }
    }

    @PluginMethod
    public void setToken(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isBlank() || token.length() > MAX_TOKEN_LENGTH) {
            call.reject("A valid Munch session token is required");
            return;
        }
        try {
            preferences().edit().putString(PREF_TOKEN, encrypt(token)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to store the installed Munch session", error);
        }
    }

    @PluginMethod
    public void clearToken(PluginCall call) {
        preferences().edit().remove(PREF_TOKEN).apply();
        call.resolve();
    }

    @PluginMethod
    public void getPendingAuth(PluginCall call) {
        try {
            String encrypted = preferences().getString(PREF_PENDING_AUTH, null);
            JSObject result = new JSObject();
            result.put("value", encrypted == null ? "" : decrypt(encrypted));
            call.resolve(result);
        } catch (Exception error) {
            preferences().edit().remove(PREF_PENDING_AUTH).apply();
            call.reject("Unable to read the pending Munch sign-in", error);
        }
    }

    @PluginMethod
    public void setPendingAuth(PluginCall call) {
        String value = call.getString("value");
        if (value == null || value.isBlank() || value.length() > MAX_PENDING_AUTH_LENGTH) {
            call.reject("A valid pending Munch sign-in is required");
            return;
        }
        try {
            preferences().edit().putString(PREF_PENDING_AUTH, encrypt(value)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to store the pending Munch sign-in", error);
        }
    }

    @PluginMethod
    public void clearPendingAuth(PluginCall call) {
        preferences().edit().remove(PREF_PENDING_AUTH).apply();
        call.resolve();
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private SecretKey key() throws Exception {
        return loadOrCreateKey();
    }

    private String encrypt(String value) throws Exception {
        return encrypt(key(), value);
    }

    private String decrypt(String value) throws Exception {
        return decrypt(key(), value);
    }

    // Package-private static seam: the instrumented SecureSessionCryptoTest
    // drives these exact production code paths against a real
    // AndroidKeyStore key on a device/emulator. JVM unit tests cannot —
    // AndroidKeyStore does not exist off-device, which is how the
    // caller-IV defect shipped unnoticed.
    static SecretKey loadOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return (SecretKey) keyStore.getKey(KEY_ALIAS, null);
        }

        KeyGenerator generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        );
        generator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)
                .build()
        );
        return generator.generateKey();
    }

    static String encrypt(SecretKey key, String value) throws Exception {
        // AndroidKeyStore forbids caller-specified IVs for GCM
        // encryption ("Caller-provided IV not permitted" — the
        // 2026-11-10 sign-in defect, reproduced by
        // SecureSessionCryptoTest): the provider generates the IV, and
        // the writer reads it back via cipher.getIV(). Specifying the
        // stored IV on DECRYPT stays legal and is unchanged below, so
        // the envelope format is identical either way.
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] iv = cipher.getIV();
        if (iv == null || iv.length != IV_BYTES) {
            throw new IllegalStateException("Unexpected GCM IV from provider");
        }
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        return Base64.encodeToString(iv, Base64.NO_WRAP)
            + "."
            + Base64.encodeToString(encrypted, Base64.NO_WRAP);
    }

    static String decrypt(SecretKey key, String value) throws Exception {
        String[] parts = value.split("\\.", 2);
        if (parts.length != 2) throw new IllegalArgumentException("Invalid session envelope");
        byte[] iv = Base64.decode(parts[0], Base64.NO_WRAP);
        byte[] encrypted = Base64.decode(parts[1], Base64.NO_WRAP);
        if (iv.length != IV_BYTES) throw new IllegalArgumentException("Invalid session IV");

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }
}

package com.babyfeeder.app;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 启用WebView调试
        // 注意：在生产环境中应禁用此功能
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
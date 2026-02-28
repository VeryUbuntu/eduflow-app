"use client";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getToken = () => {
    if (typeof window === "undefined") return null;

    const decodeSupabaseCookieValue = (value: string) => {
        if (value.startsWith('base64-')) {
            const b64 = value.slice(7).replace(/-/g, '+').replace(/_/g, '/');
            try {
                // b64 to utf8 string
                return decodeURIComponent(atob(b64).split('').map((c) => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            } catch (e) {
                return atob(b64);
            }
        }
        return value;
    };

    // Check common Supabase tokens in localStorage first (dev scenario)
    for (const key in localStorage) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            const tokenStr = localStorage.getItem(key);
            if (tokenStr) {
                try {
                    const parsed = JSON.parse(tokenStr);
                    if (parsed.access_token) return parsed.access_token;
                } catch (e) { }
            }
        }
    }

    // Read from cookies: handle chunked Supabase SSR cookies or unchunked
    const cookieStr = document.cookie || "";
    const cookiePairs = cookieStr.split(';').map(c => c.trim());

    // First, try to find a complete non-chunked token ending in -auth-token
    for (const cookie of cookiePairs) {
        if (/^sb-.*-auth-token=/.test(cookie) && !cookie.includes('-auth-token.')) {
            try {
                let val = decodeURIComponent(cookie.split('=')[1]);
                val = decodeSupabaseCookieValue(val);
                const parsed = JSON.parse(val);
                if (parsed.access_token) return parsed.access_token;
                if (parsed[0]) {
                    const jsonObj = JSON.parse(parsed[0]);
                    if (jsonObj.access_token) return jsonObj.access_token;
                }
            } catch (e) { }
        }
    }

    // Second, try to reassemble chunked tokens (like sb-xxx-auth-token.0, sb-xxx-auth-token.1)
    const chunks: Record<string, string[]> = {};
    for (const cookie of cookiePairs) {
        const match = cookie.match(/^(sb-.*-auth-token)\.(\d+)=(.+)$/);
        if (match) {
            const baseName = match[1];
            const idx = parseInt(match[2]);
            const val = match[3];
            if (!chunks[baseName]) chunks[baseName] = [];
            chunks[baseName][idx] = val;
        }
    }

    for (const baseName in chunks) {
        try {
            const combined = chunks[baseName].join('');
            let val = decodeURIComponent(combined);
            val = decodeSupabaseCookieValue(val);
            const parsed = JSON.parse(val);
            if (parsed.access_token) return parsed.access_token;
        } catch (e) { }
    }

    // Check old fallback cookies
    const match = document.cookie.match(new RegExp('(^| )sb-access-token=([^;]+)')) ||
        document.cookie.match(new RegExp('(^| )sxu_auth_token=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);

    // As a fallback for development if they don't have SSO setup completely yet:
    return localStorage.getItem("eduflow_dev_token") || null;
};

export const setDevToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("eduflow_dev_token", token);
    }
};

export const removeToken = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
        localStorage.removeItem("eduflow_dev_token");
        document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
    }
};

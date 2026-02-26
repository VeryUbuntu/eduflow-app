"use client";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getToken = () => {
    if (typeof window === "undefined") return null;

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

    // Checking cookies assuming sxu.com sets 'sb-access-token' or similar
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

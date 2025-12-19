"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const setToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("eduflow_token", token);
    }
};

export const getToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("eduflow_token");
    }
    return null;
};

export const removeToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("eduflow_token");
    }
};

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setIsAuthenticated(false);
        } else {
            setIsAuthenticated(true);
        }
    }, []);

    const logout = () => {
        removeToken();
        setIsAuthenticated(false);
        router.push("/login");
    };

    return { isAuthenticated, logout };
};

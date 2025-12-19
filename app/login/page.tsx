"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2 } from "lucide-react";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ username: "", password: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const formBody = new URLSearchParams();
            formBody.append("username", formData.username);
            formBody.append("password", formData.password);

            const res = await fetch("/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formBody,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "登录失败，请检查账号密码");
            }

            setToken(data.access_token);
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
                backgroundSize: "24px 24px"
            }}
        >
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-cyan-600 p-3 rounded-xl text-white mb-4 shadow-lg shadow-cyan-200">
                        <BookOpen size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">欢迎回来</h1>
                    <p className="text-slate-500 text-sm mt-2">登录您的 EduFlow 账号</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">邮箱地址</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password">密码</Label>
                            <Link href="/forgot-password" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
                                忘记密码？
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="h-11"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11 text-base bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-100" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "登 录"}
                    </Button>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        还没有账号？{" "}
                        <Link href="/register" className="text-cyan-600 hover:text-cyan-700 font-bold hover:underline">
                            立即注册
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

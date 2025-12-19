"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { setToken } from "@/lib/auth";
import { EduFlowLogo } from "@/components/EduFlowLogo";

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
            const formDataBody = new FormData();
            formDataBody.append("username", formData.username);
            formDataBody.append("password", formData.password);

            const res = await fetch("/api/token", {
                method: "POST",
                body: formDataBody,
            });

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // If it's not JSON (e.g. 500 HTML page), throw raw text
                throw new Error(`服务端异常: ${text.substring(0, 100)}`);
            }

            if (!res.ok) {
                throw new Error(data.detail || "登录失败");
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
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0L0 0L0 60' fill='none' stroke='%23e2e8f0' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px"
            }}
        >
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 z-10 transition-all">
                <div className="flex flex-col items-center mb-10">
                    <div className="mb-4 transform scale-125">
                        <EduFlowLogo variant="sidebar" />
                    </div>
                    <p className="text-slate-500 text-sm mt-2 font-medium">AI 驱动的个性化知识卡片</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-cyan-900 font-medium">邮箱地址</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="h-11 border-cyan-100 focus-visible:ring-cyan-500 bg-cyan-50/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password" className="text-cyan-900 font-medium">密码</Label>
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
                            className="h-11 border-cyan-100 focus-visible:ring-cyan-500 bg-cyan-50/20"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-medium text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11 text-base bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all hover:scale-[1.02]" disabled={loading}>
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

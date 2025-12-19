"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2 } from "lucide-react";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ username: "", password: "", confirmPassword: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("两次输入的密码不一致");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "注册失败，请稍后再试");
            }

            setToken(data.access_token); // Auto login
            router.push("/"); // Go to dashboard (Setup will trigger there)
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">创建账号</h1>
                    <p className="text-slate-500 text-sm mt-2">开启多孩子、多学科的智能学习之旅</p>
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
                        <Label htmlFor="password">设置密码</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">确认密码</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="h-11"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11 text-base bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-100" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "注 册"}
                    </Button>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        已有账号？{" "}
                        <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-bold hover:underline">
                            直接登录
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

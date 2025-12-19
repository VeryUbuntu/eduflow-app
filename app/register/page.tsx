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

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`服务端返回异常: ${text.substring(0, 100)}`);
            }

            if (!res.ok) {
                throw new Error(data.detail || "注册失败，请稍后再试");
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
                    <p className="text-slate-500 text-sm mt-2 font-medium">开启多孩子、多学科的智能学习之旅</p>
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
                        <Label htmlFor="password" className="text-cyan-900 font-medium">设置密码</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="h-11 border-cyan-100 focus-visible:ring-cyan-500 bg-cyan-50/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-cyan-900 font-medium">确认密码</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="h-11 border-cyan-100 focus-visible:ring-cyan-500 bg-cyan-50/20"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-medium text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11 text-base bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all hover:scale-[1.02]" disabled={loading}>
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

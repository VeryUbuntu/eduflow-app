"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });
            // Always show success for security/UX
            setIsSent(true);
        } catch (err) {
            console.error(err);
            setIsSent(true);
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">重置密码</h1>
                    <p className="text-slate-500 text-sm mt-2">输入您注册时的邮箱地址</p>
                </div>

                {isSent ? (
                    <div className="text-center space-y-4">
                        <div className="bg-green-50 text-green-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <MailCheck size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">邮件已发送</h2>
                        <p className="text-slate-500">
                            如果该邮箱已注册，我们将向其发送重置链接。请检查您的收件箱。
                        </p>
                        <div className="pt-4">
                            <Link href="/login">
                                <Button variant="outline" className="w-full">返回登录</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">邮箱地址</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-base bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-100" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "发送重置链接"}
                        </Button>

                        <div className="text-center mt-4">
                            <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                                <ArrowLeft size={16} /> 返回登录
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

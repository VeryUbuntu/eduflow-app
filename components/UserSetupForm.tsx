"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getToken } from "@/lib/auth";

export function UserSetupForm({ onComplete }: { onComplete: () => void }) {
    const [name, setName] = useState("");
    const [phase, setPhase] = useState("小学");
    const [grade, setGrade] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const PHASES = ["小学", "初中", "高中", "大学"];
    const SUBJECTS = [
        "语文", "数学", "英语",
        "物理", "化学", "生物",
        "历史", "地理", "政治",
        "通用"
    ];

    const toggleSubject = (subject: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const handleSubmit = async () => {
        if (!name || !grade) return;
        setLoading(true);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    name,
                    phase,
                    grade,
                    subjects: selectedSubjects.length > 0 ? selectedSubjects : ["通用"]
                })
            });

            if (res.ok) {
                onComplete();
            } else {
                alert("添加用户失败。请检查后端日志。");
            }
        } catch (e) {
            console.error(e);
            alert("请求出错，请检查网络或服务器状态。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-cyan-100">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-cyan-600">欢迎使用 EduFlow</h1>
                    <p className="text-slate-500">请先创建一个用户档案以开始学习之旅。</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-slate-600">姓名</Label>
                        <Input
                            placeholder="请输入您的名字"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="focus-visible:ring-cyan-500 border-slate-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-600">学段</Label>
                            <Select value={phase} onValueChange={setPhase}>
                                <SelectTrigger className="focus:ring-cyan-500 border-slate-200">
                                    <SelectValue placeholder="选择学段" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PHASES.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600">年级</Label>
                            <Input
                                placeholder="例如：三年级"
                                value={grade}
                                onChange={e => setGrade(e.target.value)}
                                className="focus-visible:ring-cyan-500 border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-600">订阅科目</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {SUBJECTS.map(s => (
                                <div key={s} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={s}
                                        checked={selectedSubjects.includes(s)}
                                        onCheckedChange={() => toggleSubject(s)}
                                        className="data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600 border-slate-300"
                                    />
                                    <Label htmlFor={s} className="cursor-pointer text-slate-600">{s}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={loading || !name || !grade}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        开始体验
                    </Button>
                </div>
            </div>
        </div>
    );
}

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
import { Loader2, Settings } from "lucide-react";
import { getToken } from "@/lib/auth";

export function UserSetupForm({ onComplete }: { onComplete: () => void }) {
    const [name, setName] = useState("");
    const [phase, setPhase] = useState("初中");
    const [grade, setGrade] = useState("");
    const [province, setProvince] = useState("山东");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [textbookVersions, setTextbookVersions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const PHASES = ["小学", "初中", "高中"];
    const PROVINCES = ["北京", "上海", "天津", "重庆", "河北", "山西", "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "台湾", "内蒙古", "广西", "西藏", "宁夏", "新疆"];

    // Compute dynamic subjects based on the selected phase
    const availableSubjects = phase === "小学"
        ? ["语文", "数学", "英语", "科学", "编程基础", "综合"]
        : ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "道德与法治", "综合", "AI"];

    const SUBJECT_VERSIONS: Record<string, string[]> = {
        "语文": ["统编版-人民教育出版社"],
        "数学": ["人教版-人民教育出版社", "冀教版-河北教育出版社", "北京版-北京出版社", "北师大版-北京师范大学出版社", "华东师大版-华东师范大学出版社", "沪科技版-上海科学技术出版社", "浙教版-浙江教育出版社", "湘教版-湖南教育出版社", "苏科版-江苏凤凰科学技术出版社", "青岛版-青岛出版社"],
        "英语": ["人教版-人民教育出版社", "冀教版-河北教育出版社", "北师大版-北京师范大学出版社", "外研社版-外语教学与研究出版社", "沪外教版-上海外语教育出版社", "沪教版-上海教育出版社", "科普版-科学普及出版社", "译林版-译林出版社"],
        "物理": ["人教版-人民教育出版社", "教科版-教育科学出版社", "沪科技版-上海科学技术出版社", "沪科技粤教版-上海科技广东教育", "苏科版-江苏凤凰科学技术出版社", "北师大版-北京师范大学出版社"],
        "化学": ["人教版-人民教育出版社", "北京版-北京出版社", "沪教版-上海教育出版社", "科学粤教版-科学广东教育", "科普版-科学普及出版社", "鲁教版-山东教育出版社"],
        "生物": ["人教版-人民教育出版社", "冀少版-河北少年儿童出版社", "北京版-北京出版社", "北师大版-北京师范大学出版社", "济南版-济南出版社", "苏教版-江苏凤凰教育出版社", "苏科版-江苏凤凰科学技术出版社"],
        "历史": ["统编版-人民教育出版社"],
        "地理": ["人教版-人民教育出版社", "中图版-中国地图出版社", "商务星图版-商务星球地图出版社", "晋教版-山西教育出版社", "湘教版-湖南教育出版社", "科普版-科学普及出版社", "粤教粤人版-广东教育广东人民"],
        "道德与法治": ["统编版-人民教育出版社"],
        "科学": ["教科版-教育科学出版社", "苏教版-江苏教育出版社", "冀教版-河北教育出版社"],
        "通用": ["通用版"]
    };

    const toggleSubject = (subject: string) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(prev => prev.filter(s => s !== subject));
            const newVersions = { ...textbookVersions };
            delete newVersions[subject];
            setTextbookVersions(newVersions);
        } else {
            setSelectedSubjects(prev => [...prev, subject]);
            const defaultVersion = SUBJECT_VERSIONS[subject] ? SUBJECT_VERSIONS[subject][0] : "通用版";
            setTextbookVersions(prev => ({ ...prev, [subject]: defaultVersion }));
        }
    };

    const updateSubjectVersion = (subject: string, version: string) => {
        setTextbookVersions(prev => ({ ...prev, [subject]: version }));
    };

    const handleSubmit = async () => {
        if (!name || !grade || !province) return;
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch("/eduflow/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    phase,
                    grade,
                    province,
                    subjects: selectedSubjects.length > 0 ? selectedSubjects : ["通用"],
                    textbook_versions: textbookVersions
                })
            });

            if (res.ok) {
                onComplete();
            } else {
                alert("添加用户档案失败。");
            }
        } catch (e) {
            console.error(e);
            alert("请求出错，请检查网络或服务器状态。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-50/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-xl w-full flex flex-col items-center my-8">
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg flex items-center justify-center text-white font-black text-2xl">
                        E
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-slate-800">Eduflow<span className="text-cyan-600">.</span></span>
                </div>

                <div className="w-full space-y-8 bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-100/50">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="w-6 h-6 text-cyan-500" /> 建立学情档案
                        </h1>
                        <p className="text-slate-500 font-medium">定制您的千万级个性化学习计划</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-bold">学习者称呼</Label>
                            <Input
                                placeholder="如：李小明"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 transition-all rounded-xl shadow-sm text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-bold">所在省份</Label>
                            <Select value={province} onValueChange={setProvince}>
                                <SelectTrigger className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 rounded-xl shadow-sm text-base">
                                    <SelectValue placeholder="选择省份（影响考纲）" />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                    {PROVINCES.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-bold">学段</Label>
                            <Select value={phase} onValueChange={setPhase}>
                                <SelectTrigger className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 rounded-xl shadow-sm text-base">
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
                            <Label className="text-slate-700 font-bold">年级</Label>
                            <Input
                                placeholder="例如：初二 / 八年级"
                                value={grade}
                                onChange={e => setGrade(e.target.value)}
                                className="h-12 bg-slate-50 border-transparent focus:bg-white focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100 transition-all rounded-xl shadow-sm text-base"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-700 font-bold text-base">订阅科目及教材版本</Label>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">多选</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {availableSubjects.map(s => (
                                <div key={s} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-colors group">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={s}
                                            checked={selectedSubjects.includes(s)}
                                            onCheckedChange={() => toggleSubject(s)}
                                            className="w-5 h-5 border-slate-300 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 text-white"
                                        />
                                        <Label htmlFor={s} className="cursor-pointer font-medium text-slate-700 text-base">{s}</Label>
                                    </div>
                                    {selectedSubjects.includes(s) && (
                                        <Select value={textbookVersions[s] || (SUBJECT_VERSIONS[s] ? SUBJECT_VERSIONS[s][0] : "通用版")} onValueChange={(v) => updateSubjectVersion(s, v)}>
                                            <SelectTrigger className="w-[180px] h-8 text-xs bg-white border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                {(SUBJECT_VERSIONS[s] || ["通用版"]).map(v => (
                                                    <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-xl shadow-cyan-500/20 rounded-xl transition-all active:scale-[0.98]"
                        onClick={handleSubmit}
                        disabled={loading || !name || !grade || !province || selectedSubjects.length === 0}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        生成专属学情数据流
                    </Button>
                </div>
            </div>
        </div>
    );
}

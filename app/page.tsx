"use client";

import React, { useState, useEffect } from "react";
import { UserSetupForm } from "@/components/UserSetupForm";
import { Button } from "@/components/ui/button";
import { format, differenceInCalendarDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Loader2, Plus, RefreshCcw, Pencil, Target, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---

type User = {
  id: number;
  name: string;
  phase: string;
  grade: string;
  subjects: string[];
};

type UserGoal = {
  id: number;
  description: string;
  target_date: string;
};

type CardData = {
  id: number;
  title: string;
  content: string;
  subject: string;
  date: string;
};

// --- Constants ---

const SUBJECT_COLORS: Record<string, string> = {
  "数学": "bg-blue-100 border-blue-200 text-blue-900",
  "语文": "bg-red-100 border-red-200 text-red-900",
  "英语": "bg-purple-100 border-purple-200 text-purple-900",
  "物理": "bg-indigo-100 border-indigo-200 text-indigo-900",
  "化学": "bg-emerald-100 border-emerald-200 text-emerald-900",
  "生物": "bg-green-100 border-green-200 text-green-900",
  "历史": "bg-amber-100 border-amber-200 text-amber-900",
  "地理": "bg-cyan-100 border-cyan-200 text-cyan-900",
  "通用": "bg-gray-100 border-gray-200 text-gray-900",
};

const SUBJECT_BADGE_COLORS: Record<string, string> = {
  "数学": "bg-blue-500 shadow-blue-200",
  "语文": "bg-red-500 shadow-red-200",
  "英语": "bg-purple-500 shadow-purple-200",
  "物理": "bg-indigo-500 shadow-indigo-200",
  "化学": "bg-emerald-500 shadow-emerald-200",
  "生物": "bg-green-500 shadow-green-200",
  "历史": "bg-amber-500 shadow-amber-200",
  "地理": "bg-cyan-500 shadow-cyan-200",
  "通用": "bg-gray-500 shadow-gray-200",
};

import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

// --- Components ---

function SortableCard({ card, onRefresh, onExplain }: { card: CardData, onRefresh: (subject: string) => void, onExplain: (card: CardData) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  const [isSpinning, setIsSpinning] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const colorClass = SUBJECT_COLORS[card.subject] || SUBJECT_COLORS["通用"];
  const badgeColorClass = SUBJECT_BADGE_COLORS[card.subject] || SUBJECT_BADGE_COLORS["通用"];

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpinning(true);
    onRefresh(card.subject);
    // Stop spinning after 3 seconds timeout as safeguard, 
    // or ideally the parent re-renders and this component is remounted/updated.
    setTimeout(() => setIsSpinning(false), 3000);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full h-full">
      <div className={cn(
        "h-full min-h-[200px] rounded-xl p-5 shadow-sm hover:shadow-md border flex flex-col gap-3 bg-white transition-all duration-200 group relative select-none",
        colorClass.split(" ")[1],
      )}>
        {/* Actions: Refresh & Explain */}
        <div className="absolute top-4 right-4 flex gap-1 z-10 opacity-30 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 h-8 w-8"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onExplain(card); }}
            title="AI 详解"
          >
            <BookOpen size={14} className="text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 h-8 w-8"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleRefreshClick}
            title="刷新此卡片"
          >
            <RefreshCcw size={14} className={cn("text-slate-500", isSpinning && "animate-spin")} />
          </Button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center pr-20 border-b border-dashed border-slate-100 pb-2">
          <Badge variant="outline" className={cn("border-none font-bold text-sm px-3 py-1 text-white shadow-md rounded-lg", badgeColorClass)}>
            {card.subject}
          </Badge>
          <span className="text-[10px] text-slate-400 font-mono">{card.date}</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center items-start text-left py-4 px-1 cursor-grab active:cursor-grabbing">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 leading-snug w-full">
            <Latex>
              {(() => {
                const parts = card.content.split(/[:：]/);
                return parts.length > 0 ? parts[0] : "";
              })()}
            </Latex>
          </h3>
          <div className="text-base text-slate-600 leading-[1.75] font-normal w-full tracking-wide whitespace-pre-line">
            <Latex>
              {(() => {
                const parts = card.content.split(/[:：]/);
                return parts.length > 1 ? parts.slice(1).join("：") : card.content;
              })()}
            </Latex>
          </div>
        </div>

        {/* Footer Decor */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <div className={cn("w-6 h-1 rounded-full", colorClass.split(" ")[0].replace("bg-", "bg-opacity-80 bg-"))} />
            <div className="w-2 h-1 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // Cards State
  const [dailyCards, setDailyCards] = useState<CardData[]>([]);
  const [cardLoading, setCardLoading] = useState(false);

  // Explain State
  const [explainDialogOpen, setExplainDialogOpen] = useState(false);
  const [explainContent, setExplainContent] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [currentExplainingCard, setCurrentExplainingCard] = useState<CardData | null>(null);

  // Goal State
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ description: "", target_date: "" });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleExplain = async (card: CardData) => {
    if (!currentUser) return;
    setCurrentExplainingCard(card);
    setExplainContent("");
    setIsExplaining(true);
    setExplainDialogOpen(true);

    try {
      const res = await fetch("/api/explain-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: card.content,
          subject: card.subject,
          user_id: currentUser.id
        })
      });
      const data = await res.json();
      setExplainContent(data.explanation);
    } catch (e) {
      console.error(e);
      setExplainContent("抱歉，获取详解失败，请稍后再试。");
    } finally {
      setIsExplaining(false);
    }
  };

  // Initial Fetch
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
      if (data.length > 0) {
        if (!currentUser) setCurrentUser(data[0]);
      } else {
        setShowSetup(true);
      }
    } catch (e) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyCards = async () => {
    if (!currentUser) return;
    setCardLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/generate-cards?user_id=${currentUser.id}&current_date=${today}`, {
        method: "POST"
      });
      const data = await res.json();
      setDailyCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCardLoading(false);
    }
  };

  const fetchUserGoal = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/goal`);
      if (res.ok) {
        const data = await res.json();
        setUserGoal(data);
        if (data) {
          setGoalForm({ description: data.description, target_date: data.target_date });
        }
      } else {
        setUserGoal(null);
      }
    } catch (e) {
      console.error("Failed to fetch goal");
    }
  }

  const handleSaveGoal = async () => {
    if (!currentUser || !goalForm.description || !goalForm.target_date) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalForm)
      });
      const data = await res.json();
      setUserGoal(data);
      setIsGoalDialogOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshSingleCard = async (subject: string) => {
    if (!currentUser) return;
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/regenerate-card?user_id=${currentUser.id}&subject=${subject}&current_date=${today}`, {
        method: "POST"
      });
      const newCard = await res.json();
      setDailyCards(prev => prev.map(c => c.subject === subject ? newCard : c));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setDailyCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDailyCards();
      fetchUserGoal();
    }
  }, [currentUser]);

  const handleSwitchUser = (u: User) => {
    setDailyCards([]);
    setUserGoal(null);
    setCurrentUser(u);
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (showSetup) {
    return <UserSetupForm onComplete={() => { setShowSetup(false); fetchUsers(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-800 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 z-20 flex flex-col gap-6 shadow-sm flex-none">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="bg-cyan-600 p-1.5 rounded-lg text-white">
            <BookOpen size={20} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">EduFlow</h1>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">家庭成员</p>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleSwitchUser(u)}
              className={cn(
                "w-full text-left px-4 py-3 transition-all flex flex-col relative overflow-hidden group border-l-4",
                currentUser?.id === u.id
                  ? "bg-cyan-50 border-cyan-600 text-cyan-700"
                  : "border-transparent hover:bg-slate-50 text-slate-700"
              )}
            >
              <span className={cn("text-lg relative z-10", currentUser?.id === u.id ? "font-bold" : "font-semibold")}>{u.name}</span>
              <span className={cn("text-xs relative z-10", currentUser?.id === u.id ? "text-cyan-600/80" : "text-slate-400")}>
                {u.grade} | {u.phase}
              </span>
            </button>
          ))}
          <Button variant="ghost" className="w-full justify-start gap-2 mt-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium" onClick={() => setShowSetup(true)}>
            <div className="bg-slate-200 rounded-full p-0.5"><Plus size={14} /></div> 添加家庭成员
          </Button>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-slate-400 text-center">
            {format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
          </p>
        </div>
      </aside>

      {/* Main Area: The "Desk" */}
      <main
        className="flex-1 overflow-hidden relative flex flex-col bg-[#f8fafc]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='30' height='30' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 30 0 L 0 0 0 30' fill='none' stroke='rgba(0,0,0,0.05)' stroke-width='1' stroke-dasharray='4 4'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
        }}
      >
        <header className="flex-none px-6 py-6 md:px-8 border-b z-30 shadow-sm bg-white">
          <div className="flex flex-row justify-between items-center gap-8">
            {/* Left Column: Date & Month Strip */}
            <div className="flex flex-col gap-6 flex-1 min-w-0">
              {/* Date Block */}
              <div className="flex items-baseline gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-cyan-600">
                  {format(new Date(), "dd")}
                </h1>
                <span className="text-xl text-slate-500 font-medium">
                  {format(new Date(), "MM月 yyyy")}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  {format(new Date(), "EEEE", { locale: zhCN })}
                </span>
              </div>

              {/* Month Days Strip (Refined Small & Light) */}
              <div className="w-fit relative max-w-full">
                <div
                  className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide border-b-[2px] border-cyan-500/40 px-4 -mx-4"
                  style={{ maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)" }}
                >
                  {(() => {
                    const today = new Date();
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    const currentDay = today.getDate();
                    const days = [];

                    for (let d = currentDay; d <= daysInMonth; d++) {
                      days.push(d);
                    }

                    return days.map((d) => {
                      const isToday = d === currentDay;
                      const dateObj = new Date(today.getFullYear(), today.getMonth(), d);
                      const dayOfWeek = dateObj.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                      return (
                        <div
                          key={d}
                          className={cn(
                            "flex flex-col items-center justify-center min-w-[34px] h-[46px] rounded-lg transition-all cursor-default select-none relative flex-shrink-0",
                            isToday
                              ? "bg-cyan-600 text-white shadow-sm scale-105"
                              : "bg-transparent hover:bg-slate-50 text-slate-500"
                          )}
                        >
                          <span className={cn(
                            "text-[8px] font-medium mb-0.5 uppercase tracking-wider",
                            isToday ? "text-cyan-100" : isWeekend ? "text-red-300" : "text-slate-300"
                          )}>
                            {format(dateObj, "EEE", { locale: zhCN })}
                          </span>
                          <span className={cn(
                            "text-lg font-light leading-none",
                            isToday ? "text-white font-normal" : "text-slate-600"
                          )}>
                            {d}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Right Column: Goal Countdown Section (Vertically Centered) */}
            <div className="flex items-center flex-none">
              {userGoal ? (
                <div
                  className="flex items-center gap-4 bg-white border border-slate-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] rounded-2xl px-5 py-3 hover:border-cyan-200 hover:shadow-cyan-50 transition-all cursor-pointer group select-none"
                  onClick={() => setIsGoalDialogOpen(true)}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-100 group-hover:scale-110 transition-all duration-300">
                    <Target size={20} className="stroke-[2.5px]" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">当前目标</span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded-md">{userGoal.description}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xs text-slate-400">还剩</span>
                      <span className="text-xl font-extrabold text-cyan-600 font-mono tracking-tight leading-none">
                        {differenceInCalendarDays(new Date(userGoal.target_date), new Date())}
                      </span>
                      <span className="text-xs text-slate-400">天</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2 text-slate-500 border-dashed rounded-xl h-12 px-6 hover:border-cyan-400 hover:text-cyan-600"
                  onClick={() => setIsGoalDialogOpen(true)}
                >
                  <Target size={16} />
                  <span>设定学习目标</span>
                </Button>
              )}
            </div>
          </div>


        </header>

        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>设置阶段目标</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>目标名称</Label>
                <Input
                  placeholder="例如：期末考试"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>目标日期</Label>
                <Input
                  type="date"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveGoal}>保存目标</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Explain Dialog */}
        <Dialog open={explainDialogOpen} onOpenChange={setExplainDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen size={20} className="text-cyan-600" />
                <span>知识详解 - {currentExplainingCard?.subject}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Original Content */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 mb-2 font-bold">原文知识点：</p>
                <div className="text-slate-800 font-medium">
                  <Latex>{currentExplainingCard?.content || ""}</Latex>
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <p className="text-sm text-slate-500 font-bold">AI 深度解析：</p>
                {isExplaining ? (
                  <div className="flex items-center gap-2 text-cyan-600 py-8 justify-center">
                    <Loader2 className="animate-spin" />
                    <span>正在生成详细解读与举例...</span>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                    <Latex>{explainContent}</Latex>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setExplainDialogOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {cardLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
              <Loader2 className="animate-spin text-slate-400" size={48} />
              <p className="text-slate-400 font-medium">知识萃取中...</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={dailyCards.map(c => c.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20 w-full mx-auto">
                  {dailyCards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onRefresh={handleRefreshSingleCard}
                      onExplain={handleExplain}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  );
}

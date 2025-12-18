"use client";

import React, { useState, useEffect } from "react";
import { UserSetup } from "@/components/UserSetup";
import { Button } from "@/components/ui/button";
import { format, differenceInCalendarDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Loader2, Plus, RefreshCcw, Pencil, Target } from "lucide-react";
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

// --- Components ---

function SortableCard({ card, onRefresh }: { card: CardData, onRefresh: (subject: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const colorClass = SUBJECT_COLORS[card.subject] || SUBJECT_COLORS["通用"];

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full h-full">
      <div className={cn(
        "h-full min-h-[320px] rounded-2xl p-6 shadow-sm hover:shadow-xl border flex flex-col gap-4 bg-white transition-all duration-300 group relative select-none",
        colorClass.split(" ")[1],
      )}>
        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-100 z-10"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRefresh(card.subject); }}
          title="刷新此卡片"
        >
          <RefreshCcw size={14} className="text-slate-500" />
        </Button>

        {/* Header */}
        <div className="flex justify-between items-center pr-10 border-b border-dashed border-slate-200 pb-3">
          <Badge variant="outline" className={cn("bg-white border-none font-bold text-sm px-3 py-1 shadow-sm", colorClass.split(" ")[2])}>
            {card.subject}
          </Badge>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">{card.date}</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center items-start text-left py-4 px-1 cursor-grab active:cursor-grabbing">
          <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug w-full">
            {(() => {
              const parts = card.content.split(/[:：]/);
              return parts.length > 0 ? parts[0] : "";
            })()}
          </h3>
          <p className="text-base text-slate-700 leading-7 font-normal w-full tracking-wide">
            {(() => {
              const parts = card.content.split(/[:：]/);
              return parts.length > 1 ? parts.slice(1).join("：") : card.content;
            })()}
          </p>
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
    return <UserSetup onComplete={() => { setShowSetup(false); fetchUsers(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col md:flex-row text-slate-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 z-20 flex flex-col gap-6 shadow-sm flex-none">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">EduFlow</h1>
          <p className="text-xs text-slate-500 mt-1">家庭版</p>
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">家庭成员</p>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleSwitchUser(u)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-all flex flex-col relative overflow-hidden group",
                currentUser?.id === u.id ? "bg-cyan-600 text-white shadow-md" : "hover:bg-slate-100 text-slate-700"
              )}
            >
              <span className="font-bold text-lg relative z-10">{u.name}</span>
              <span className={cn("text-xs relative z-10", currentUser?.id === u.id ? "text-cyan-100" : "text-slate-500")}>
                {u.grade} | {u.phase}
              </span>
            </button>
          ))}
          <Button variant="outline" className="w-full justify-start gap-2 mt-4 border-dashed" onClick={() => setShowSetup(true)}>
            <Plus size={16} /> 添加成员
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
          <div className="flex flex-col gap-6">
            {/* Top Row: Date, Title, Goal */}
            <div className="flex justify-between items-start md:items-end">
              <div className="flex flex-col gap-1">
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
              </div>

              {/* Goal Countdown Section */}
              <div className="flex items-center gap-4">
                {userGoal ? (
                  <div className="flex items-center gap-3 bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-100">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-cyan-500 font-medium">{userGoal.description}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-cyan-600 text-xs">还剩</span>
                        <span className="text-2xl font-bold text-cyan-700 leading-none">
                          {differenceInCalendarDays(new Date(userGoal.target_date), new Date())}
                        </span>
                        <span className="text-cyan-600 text-xs">天</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-cyan-300 hover:text-cyan-600 hover:bg-cyan-100" onClick={() => setIsGoalDialogOpen(true)}>
                      <Pencil size={12} />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-2 text-slate-500" onClick={() => setIsGoalDialogOpen(true)}>
                    <Target size={14} /> 设置目标
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Row: Month Days Strip (Refined) */}
            <div className="w-fit">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide border-b-[2px] border-cyan-500/50">
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
                    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                      <div
                        key={d}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[34px] h-[50px] rounded-md transition-all cursor-default select-none relative",
                          isToday
                            ? "border border-cyan-500 text-cyan-700"
                            : "bg-transparent hover:bg-slate-50"
                        )}
                      >
                        <span className={cn(
                          "text-[9px] font-light mb-0.5",
                          isToday ? "text-cyan-600/80" : isWeekend ? "text-red-400" : "text-slate-400"
                        )}>
                          {format(dateObj, "E", { locale: zhCN })}
                        </span>
                        <span className={cn(
                          "text-sm font-normal leading-none tracking-tight",
                          isToday ? "text-cyan-700 font-bold" : isWeekend ? "text-red-500" : "text-slate-600"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20 max-w-5xl mx-auto">
                  {dailyCards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onRefresh={handleRefreshSingleCard}
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

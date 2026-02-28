"use client";

import React, { useState, useEffect } from "react";
import { UserSetupForm } from "@/components/UserSetupForm";
import { EduFlowLogo } from "@/components/EduFlowLogo";
import SnowEffect from "@/components/SnowEffect";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { format, differenceInCalendarDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { getToken, removeToken, setDevToken } from "@/lib/auth";
import { Loader2, Plus, RefreshCcw, Pencil, Target, BookOpen, LogOut, UserCircle, Trash2, Settings } from "lucide-react";
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
  semester: string;
  month: string;
  province: string;
  textbook_versions: Record<string, string>;
  learning_units: Record<string, string[]>;
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

const PHASES = ["小学", "初中", "高中"];
const SEMESTERS = ["上学期", "下学期", "全学年"];
const MONTHS = ["第1个月", "第2个月", "第3个月", "第4个月", "第5个月", "第6个月"];
const PROVINCES = ["北京", "上海", "天津", "重庆", "河北", "山西", "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "台湾", "内蒙古", "广西", "西藏", "宁夏", "新疆"];

const getAvailableSubjects = (phase: string) => {
  return phase === "小学"
    ? ["语文", "数学", "英语", "科学", "编程基础", "综合"]
    : ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "道德与法治", "综合", "AI"];
};
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
  "道德与法治": "bg-rose-100 border-rose-200 text-rose-900",
  "科学": "bg-teal-100 border-teal-200 text-teal-900",
  "综合": "bg-orange-100 border-orange-200 text-orange-900",
  "编程基础": "bg-slate-100 border-slate-300 text-slate-800",
  "AI": "bg-indigo-100 border-indigo-300 text-indigo-800",
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
  "道德与法治": "bg-rose-500 shadow-rose-200",
  "科学": "bg-teal-500 shadow-teal-200",
  "综合": "bg-orange-500 shadow-orange-200",
  "编程基础": "bg-slate-600 shadow-slate-300",
  "AI": "bg-indigo-600 shadow-indigo-300",
  "通用": "bg-gray-500 shadow-gray-200",
};

// Latex rendering handled by ReactMarkdown + rehype-katex

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
        <div className="flex-1 flex flex-col justify-center items-start text-left py-4 px-1 cursor-grab active:cursor-grabbing w-full">
          <div className="w-full prose prose-sm prose-slate max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug w-full" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-slate-800" {...props} />,
                p: ({ node, ...props }) => <p className="text-[15px] text-slate-600 leading-relaxed font-normal w-full whitespace-pre-line hyphens-auto mt-2" {...props} />
              }}
            >
              {card.content.replace(/概念概要名称：(.*?)(?:\n|$)/, '### $1\n')}
            </ReactMarkdown>
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
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [accountName, setAccountName] = useState("");

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

  // Edit/Delete User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phase: "", grade: "", province: "", textbook_versions: {} as Record<string, string>, subjects: [] as string[] });
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Progress Control Center State
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [progressForm, setProgressForm] = useState({
    semester: "下学期",
    month: "第1个月",
    learning_units: {} as Record<string, string[]>
  });
  const [progressSyllabusLoading, setProgressSyllabusLoading] = useState<Record<string, boolean>>({});
  const [progressSyllabusOptions, setProgressSyllabusOptions] = useState<Record<string, string[]>>({});

  const [snowEnabled, setSnowEnabled] = useState(false);

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
      const res = await fetch("/eduflow/api/explain-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
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
    let token = getToken();
    if (!token) {
      // In local development, inject a mock token so we don't get kicked out to sxu.com
      if (process.env.NODE_ENV === "development") {
        setDevToken("mock-uuid-development-001");
        token = "mock-uuid-development-001";
      } else {
        window.location.href = "/login";
        return;
      }
    }

    try {
      const res = await fetch("/eduflow/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.status === 401) {
        if (process.env.NODE_ENV !== "development") {
          removeToken();
          window.location.href = "/login";
          return;
        }
      }

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

  const fetchDailyCards = async (ignoreCache: boolean = false) => {
    if (!currentUser) return;
    setCardLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const url = `/eduflow/api/generate-cards?user_id=${currentUser.id}&current_date=${today}${ignoreCache ? '&ignore_cache=true' : ''}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
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
      const res = await fetch(`/eduflow/api/users/${currentUser.id}/goal`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
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
      const res = await fetch(`/eduflow/api/users/${currentUser.id}/goal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
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
      const res = await fetch(`/eduflow/api/regenerate-card?user_id=${currentUser.id}&subject=${subject}&current_date=${today}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` }
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
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) setAccountName(payload.sub);
      } catch (e) {
        console.error("Failed to parse token", e);
      }
    }
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      phase: user.phase,
      grade: user.grade,
      subjects: user.subjects,
      province: user.province || "通用",
      textbook_versions: user.textbook_versions || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleProgressSettings = () => {
    if (!currentUser) return;
    setProgressForm({
      semester: currentUser.semester || "下学期",
      month: currentUser.month || "第1个月",
      learning_units: currentUser.learning_units ? { ...currentUser.learning_units } : {}
    });
    // Optional: Auto fetch syllabus? We leave it manual for now
    setProgressSyllabusOptions({});
    setIsProgressDialogOpen(true);
  };

  const fetchSyllabusForProgress = async (subject: string) => {
    if (!currentUser || !currentUser.grade || !currentUser.phase) return;
    setProgressSyllabusLoading(prev => ({ ...prev, [subject]: true }));
    try {
      const token = getToken();
      // Fallback to general generic if not set
      const version = currentUser.textbook_versions?.[subject] || (SUBJECT_VERSIONS[subject] ? SUBJECT_VERSIONS[subject][0] : "通用版");
      const res = await fetch("/eduflow/api/syllabus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          phase: currentUser.phase,
          grade: currentUser.grade,
          semester: progressForm.semester,
          subject,
          version
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProgressSyllabusOptions(prev => ({ ...prev, [subject]: data }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProgressSyllabusLoading(prev => ({ ...prev, [subject]: false }));
    }
  };

  const toggleProgressUnit = (subject: string, unit: string) => {
    setProgressForm(prev => {
      const list = prev.learning_units[subject] || [];
      const newUnits = list.includes(unit) ? list.filter(u => u !== unit) : [...list, unit];
      return { ...prev, learning_units: { ...prev.learning_units, [subject]: newUnits } };
    });
  };

  const handleEditToggleSubject = (subject: string) => {
    if (editForm.subjects.includes(subject)) {
      setEditForm(prev => {
        const newVersions = { ...prev.textbook_versions };
        delete newVersions[subject];
        return { ...prev, subjects: prev.subjects.filter(s => s !== subject), textbook_versions: newVersions };
      });
    } else {
      setEditForm(prev => ({
        ...prev,
        subjects: [...prev.subjects, subject],
        textbook_versions: { ...prev.textbook_versions, [subject]: SUBJECT_VERSIONS[subject] ? SUBJECT_VERSIONS[subject][0] : "通用版" }
      }));
    }
  };

  const handleEditUpdateVersion = (subject: string, version: string) => {
    setEditForm(prev => ({
      ...prev,
      textbook_versions: { ...prev.textbook_versions, [subject]: version }
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editForm.name || !editForm.grade) return;

    try {
      const res = await fetch(`/eduflow/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          name: editForm.name,
          phase: editForm.phase,
          grade: editForm.grade,
          province: editForm.province,
          subjects: editForm.subjects,
          textbook_versions: editForm.textbook_versions
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
        setIsEditDialogOpen(false);
      }
    } catch (e) {
      console.error("Failed to update user", e);
    }
  };

  const handleSaveProgress = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/eduflow/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          semester: progressForm.semester,
          month: progressForm.month,
          learning_units: progressForm.learning_units
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        setIsProgressDialogOpen(false);
        // Refresh cards, ignoring cache so new units are used today.
        fetchDailyCards(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`确定要删除「${user.name}」吗？此操作将删除所有相关数据且不可恢复。`)) {
      return;
    }

    setIsDeletingUser(true);
    try {
      const res = await fetch(`/eduflow/api/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });

      if (res.ok) {
        const remainingUsers = users.filter(u => u.id !== user.id);
        setUsers(remainingUsers);

        // If deleted user was current user, switch to another user or show setup
        if (currentUser?.id === user.id) {
          if (remainingUsers.length > 0) {
            setCurrentUser(remainingUsers[0]);
          } else {
            setCurrentUser(null);
            setShowSetup(true);
          }
        }
      }
    } catch (e) {
      console.error("Failed to delete user", e);
    } finally {
      setIsDeletingUser(false);
    }
  };


  if (loading) {
    // Use the new Splash Screen component
    return <EduFlowLogo variant="splash" />;
  }

  if (showSetup) {
    return <UserSetupForm onComplete={() => { setShowSetup(false); fetchUsers(); }} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-800 font-sans antialiased relative">
      {snowEnabled && <SnowEffect />}
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 z-20 flex flex-col gap-6 shadow-sm flex-none">

        {/* Updated Sidebar Header with new Logo */}
        <div className="p-8 border-b flex justify-center">
          <EduFlowLogo variant="sidebar" />
        </div>

        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">家庭成员</p>
          {users.map(u => (
            <div
              key={u.id}
              className={cn(
                "w-full text-left px-4 py-3 transition-all flex justify-between items-center relative overflow-hidden group border-l-4 rounded-r-lg",
                currentUser?.id === u.id
                  ? "bg-cyan-100 border-cyan-600 text-cyan-950 shadow-sm"
                  : "border-transparent hover:bg-cyan-50/30 text-cyan-600 hover:text-cyan-700"
              )}
            >
              <button
                onClick={() => handleSwitchUser(u)}
                className="flex flex-col flex-1 text-left"
              >
                <span className={cn("text-lg relative z-10", currentUser?.id === u.id ? "font-bold" : "font-medium")}>{u.name}</span>
                <span className={cn("text-xs relative z-10", currentUser?.id === u.id ? "text-cyan-700" : "text-slate-400")}>
                  {u.grade} | {u.phase}
                </span>
              </button>

              {/* Edit and Delete Buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-cyan-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditUser(u);
                  }}
                  title="编辑"
                >
                  <Pencil size={14} className="text-cyan-700" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(u);
                  }}
                  title="删除"
                  disabled={isDeletingUser}
                >
                  <Trash2 size={14} className="text-red-600" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="ghost" className="w-full justify-start gap-2 mt-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium" onClick={() => setShowSetup(true)}>
            <div className="bg-slate-200 rounded-full p-0.5"><Plus size={14} /></div> 添加家庭成员
          </Button>

        </div>

        <div className="px-4 py-2 mt-auto space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 font-medium transition-all border border-dashed",
              snowEnabled ? "text-cyan-600 bg-cyan-50 border-cyan-200" : "text-slate-400 bg-slate-50 border-slate-200"
            )}
            onClick={() => setSnowEnabled(!snowEnabled)}
          >
            <div className={cn("rounded-full p-1", snowEnabled ? "bg-cyan-200 text-cyan-700" : "bg-slate-200 text-slate-400")}>
              <RefreshCcw size={12} className={cn(snowEnabled && "animate-[spin_10s_linear_infinite]")} />
            </div>
            Let it Snows {snowEnabled ? "❄️" : ""}
          </Button>

          {accountName && (
            <div className="mb-2 px-4 py-3 bg-slate-50 rounded-lg flex items-center gap-3 border border-slate-100 select-none">
              <div className="bg-cyan-100 p-2 rounded-full text-cyan-600">
                <UserCircle size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">当前账号</span>
                <span className="text-xs font-semibold text-slate-700 truncate block w-full" title={accountName}>{accountName}</span>
              </div>
            </div>
          )}
          <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => { removeToken(); setDevToken("mock"); window.location.reload(); }}>
            <LogOut size={16} /> 退出登录
          </Button>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-slate-400 text-center">
            {format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
          </p>
        </div>
      </aside >

      {/* Main Area: The "Desk" */}
      < main
        className="flex-1 overflow-hidden relative flex flex-col bg-[#f8fafc]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0L0 0L0 60' fill='none' stroke='%23e2e8f0' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px"
        }
        }
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

            {/* Right Column: Goal and Progress Section (Vertically Centered) */}
            <div className="flex items-center flex-none gap-3">
              <div
                onClick={handleProgressSettings}
                className="flex items-center gap-4 bg-white border border-slate-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] rounded-2xl px-5 py-3 hover:border-indigo-200 hover:shadow-indigo-50 transition-all cursor-pointer group select-none hidden sm:flex"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
                  <Settings size={20} className="stroke-[2.5px]" />
                </div>

                {/* Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">最近学习进度</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shadow-sm">可随时修改</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-extrabold text-indigo-600 tracking-tight leading-none">
                      {currentUser?.semester || "未设定"} / {currentUser?.month || "未设定"}
                    </span>
                  </div>
                </div>
              </div>
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
                      <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded-md">{userGoal.description}</span>
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
                  className="gap-2 text-cyan-700 border-dashed border-cyan-300 bg-cyan-50/50 rounded-xl h-12 px-6 hover:bg-cyan-100 hover:border-cyan-500 hover:text-cyan-800 transition-all shadow-sm"
                  onClick={() => setIsGoalDialogOpen(true)}
                >
                  <Target size={18} className="text-cyan-600" />
                  <span className="font-semibold">设定学习目标</span>
                </Button>
              )}
            </div>
          </div>


        </header>

        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-cyan-900 font-bold text-lg">设置阶段目标</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-cyan-700 font-medium">目标名称</Label>
                <Input
                  className="border-cyan-200 bg-cyan-50/30 text-cyan-900 focus-visible:ring-cyan-500 placeholder:text-cyan-300 font-medium"
                  placeholder="例如：期末考试"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-cyan-700 font-medium">目标日期</Label>
                <Input
                  type="date"
                  className="border-cyan-200 bg-cyan-50/30 text-cyan-900 focus-visible:ring-cyan-500 tracking-widest font-mono"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveGoal} className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md shadow-cyan-200">
                保存目标
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-cyan-900 font-bold text-xl">编辑家庭成员学习档案</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">姓名</Label>
                  <Input
                    className="border-cyan-200 bg-cyan-50/30 text-cyan-900 focus-visible:ring-cyan-500 shadow-sm"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">所在省份</Label>
                  {/* Select for province */}
                  <select
                    className="w-full h-10 px-3 py-2 rounded-md border border-cyan-200 bg-cyan-50/30 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm text-sm"
                    value={editForm.province}
                    onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                  >
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">学段</Label>
                  <select
                    className="w-full h-10 px-3 py-2 rounded-md border border-cyan-200 bg-cyan-50/30 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm text-sm"
                    value={editForm.phase}
                    onChange={(e) => setEditForm({ ...editForm, phase: e.target.value })}
                  >
                    {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">年级</Label>
                  <Input
                    className="border-cyan-200 bg-cyan-50/30 text-cyan-900 focus-visible:ring-cyan-500 shadow-sm"
                    value={editForm.grade}
                    placeholder="例如：初二 / 八年级"
                    onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 font-bold text-base">订阅科目及教材版本</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getAvailableSubjects(editForm.phase).map(s => (
                    <div key={s} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-colors">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`edit-${s}`}
                          checked={editForm.subjects.includes(s)}
                          onChange={() => handleEditToggleSubject(s)}
                          className="w-4 h-4 text-cyan-500 rounded border-slate-300 focus:ring-cyan-500"
                        />
                        <Label htmlFor={`edit-${s}`} className="cursor-pointer font-medium text-slate-700">{s}</Label>
                      </div>
                      {editForm.subjects.includes(s) && (
                        <select
                          value={editForm.textbook_versions[s] || (SUBJECT_VERSIONS[s] ? SUBJECT_VERSIONS[s][0] : "通用版")}
                          onChange={(e) => handleEditUpdateVersion(s, e.target.value)}
                          className="w-[180px] h-8 text-xs bg-white border border-slate-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          {(SUBJECT_VERSIONS[s] || ["通用版"]).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md shadow-cyan-200"
                disabled={!editForm.name || !editForm.grade || editForm.subjects.length === 0}
              >
                保存档案
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progress Setting Dialog */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#fafafa]">
            <DialogHeader>
              <DialogTitle className="text-indigo-900 font-bold text-xl flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-500" />
                阶段学习进度控制中心
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-6">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-indigo-800 font-bold text-sm">当前学期</Label>
                  <select
                    className="w-full h-10 px-3 py-2 rounded-lg border-transparent bg-white text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium shadow-sm"
                    value={progressForm.semester}
                    onChange={(e) => setProgressForm({ ...progressForm, semester: e.target.value })}
                  >
                    {SEMESTERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label className="text-indigo-800 font-bold text-sm">学习月度</Label>
                  <select
                    className="w-full h-10 px-3 py-2 rounded-lg border-transparent bg-white text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium shadow-sm"
                    value={progressForm.month}
                    onChange={(e) => setProgressForm({ ...progressForm, month: e.target.value })}
                  >
                    {MONTHS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex px-1 items-center justify-between">
                  <Label className="text-slate-800 font-bold text-base">本月度各科冲刺单元目录设定</Label>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-semibold">精准生成重点</span>
                </div>
                <div className="flex flex-col gap-3">
                  {currentUser?.subjects.map(s => (
                    <div key={s} className="p-4 rounded-xl border bg-white border-slate-200/60 shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-700">{s}</span>
                          <span className="text-xs text-slate-400">({currentUser.textbook_versions?.[s] || "通用版本"})</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                          onClick={() => fetchSyllabusForProgress(s)}
                          disabled={progressSyllabusLoading[s]}
                        >
                          {progressSyllabusLoading[s] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null} 拉取当前学年全部大纲
                        </Button>
                      </div>

                      {progressSyllabusOptions[s] && (
                        <div className="mt-3 max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                          {progressSyllabusOptions[s].map((unit, idx) => {
                            const isChecked = (progressForm.learning_units[s] || []).includes(unit);
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-start space-x-3 p-2 rounded-md transition-colors hover:bg-white cursor-pointer group",
                                  isChecked ? "bg-white border-indigo-100 shadow-[0_2px_8px_-4px_rgba(99,102,241,0.3)] border" : "border border-transparent"
                                )}
                                onClick={() => toggleProgressUnit(s, unit)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="mt-0.5 h-[1.125rem] w-[1.125rem] text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 pointer-events-none"
                                />
                                <Label className="text-sm text-slate-700 leading-snug cursor-pointer group-hover:text-slate-900 group-active:text-slate-900">{unit}</Label>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  {currentUser?.subjects?.length === 0 && (
                    <p className="text-sm text-slate-400 py-4 text-center">暂未订阅任何科目，请先编辑档案</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="text-slate-500" onClick={() => setIsProgressDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveProgress} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold ml-2 shadow-md shadow-indigo-200 border-none px-6">
                应用该进度设置
              </Button>
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
                <div className="text-slate-800 font-medium whitespace-pre-line">
                  {currentExplainingCard?.content || ""}
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
                  <div className="prose prose-slate prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: (props) => <p className="mb-3 text-[15px] leading-7 text-slate-700" {...props} />,
                        strong: (props) => <strong className="font-bold text-slate-900" {...props} />,
                        h1: (props) => <h3 className="mt-4 mb-2 text-base font-bold text-cyan-900" {...props} />,
                        h2: (props) => <h3 className="mt-4 mb-2 text-base font-bold text-cyan-900" {...props} />,
                        h3: (props) => <h3 className="mt-4 mb-2 text-base font-bold text-cyan-900" {...props} />,
                        ul: (props) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
                        ol: (props) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
                        li: (props) => <li className="text-[14px] leading-6" {...props} />,
                      }}
                    >
                      {explainContent}
                    </ReactMarkdown>
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
      </main >
    </div >
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUp, Lightbulb, Loader2,
  MessageCircle, MessageSquarePlus, RefreshCw, Send, ShieldCheck,
  Sparkles, Bug, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PostType = "idea" | "improvement" | "bug";
type PostStatus = "under_review" | "planned" | "in_progress" | "completed" | "declined";
type CommunityPost = {
  id: string;
  author_id: string;
  author_username: string;
  title: string;
  description: string;
  type: PostType;
  status: PostStatus;
  created_at: string;
};
type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string;
  body: string;
  is_official: boolean;
  created_at: string;
};

const supabase = createClient();
const STATUS: Record<PostStatus, { label: string; classes: string }> = {
  under_review: { label: "Under review", classes: "border-[#3b3b3b] bg-[#202020] text-[#bdbdbd]" },
  planned: { label: "Planned", classes: "border-blue-500/20 bg-blue-500/10 text-blue-300" },
  in_progress: { label: "In progress", classes: "border-orange-500/20 bg-orange-500/10 text-orange-300" },
  completed: { label: "Completed", classes: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
  declined: { label: "Not planned", classes: "border-red-500/20 bg-red-500/10 text-red-300" },
};
const TYPE_LABEL: Record<PostType, string> = { idea: "Feature request", improvement: "Improvement", bug: "Bug report" };
const COMMUNITY_ADMIN_EMAIL = "clr1mdh@gmail.com";
const COMMUNITY_ADMIN_LABEL = "Admin";

export default function CommunityPanel() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [votes, setVotes] = useState<Array<{ post_id: string; user_id: string }>>([]);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("Student");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | PostType>("all");
  const [sort, setSort] = useState<"votes" | "newest">("votes");
  const [composerOpen, setComposerOpen] = useState(false);
  const [postType, setPostType] = useState<PostType>("idea");
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentBusy, setCommentBusy] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Please sign in again to use Community.");
      setUserId(auth.user.id);
      const [{ data: profile }, { data: adminRow, error: adminError }, { data: postRows, error: postError }, { data: voteRows, error: voteError }] = await Promise.all([
        supabase.from("profiles").select("username").eq("id", auth.user.id).maybeSingle(),
        supabase.from("community_admins").select("user_id").eq("user_id", auth.user.id).maybeSingle(),
        supabase.from("community_posts").select("id,author_id,author_username,title,description,type,status,created_at").order("created_at", { ascending: false }),
        supabase.from("community_votes").select("post_id,user_id"),
      ]);
      if (adminError) throw adminError;
      if (postError) throw postError;
      if (voteError) throw voteError;
      const isDesignatedAdmin = (auth.user.email ?? "").trim().toLowerCase() === COMMUNITY_ADMIN_EMAIL;
      setIsAdmin(isDesignatedAdmin && Boolean(adminRow));
      setUsername(isDesignatedAdmin && adminRow
        ? COMMUNITY_ADMIN_LABEL
        : profile?.username || auth.user.user_metadata?.username || "Student");
      setPosts((postRows ?? []) as CommunityPost[]);
      setVotes(voteRows ?? []);
    } catch (err) {
      console.error("Community load failed:", err);
      setError(err instanceof Error ? err.message : "Could not load Community. Check the database setup.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadComments = async (postId: string) => {
    const { data, error: queryError } = await supabase.from("community_comments")
      .select("id,post_id,author_id,author_username,body,is_official,created_at")
      .eq("post_id", postId).order("created_at", { ascending: true });
    if (queryError) {
      setError("Could not load this discussion.");
      return;
    }
    setComments(current => ({ ...current, [postId]: (data ?? []) as CommunityComment[] }));
  };

  const toggleExpanded = async (postId: string) => {
    if (expanded === postId) { setExpanded(null); return; }
    setExpanded(postId);
    if (!comments[postId]) await loadComments(postId);
  };

  const submitPost = async () => {
    if (!postTitle.trim() || !postDescription.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("community_posts").insert({
      author_id: userId, author_username: username, title: postTitle.trim(),
      description: postDescription.trim(), type: postType,
    });
    setSubmitting(false);
    if (insertError) { setError(insertError.message); return; }
    setPostTitle(""); setPostDescription(""); setPostType("idea"); setComposerOpen(false);
    await load(true);
  };

  const toggleVote = async (postId: string) => {
    const existing = votes.some(vote => vote.post_id === postId && vote.user_id === userId);
    const previous = votes;
    setVotes(current => existing
      ? current.filter(vote => !(vote.post_id === postId && vote.user_id === userId))
      : [...current, { post_id: postId, user_id: userId }]);
    const result = existing
      ? await supabase.from("community_votes").delete().eq("post_id", postId).eq("user_id", userId)
      : await supabase.from("community_votes").insert({ post_id: postId, user_id: userId });
    if (result.error) { setVotes(previous); setError("Your vote could not be saved. Please try again."); }
  };

  const submitComment = async (postId: string) => {
    const body = (commentDrafts[postId] ?? "").trim();
    if (!body || commentBusy) return;
    setCommentBusy(postId);
    const { error: insertError } = await supabase.from("community_comments").insert({
      post_id: postId, author_id: userId, author_username: username, body, is_official: isAdmin,
    });
    setCommentBusy(null);
    if (insertError) { setError("Your reply could not be posted."); return; }
    setCommentDrafts(current => ({ ...current, [postId]: "" }));
    await loadComments(postId);
  };

  const updateStatus = async (postId: string, status: PostStatus) => {
    const { error: updateError } = await supabase.from("community_posts").update({ status }).eq("id", postId);
    if (updateError) { setError("Could not update the suggestion status."); return; }
    setPosts(current => current.map(post => post.id === postId ? { ...post, status } : post));
  };

  const visiblePosts = useMemo(() => {
    const filtered = filter === "all" ? [...posts] : posts.filter(post => post.type === filter);
    return filtered.sort((a, b) => sort === "newest"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : votes.filter(v => v.post_id === b.id).length - votes.filter(v => v.post_id === a.id).length);
  }, [posts, votes, filter, sort]);
  const voteCount = (postId: string) => votes.filter(vote => vote.post_id === postId).length;
  const stats = { total: posts.length, active: posts.filter(post => post.status === "under_review" || post.status === "planned" || post.status === "in_progress").length, shipped: posts.filter(post => post.status === "completed").length };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#FF9A5C]"><Sparkles size={15} /><span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Built together</span></div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Community</h1>
          <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#858585]">Have an idea, spotted a bug, or want something improved? Share it. Your feedback shapes Tapasya.</p>
        </div>
        <button onClick={() => setComposerOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#FF7628] px-4 text-[12px] font-semibold text-white transition hover:bg-[#ed6b22] sm:self-auto"><MessageSquarePlus size={15} /> Share an idea</button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        {[{ label: "Suggestions", value: stats.total }, { label: "In the pipeline", value: stats.active }, { label: "Implemented", value: stats.shipped }].map(item => (
          <div key={item.label} className="rounded-xl border border-[#252525] bg-[#101010] px-3 py-3 sm:px-4"><p className="text-xl font-semibold tabular-nums text-white">{item.value}</p><p className="mt-1 text-[10px] text-[#777]">{item.label}</p></div>
        ))}
      </div>

      {error && <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-[11px] text-red-300"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={14} /></button></div>}

      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-[#252525] pb-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {([{ id: "all", label: "All posts" }, { id: "idea", label: "Ideas" }, { id: "improvement", label: "Improvements" }, { id: "bug", label: "Bugs" }] as const).map(item => (
            <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-md px-3 py-1.5 text-[10px] transition ${filter === item.id ? "bg-[#292929] text-white" : "text-[#777] hover:bg-[#1b1b1b] hover:text-[#ddd]"}`}>{item.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select value={sort} onChange={event => setSort(event.target.value as "votes" | "newest")} className="rounded-md border border-[#292929] bg-[#111] px-2.5 py-1.5 text-[10px] text-[#aaa] outline-none"><option value="votes">Most votes</option><option value="newest">Newest</option></select>
          <button onClick={() => void load(true)} disabled={refreshing} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#292929] text-[#888] hover:bg-[#1b1b1b]" title="Refresh"><RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /></button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20 text-[#777]"><Loader2 size={20} className="animate-spin" /></div> : visiblePosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#303030] px-5 py-16 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#1b1b1b] text-[#FF9A5C]"><Lightbulb size={19} /></div><h3 className="text-[13px] font-medium text-white">The board is yours to shape</h3><p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[#777]">No suggestions here yet. Share the first idea that could make studying better.</p><button onClick={() => setComposerOpen(true)} className="mt-4 text-[11px] font-semibold text-[#FF9A5C] hover:text-[#ffb17f]">Post the first suggestion →</button></div>
      ) : <div className="space-y-2.5">
        {visiblePosts.map(post => {
          const count = voteCount(post.id);
          const voted = votes.some(vote => vote.post_id === post.id && vote.user_id === userId);
          const isOpen = expanded === post.id;
          const replies = comments[post.id] ?? [];
          const TypeIcon = post.type === "bug" ? Bug : post.type === "improvement" ? Sparkles : Lightbulb;
          return <article key={post.id} className="rounded-xl border border-[#252525] bg-[#0c0c0c] transition hover:border-[#383838]">
            <div className="flex gap-3 p-3.5 sm:gap-4 sm:p-4">
              <button onClick={() => void toggleVote(post.id)} aria-pressed={voted} title={voted ? "Remove your vote" : "Upvote this suggestion"} className={`flex h-[58px] w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border transition ${voted ? "border-[#FF7628]/40 bg-[#FF7628]/10 text-[#FF9A5C]" : "border-[#292929] bg-[#151515] text-[#888] hover:border-[#FF7628]/40 hover:text-[#FF9A5C]"}`}><ArrowUp size={15} /><span className="text-[11px] font-semibold tabular-nums">{count}</span></button>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5"><span className="inline-flex items-center gap-1 text-[9px] text-[#888]"><TypeIcon size={11} />{TYPE_LABEL[post.type]}</span><span className={`rounded-full border px-2 py-0.5 text-[9px] ${STATUS[post.status].classes}`}>{STATUS[post.status].label}</span></div>
                <h2 className="text-[13px] font-semibold leading-5 text-[#eee]">{post.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-[11px] leading-[1.65] text-[#999]">{post.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] text-[#666]">{post.author_username === COMMUNITY_ADMIN_LABEL || (post.author_id === userId && isAdmin) ? COMMUNITY_ADMIN_LABEL : `@${post.author_username}`} · {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><div className="flex items-center gap-3"><button onClick={() => void toggleExpanded(post.id)} className="inline-flex items-center gap-1 text-[10px] text-[#999] hover:text-white"><MessageCircle size={12} /> {isOpen ? "Hide discussion" : "Discuss"} <span className="text-[#666]">{isOpen ? "" : ""}</span></button>{isAdmin && <select value={post.status} onChange={event => void updateStatus(post.id, event.target.value as PostStatus)} aria-label="Update suggestion status" className="max-w-[125px] rounded border border-[#303030] bg-[#151515] px-2 py-1 text-[9px] text-[#bbb] outline-none">{Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}</select>}</div></div>
              </div>
            </div>
            {isOpen && <div className="border-t border-[#252525] bg-[#101010] px-3.5 py-3 sm:px-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold text-[#bbb]"><MessageCircle size={12} /> Discussion</div>
              {replies.length === 0 ? <p className="mb-3 text-[10px] text-[#666]">No replies yet. Start the conversation.</p> : <div className="mb-3 space-y-3">{replies.map(reply => <div key={reply.id} className="flex gap-2.5"><div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${reply.is_official ? "bg-[#FF7628]/15 text-[#FF9A5C]" : "bg-[#242424] text-[#999]"}`}>{reply.is_official ? <ShieldCheck size={12} /> : <span className="text-[9px] font-semibold">{reply.author_username.slice(0, 1).toUpperCase()}</span>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="text-[10px] font-medium text-[#ddd]">{reply.author_id === userId && isAdmin ? COMMUNITY_ADMIN_LABEL : reply.author_username === COMMUNITY_ADMIN_LABEL ? COMMUNITY_ADMIN_LABEL : `@${reply.author_username}`}</span>{reply.is_official && <span className="rounded bg-[#FF7628]/10 px-1.5 py-0.5 text-[8px] font-semibold text-[#FF9A5C]">TAPASYA TEAM</span>}<span className="text-[9px] text-[#666]">{new Date(reply.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div><p className="mt-1 whitespace-pre-wrap text-[10px] leading-5 text-[#999]">{reply.body}</p></div></div>)}</div>}
              <div className="flex items-end gap-2"><textarea value={commentDrafts[post.id] ?? ""} onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))} rows={2} maxLength={1500} placeholder={isAdmin ? "Reply as Tapasya team…" : "Add to the discussion…"} className="min-h-[42px] flex-1 resize-y rounded-lg border border-[#303030] bg-[#080808] px-3 py-2 text-[10px] text-white outline-none placeholder:text-[#5e5e5e] focus:border-[#FF7628]/60" /><button onClick={() => void submitComment(post.id)} disabled={!commentDrafts[post.id]?.trim() || commentBusy === post.id} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF7628] text-white hover:bg-[#ed6b22] disabled:opacity-40" aria-label="Post reply">{commentBusy === post.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}</button></div>
            </div>}
          </article>;
        })}
      </div>}

      {composerOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 py-6" onClick={() => setComposerOpen(false)}><div onClick={event => event.stopPropagation()} className="w-full max-w-[520px] rounded-2xl border border-[#333] bg-[#151515] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between"><div><h2 className="text-[16px] font-semibold text-white">Share with the community</h2><p className="mt-1 text-[10px] text-[#777]">Every great improvement starts with an idea.</p></div><button onClick={() => setComposerOpen(false)} className="rounded-md p-1 text-[#777] hover:bg-[#252525] hover:text-white"><X size={17} /></button></div>
        <label className="mb-2 block text-[10px] font-medium text-[#999]">POST TYPE</label><div className="mb-4 grid grid-cols-3 gap-2">{([{ id: "idea", label: "Feature idea", icon: Lightbulb }, { id: "improvement", label: "Improvement", icon: Sparkles }, { id: "bug", label: "Bug report", icon: Bug }] as const).map(item => <button key={item.id} onClick={() => setPostType(item.id)} className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-[9px] transition ${postType === item.id ? "border-[#FF7628]/50 bg-[#FF7628]/10 text-[#FF9A5C]" : "border-[#303030] bg-[#101010] text-[#888] hover:text-white"}`}><item.icon size={16} />{item.label}</button>)}</div>
        <label className="mb-1.5 block text-[10px] font-medium text-[#999]">TITLE</label><input value={postTitle} onChange={event => setPostTitle(event.target.value)} maxLength={100} placeholder="A short, clear title" className="mb-4 w-full rounded-lg border border-[#303030] bg-[#0b0b0b] px-3 py-2.5 text-[11px] text-white outline-none focus:border-[#FF7628]/60" />
        <label className="mb-1.5 block text-[10px] font-medium text-[#999]">DETAILS</label><textarea value={postDescription} onChange={event => setPostDescription(event.target.value)} rows={5} maxLength={3000} placeholder="What would you like to see? Why would it help? Add steps if you're reporting a bug…" className="mb-2 w-full resize-y rounded-lg border border-[#303030] bg-[#0b0b0b] px-3 py-2.5 text-[11px] leading-5 text-white outline-none focus:border-[#FF7628]/60" /><p className="mb-4 text-right text-[9px] text-[#666]">{postDescription.length}/3000</p>
        <button onClick={() => void submitPost()} disabled={!postTitle.trim() || !postDescription.trim() || submitting} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF7628] text-[11px] font-semibold text-white hover:bg-[#ed6b22] disabled:opacity-40">{submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish suggestion</button>
      </div></div>}
    </section>
  );
}

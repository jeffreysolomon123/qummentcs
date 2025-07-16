// edited component with CSS classes instead of tailwind
import React, { useEffect, useState } from "react";
import { getTimeAgo } from "@/lib/date.ts";
import "../App.css";

interface Comment {
    id: string;
    parent_id: string | null;
    author_name: string;
    content: string;
    likes: number;
    dislikes: number;
    created_at: string;
}

interface Props {
    projectSlug: string;
    threadSlug: string;
}

const CommentSection = ({ projectSlug, threadSlug }: Props) => {
    const [loading, setLoading] = useState(true);
    const [groupedComments, setGroupedComments] = useState<Record<string, Comment[]>>({});
    const [activeReplies, setActiveReplies] = useState<Record<string, boolean>>({});
    const [activeReplyBoxId, setActiveReplyBoxId] = useState<string | null>(null);
    const [newCommentName, setNewCommentName] = useState("");
    const [newCommentContent, setNewCommentContent] = useState("");
    const [replyName, setReplyName] = useState("");
    const [replyContent, setReplyContent] = useState("");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
    const [visibleCount, setVisibleCount] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOffensiveWarning, setShowOffensiveWarning] = useState(false);
    const [isMissingValues, setIsMissingValues] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [showReplyMissingValues, setShowReplyMissingValues] = useState(false);
    const [showReplyOffensiveWarning, setShowReplyOffensiveWarning] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const savedName = localStorage.getItem("username");
        if (savedName) {
            setNewCommentName(savedName);
            setReplyName(savedName);
        }
    }, []);

    const handleCommentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewCommentName(value);
        localStorage.setItem("username", value);
    };

    const handleReplyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setReplyName(value);
        localStorage.setItem("username", value);
    };

    useEffect(() => {
        const fetchComments = async () => {
            setLoading(true);
            const res = await fetch(
                `https://ewjrpafiovbvmluylhlf.supabase.co/functions/v1/get-comments?project_slug=${projectSlug}&thread_slug=${threadSlug}`
            );
            const result = await res.json();
            const grouped = result.comments.reduce((acc: Record<string, Comment[]>, comment: Comment) => {
                const parentId = comment.parent_id || "root";
                if (!acc[parentId]) acc[parentId] = [];
                acc[parentId].push(comment);
                return acc;
            }, {});
            setGroupedComments(grouped);
            setLoading(false);
        };

        fetchComments();
    }, [projectSlug, threadSlug]);

    const handleSubmitComment = async () => {
        if (!newCommentName.trim() || !newCommentContent.trim()) {
            setIsMissingValues(true);
            setIsSubmitting(false);
            return;
        }

        const username = localStorage.getItem("username");
        if (!username) {
            localStorage.setItem("username", newCommentName);
        }

        const tempComment = {
            id: Date.now().toString(),
            parent_id: null,
            author_name: newCommentName,
            content: newCommentContent,
            likes: 0,
            dislikes: 0,
            created_at: new Date().toISOString(),
        };

        try {
            const res = await fetch("https://ewjrpafiovbvmluylhlf.supabase.co/functions/v1/post-comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_slug: projectSlug,
                    thread_slug: threadSlug,
                    author_name: newCommentName,
                    content: newCommentContent,
                }),
            });

            const result = await res.json();
            if (!res.ok) {
                setShowOffensiveWarning(true);
                setIsSubmitting(false);
                return;
            }

            setGroupedComments((prev) => ({
                ...prev,
                root: [...(prev["root"] || []), tempComment],
            }));

            setNewCommentName("");
            setNewCommentContent("");
            setIsSubmitting(false);
            setSortOrder("latest");
            setIsMissingValues(false);
        } catch (error) {
            console.error(error);
            alert("Something went wrong while posting comment");
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyName.trim() || !replyContent.trim()) {
            setShowReplyMissingValues(true);
            setIsSubmittingReply(false);
            return;
        }

        const tempReply = {
            id: Date.now().toString(),
            parent_id: parentId,
            author_name: replyName,
            content: replyContent,
            likes: 0,
            dislikes: 0,
            created_at: new Date().toISOString(),
        };

        try {
            const res = await fetch("https://ewjrpafiovbvmluylhlf.supabase.co/functions/v1/post-comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_slug: projectSlug,
                    thread_slug: threadSlug,
                    parent_id: parentId,
                    author_name: replyName,
                    content: replyContent,
                }),
            });

            const result = await res.json();
            if (!res.ok) {
                setShowReplyOffensiveWarning(true);
                setIsSubmittingReply(false);
                return;
            }

            setGroupedComments((prev) => ({
                ...prev,
                [parentId]: [...(prev[parentId] || []), tempReply],
            }));

            setReplyName("");
            setReplyContent("");
            setActiveReplyBoxId(null);
            setShowReplyMissingValues(false);
            setIsSubmittingReply(false);
        } catch (error) {
            console.error(error);
            alert("Something went wrong while posting reply");
        }
    };

    const renderComments = (parentId = "root") => {
        const comments = groupedComments[parentId] || [];
        const sortedComments = [...comments].sort((a, b) => {
            return sortOrder === "latest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const visible = parentId === "root" ? sortedComments.slice(0, visibleCount) : sortedComments;

        return visible.map((comment) => (
            <div key={comment.id} className="comment-box">
                <div className="comment-header">
                    <div className="comment-user-info">
                        <h2 className="user-avatar">
                            {comment.author_name.charAt(0).toUpperCase()}
                        </h2>
                        <h1 className="comment-username">{comment.author_name}</h1>
                    </div>
                    <span className="comment-time">{getTimeAgo(comment.created_at)}</span>
                </div>
                <h2 className="comment-content">{comment.content}</h2>
                <div className="comment-actions">
                    <button className="reply-btn" onClick={() => setActiveReplyBoxId(comment.id)}>Reply</button>
                    {groupedComments[comment.id]?.length > 0 && (
                        <button
                            className="toggle-replies-btn"
                            onClick={() =>
                                setActiveReplies((prev) => ({
                                    ...prev,
                                    [comment.id]: !prev[comment.id],
                                }))
                            }
                        >
                            {activeReplies[comment.id] ? "Hide Replies" : "Show Replies"}
                        </button>
                    )}
                </div>
                {activeReplyBoxId === comment.id && (
                    <div className="comment-box-bg reply-box">
                        <textarea
                            className="comment-input-box mona-sans-medium"
                            placeholder="Enter your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <hr className="horizontal-line-comment-input-box" />
                        <div className="lower-comment-input-box-container">
                            <input
                                className="name-field-comment-input-box"
                                placeholder="Enter your name..."
                                value={replyName}
                                onChange={handleReplyNameChange}
                            />
                            <div style={{"display":"flex","marginLeft":"0.875rem"}}>
                                <button style={{"color":"#4B5563","cursor":"pointer"}} onClick={() => {
                                    setActiveReplyBoxId(null);
                                    setShowOffensiveWarning(false);
                                    setShowReplyMissingValues(false);
                                    setShowReplyOffensiveWarning(false);
                                    setReplyContent("");
                                    setReplyName("");
                                }}>
                                    Cancel
                                </button>
                                <button className="submit-btn" onClick={() => {
                                    setIsSubmittingReply(true);
                                    handleSubmitReply(comment.id);
                                }}>
                                    {isSubmittingReply ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                        {showReplyOffensiveWarning && <h2 className="warning mona-sans-semibold">Warning: Comment contains offensive or inappropriate content.</h2>}
                        {showReplyMissingValues && <h2 className="warning mona-sans-semibold">Please Enter both fields: Comment and Name</h2>}
                    </div>
                )}
                {activeReplies[comment.id] && renderComments(comment.id)}
            </div>
        ));
    };

    return (
        <div className="comment-section-container">
            <div className="comment-input-container">
                <textarea
                    className="comment-input-box mona-sans-medium"
                    placeholder="Add a comment..."
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                />
                <hr className="horizontal-line-comment-input-box" />
                <div className="lower-comment-input-box-container">
                    <input
                        className="name-field-comment-input-box"
                        placeholder="Enter your name..."
                        value={newCommentName}
                        onChange={handleCommentNameChange}
                    />
                    <button className="submit-btn" onClick={() => {
                        setIsSubmitting(true);
                        handleSubmitComment();
                    }}>
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                </div>
                {showOffensiveWarning && <h2 className="warning">Warning: Comment contains offensive or inappropriate content.</h2>}
                {isMissingValues && <h2 className="warning">Please Enter both fields: Comment and Name</h2>}
            </div>
            <hr className="horizontal-line-between" />
            <div className="comment-header-bar">
                <div className="comment-count">
                    <h2 className="comments-main-title mona-sans-bold">Comments</h2>
                    <h2 className="comment-badge mona-sans-medium">
                        {Object.values(groupedComments).reduce((total, commentsArray) => total + commentsArray.length, 0)}
                    </h2>
                </div>
                <div className="sort-select-container">
                    <select
                        className="sort-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                    >
                        <option value="oldest">Oldest</option>
                        <option value="latest">Most Recent</option>
                    </select>
                    <div className="sort-select-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </div>
            {loading ? (
                <div className="loading-skeleton-container">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="loading-sub-skeleton">
                            <div className="loading-1-container">
                                <div style={{"borderRadius":"9999px","width":"2rem","height":"2rem","background":"#e5e5e5"}}></div>
                                <div style={{"borderRadius":"0.25rem","width":"25%","height":"1rem","background":"#e5e5e5"}}></div>
                            </div>
                            <div style={{"marginTop":"0.5rem","borderRadius":"0.25rem","width":"75%","height":"0.75rem","background":"#e5e5e5"}}></div>
                            <div style={{"borderRadius":"0.25rem","width":"66.666667%","height":"0.75rem","background":"#e5e5e5"}}></div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {renderComments()}
                    {groupedComments["root"] && visibleCount < groupedComments["root"].length && (
                        <button className="load-more mona-sans-medium" onClick={() => setVisibleCount((prev) => prev + 5)}>
                            Load More...
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default CommentSection;

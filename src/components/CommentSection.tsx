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
    const[isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [showReplyMissingValues, setShowReplyMissingValues] = useState(false);
    const [showReplyOffensiveWarning, setShowReplyOffensiveWarning] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
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
        };

        fetchComments();
    }, [projectSlug, threadSlug]);

    const handleSubmitComment = async () => {
        if (!newCommentName.trim() || !newCommentContent.trim())
        {
            setIsMissingValues(true);
            setIsSubmitting(false)
            return;
        };

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
                setIsSubmitting(false)
                return;
            }

            setGroupedComments((prev) => ({
                ...prev,
                root: [...(prev["root"] || []), tempComment],
            }));

            setNewCommentName("");
            setNewCommentContent("");
            setIsSubmitting(false);
            setSortOrder("latest")
            setIsMissingValues(false)
        } catch (error) {
            console.error(error);
            alert("Something went wrong while posting comment");
            setIsSubmitting(false)
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyName.trim() || !replyContent.trim()) {
            setShowReplyMissingValues(true);
            setIsSubmittingReply(false);
            return;
        };

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
                setShowReplyOffensiveWarning(true)
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
            setShowReplyMissingValues(false)
            setIsSubmittingReply(false)
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
            <div key={comment.id} className="border-1 rounded-lg border-[#DDDDDD] p-3 mt-3 mona-sans-regular">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-1">
                        <h2 className="w-8 h-8 flex items-center justify-center bg-[#6C0E82] rounded-3xl mona-sans-medium text-md text-white">
                            {comment.author_name.charAt(0).toUpperCase()}
                        </h2>
                        <h1 className="ml-2 mona-sans-medium text-md">{comment.author_name}</h1>
                    </div>
                    <span className="mona-sans-regular text-md scale-75 text-[#414141]">{getTimeAgo(comment.created_at)}</span>
                </div>
                <h2 className="mona-sans-regular text-sm mt-2">{comment.content}</h2>
                <div className="flex space-x-4 mt-2 text-sm">
                    <button className="cursor-pointer mona-sans-semibold text-[#414141]" onClick={() => setActiveReplyBoxId(comment.id)}>Reply</button>
                    {groupedComments[comment.id]?.length > 0 && (
                        <button
                            className="cursor-pointer mona-sans-semibold text-[#6C0E82]"
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
                    <div className="comment-box-bg pl-5 pr-3 pt-3 pb-3 border-1 border-[#A0A0A0] rounded-lg mt-2 space-y-2">
                        <textarea
                            className="w-full mt-3 min-h-10 mona-sans-medium text-[#676767] text-md focus:outline-none focus:ring-0 focus:border-transparent"
                            placeholder="Enter your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <hr className="border-1 border-[#DDDDDD]" />
                        <div className="flex justify-center">
                            <input
                                className="w-full mona-sans-medium text-[#676767] text-sm focus:outline-none focus:ring-0 focus:border-transparent"
                                placeholder="Enter you name..."
                                value={replyName}
                                onChange={(e) => setReplyName(e.target.value)}
                            />

                            <div className="flex space-x-3">

                                <button className="cursor-pointer text-gray-600" onClick={() => {
                                    setActiveReplyBoxId(null)
                                    setShowOffensiveWarning(false)
                                    setShowReplyMissingValues(false);
                                    showReplyOffensiveWarning? setShowReplyOffensiveWarning(false) : setShowReplyOffensiveWarning(true);
                                    setReplyContent("")
                                    setReplyName("")
                                }}>
                                    Cancel
                                </button>
                                <button className="cursor-pointer bg-[#6C0E82] rounded-lg text-white w-30 h-8" onClick={() => {
                                    setIsSubmittingReply(true);
                                    handleSubmitReply(comment.id);
                                }}>
                                    {isSubmittingReply? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                        {showReplyOffensiveWarning? <h2 className="text-red-500 mona-sans-semibold text-sm mt-2">Warning: Comment contains offensive or inappropriate content.</h2> : null}
                        {showReplyMissingValues? <h2 className="text-red-500 mona-sans-semibold text-sm mt-2">Please Enter both fields: Comment and Name</h2>: null}
                    </div>
                )}
                {activeReplies[comment.id] && renderComments(comment.id)}
            </div>
        ));
    };

    return (
        <div className="p-4 flex flex-col justify-center">
            {/* Comment Input Section */}
            <div className="comment-box-bg pl-5 pr-3 pt-3 pb-3 border-1 border-[#A0A0A0] rounded-lg">
        <textarea
            className="w-full mt-3 min-h-10 mona-sans-medium text-[#676767] text-md focus:outline-none focus:ring-0 focus:border-transparent"
            placeholder="Add a comment..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
        />
                <hr className="border-1 border-[#DDDDDD]" />
                <div className="flex flex-row justify-between mt-3">
                    <input
                        className="w-full mona-sans-medium text-[#676767] text-sm focus:outline-none focus:ring-0 focus:border-transparent"
                        placeholder="Enter your name..."
                        value={newCommentName}
                        onChange={(e) => setNewCommentName(e.target.value)}
                    />
                    <button className="cursor-pointer bg-[#6C0E82] rounded-lg text-white px-4 py-1" onClick={()=>{
                        setIsSubmitting(true);
                        handleSubmitComment()
                    }}>
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>

                </div>
                {showOffensiveWarning? <h2 className="text-red-500 mona-sans-semibold text-sm mt-2">Warning: Comment contains offensive or inappropriate content.</h2> : null}
                {isMissingValues? <h2 className="text-red-500 mona-sans-semibold text-sm mt-2">Please Enter both fields: Comment and Name</h2>: null}
            </div>

            <hr className="my-5 border-1 border-[#DDDDDD]" />

            {/* Header and Sort */}
            <div className="flex space-x-2 justify-between">
                <div className="flex space-x-1">
                    <h2 className="text-[#414141] text-xl mona-sans-bold">Comments</h2>
                    <h2 className="bg-[#6C0E82] scale-90 text-lg mona-sans-medium rounded-lg text-white px-3">
                        {Object.values(groupedComments).reduce((total, commentsArray) => total + commentsArray.length, 0)}
                    </h2>
                </div>
                <div className="relative inline-block w-fit">
                    <select
                        className="appearance-none cursor-pointer text-[#414141] bg-[#F3F3F3] px-4 py-1 pr-10 text-sm mona-sans-medium border border-[#DDDDDD] rounded-lg"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                    >
                        <option value="oldest">Oldest</option>
                        <option value="latest">Most Recent</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#414141]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Render Comments */}
            {renderComments()}

            {/* Load More Button */}
            {groupedComments["root"] && visibleCount < groupedComments["root"].length && (
                <button
                    className="cursor-pointer mt-4 self-center px-4 py-2 text-sm rounded-md bg-[#6C0E82] text-white mona-sans-medium"
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                >
                    Load More...
                </button>
            )}
        </div>
    );
};

export default CommentSection;

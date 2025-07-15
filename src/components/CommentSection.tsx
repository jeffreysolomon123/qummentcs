import React, { useEffect, useState } from "react";
import {getTimeAgo} from "@/lib/date.ts";

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
        if (!newCommentName.trim() || !newCommentContent.trim()) return;

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
                alert(result.error || "Failed to post comment");
                return;
            }

            // ✅ Only update UI on success
            setGroupedComments(prev => ({
                ...prev,
                root: [...(prev["root"] || []), tempComment],
            }));

            setNewCommentName("");
            setNewCommentContent("");

        } catch (error) {
            console.error(error);
            alert("Something went wrong while posting comment");
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyName.trim() || !replyContent.trim()) return;

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
                alert(result.error || "Failed to post reply");
                return;
            }

            // ✅ Only update UI if successful
            setGroupedComments(prev => ({
                ...prev,
                [parentId]: [...(prev[parentId] || []), tempReply],
            }));

            setReplyName("");
            setReplyContent("");
            setActiveReplyBoxId(null);

        } catch (error) {
            console.error(error);
            alert("Something went wrong while posting reply");
        }
    };

    const renderComments = (parentId = "root") => {
        const comments = groupedComments[parentId] || [];

        const sortedComments = [...comments].sort((a, b) => {
            if (sortOrder === "latest") {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            } else {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
        });

        return sortedComments.map(comment => (
            <div key={comment.id} className="border p-3 my-2 ml-2">
                <strong>{comment.author_name}</strong>: {comment.content}
                <span className="text-xs text-gray-500 ml-2">
                {getTimeAgo(comment.created_at)}
            </span>
                <div className="flex space-x-4 mt-2 text-sm">
                    <button onClick={() => setActiveReplyBoxId(comment.id)}>💬 Reply</button>
                    {groupedComments[comment.id]?.length > 0 && (
                        <button
                            onClick={() =>
                                setActiveReplies(prev => ({
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
                    <div className="mt-2 space-y-2">
                        <input
                            className="border w-full p-1"
                            placeholder="Your name"
                            value={replyName}
                            onChange={(e) => setReplyName(e.target.value)}
                        />
                        <textarea
                            className="border w-full p-1"
                            placeholder="Your reply"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <div className="flex space-x-2">
                            <button
                                className="bg-black text-white px-2 py-1"
                                onClick={() => handleSubmitReply(comment.id)}
                            >
                                Submit Reply
                            </button>
                            <button
                                className="text-gray-500"
                                onClick={() => setActiveReplyBoxId(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {activeReplies[comment.id] && renderComments(comment.id)}
            </div>
        ));
    };




    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-2">Add a Comment</h2>
            <input
                className="border p-2 mb-2 w-full"
                placeholder="Your name"
                value={newCommentName}
                onChange={(e) => setNewCommentName(e.target.value)}
            />
            <textarea
                className="border p-2 mb-2 w-full"
                placeholder="Your comment"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
            />
            <button className="bg-black text-white px-4 py-1" onClick={handleSubmitComment}>
                Submit
            </button>

            <hr className="my-6" />

            <h2 className="text-lg font-semibold">Comments</h2>
            <h1>
                {Object.values(groupedComments).reduce((total, commentsArray) => total + commentsArray.length, 0)}
            </h1>

            <div className="flex justify-end mb-4">
                <label className="mr-2 text-sm font-medium text-gray-600">Sort by:</label>
                <select
                    className="border px-2 py-1 text-sm"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                >
                    <option value="oldest">Oldest</option>
                    <option value="latest">Latest</option>
                </select>
            </div>

            {renderComments()}
        </div>
    );
};

export default CommentSection;
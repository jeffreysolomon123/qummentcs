import React, { useState } from "react";

interface Comment {
    id: string;
    parent_id: string | null;
    author_name: string;
    content: string;
    created_at: string;
}

interface CommentItemProps {
    comment: Comment;
    children?: React.ReactNode;
    onReplyClick: (commentId: string) => void;
    replyBoxOpen: string | null;
    handleReplySubmit: (parentId: string, name: string, content: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
                                                     comment,
                                                     children,
                                                     onReplyClick,
                                                     replyBoxOpen,
                                                     handleReplySubmit,
                                                 }) => {
    const [name, setName] = useState("");
    const [replyContent, setReplyContent] = useState("");

    return (
        <div className="border p-2 my-2">
            <p><strong>{comment.author_name}</strong>: {comment.content}</p>
            <div className="flex space-x-3 mt-2">
                <button onClick={() => onReplyClick(comment.id)}>💬 Reply</button>
            </div>

            {replyBoxOpen === comment.id && (
                <div className="mt-2 space-y-2">
                    <input
                        className="border p-1 w-full"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        className="border p-1 w-full"
                        placeholder={`Reply to ${comment.author_name}`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            handleReplySubmit(comment.id, name, replyContent);
                            setName("");
                            setReplyContent("");
                        }}
                        className="bg-black text-white px-3 py-1"
                    >
                        Send
                    </button>
                </div>
            )}

            <div className="ml-4">{children}</div>
        </div>
    );
};

export default CommentItem;

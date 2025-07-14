import React, { useState } from "react";

interface CommentFormProps {
    onSubmit: (name: string, content: string) => void;
    onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, onCancel }) => {
    const [name, setName] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = () => {
        if (name.trim() && content.trim()) {
            onSubmit(name, content);
            setName("");
            setContent("");
        }
    };

    return (
        <div className="mb-4">
            <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-1 mr-2"
            />
            <input
                placeholder="Write a comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border p-1 mr-2"
            />
            <button onClick={handleSubmit} className="bg-black text-white px-2">Submit</button>
            {onCancel && (
                <button onClick={onCancel} className="ml-2 text-sm text-gray-600">Cancel</button>
            )}
        </div>
    );
};

export default CommentForm;

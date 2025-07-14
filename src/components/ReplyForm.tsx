import React, { useState } from "react";

interface ReplyFormProps {
    onSubmit: (name: string, content: string) => void;
    onCancel: () => void;
}

const ReplyForm = ({ onSubmit, onCancel }: ReplyFormProps) => {
    const [name, setName] = useState("");
    const [content, setContent] = useState("");

    return (
        <div className="mt-2">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="border px-2 py-1 w-full mb-1"
            />
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reply..."
                className="border px-2 py-1 w-full mb-1"
            />
            <div className="space-x-2">
                <button onClick={() => onSubmit(name, content)} className="text-blue-600 text-sm">Submit</button>
                <button onClick={onCancel} className="text-gray-500 text-sm">Cancel</button>
            </div>
        </div>
    );
};

export default ReplyForm;

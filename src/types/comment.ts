export interface Comment {
    id: string;
    parent_id: string | null;
    author_name: string;
    content: string;
    likes: number;
    dislikes: number;
    created_at: string;
}

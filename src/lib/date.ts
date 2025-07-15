export const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minute(s) ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour(s) ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} day(s) ago`;
    if (diff < 31104000) return `${Math.floor(diff / 2592000)} month(s) ago`;
    return `${Math.floor(diff / 31104000)} year(s) ago`;
};

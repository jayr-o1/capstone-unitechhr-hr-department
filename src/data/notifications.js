const notifications = [
    {
        id: 1,
        profile: "user1.jpg",
        message: "You have a new message",
        time: "2 mins ago",
        read: false,
    },
    {
        id: 2,
        profile: "user2.jpg",
        message: "The quick brown fox jumps over the lazy dog",
        time: "10 mins ago",
        read: false,
    },
];

const fetchNotifications = async () => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(notifications), 1000);
    });
};

export default fetchNotifications;

import React from "react";
import NotificationItem from "./NotificationItem";
import NotificationAlertIcon from "../../../assets/icons/HeaderIcons/NotificationAlertIcon";

const NotificationList = ({ notifications, markAsRead, setNotifications }) => {
    return (
        <>
            {notifications.length > 0 ? (
                notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        markAsRead={markAsRead}
                        onDelete={(id) =>
                            setNotifications(
                                notifications.filter((n) => n.id !== id)
                            )
                        }
                    />
                ))
            ) : (
                <div className="!grid min-h-[200px] place-content-center text-lg hover:!bg-transparent">
                    <div className="mx-auto mb-4 rounded-full text-[#76B5FE] ring-4 ring-[#76B5FE]/30">
                        <NotificationAlertIcon />
                    </div>
                    No notification available.
                </div>
            )}
        </>
    );
};

export default NotificationList;

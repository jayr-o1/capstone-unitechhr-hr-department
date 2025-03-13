import Swal from "sweetalert2";

const showWarningAlert = (message, callback) => {
    Swal.fire({
        title: "Warning",
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#9AADEA",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, reset fields!",
        cancelButtonText: "Cancel",
        background: "#ffffff", // Custom background color
        color: "#000000", // Black text for contrast
    }).then((result) => {
        if (result.isConfirmed) {
            // Execute the callback if the user confirms
            callback();
        }
    });
};

export default showWarningAlert;
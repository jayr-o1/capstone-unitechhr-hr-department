import Swal from "sweetalert2";

const showWarningAlert = (message, onConfirm) => {
    Swal.fire({
        icon: "warning",
        title: message,
        background: "#ffffff",
        color: "#000000",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, proceed!",
        cancelButtonText: "Cancel",
    }).then((result) => {
        if (result.isConfirmed && onConfirm) {
            onConfirm(); // Call the function if user confirms
        }
    });
};

export default showWarningAlert;

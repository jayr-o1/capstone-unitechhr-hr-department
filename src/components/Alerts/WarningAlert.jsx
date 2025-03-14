import Swal from "sweetalert2";
import showSuccessAlert from "./SuccessAlert";

const showWarningAlert = (
    message,
    onConfirm,
    confirmText = "Yes",
    cancelText = "Cancel",
    successMessage = null
) => {
    Swal.fire({
        title: "Warning",
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#9AADEA",
        cancelButtonColor: "#d33",
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        background: "#ffffff",
        color: "#000000",
    }).then((result) => {
        if (result.isConfirmed) {
            onConfirm();

            if (successMessage) {
                showSuccessAlert(successMessage); // Use your custom SuccessAlert
            }
        }
    });
};

export default showWarningAlert;

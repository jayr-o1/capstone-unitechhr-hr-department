import Swal from "sweetalert2";
import showSuccessAlert from "./SuccessAlert"; // Import your custom success alert

const showDeleteConfirmation = (
    expectedInput,
    onConfirm,
    errorMessage = "Input does not match!",
    successMessage = null // New parameter for dynamic success messages
) => {
    Swal.fire({
        title: "Confirm Deletion",
        html: `
            <p style="padding-bottom: 10px;">To confirm, type "<strong>${expectedInput}</strong>" below:</p>
            <input id="confirmInput" class="swal2-input" placeholder="Enter here" 
                style="margin: auto; width: 100%; height: 50px; font-size: 16px;">
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#9AADEA",
        background: "#ffffff",
        color: "#000000",
        allowOutsideClick: false, // Prevent closing by clicking outside
        preConfirm: () => {
            const inputValue =
                Swal.getPopup().querySelector("#confirmInput").value;

            if (inputValue !== expectedInput) {
                Swal.showValidationMessage(errorMessage); // Dynamically show the error message
                return false; // Prevents modal from closing
            }
            return true; // Allows deletion to proceed
        },
    }).then((result) => {
        if (result.isConfirmed) {
            onConfirm(); // Call the confirmation function

            if (successMessage) {
                showSuccessAlert(successMessage); // Use custom success alert
            }
        }
    });
};

export default showDeleteConfirmation;

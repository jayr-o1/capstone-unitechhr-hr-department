import Swal from "sweetalert2";

const showSuccessAlert = (message) => {
    const toast = Swal.mixin({
        toast: true,
        position: "center",
        showConfirmButton: false,
        timer: 2000,
        padding: "2em",
    });

    toast.fire({
        icon: "success",
        title: message, // Now it will properly display the message
        background: "#9AADEA", // Custom background color
        color: "#ffffff", // White text for contrast
    });
};

export default showSuccessAlert;

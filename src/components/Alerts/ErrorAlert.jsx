import Swal from "sweetalert2";

const showErrorAlert = (message) => {
    const toast = Swal.mixin({
        toast: true,
        position: "center",
        showConfirmButton: false,
        timer: 2000,
        padding: "2em",
    });

    toast.fire({
        icon: "error",
        title: message,
        background: "#9AADEA", // Light red background
        color: "#ffffff", // White text for contrast
    });
};

export default showErrorAlert;

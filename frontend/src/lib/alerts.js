import Swal from "sweetalert2";

const sharedOptions = {
  confirmButtonColor: "#10b981",
  cancelButtonColor: "#ef4444",
  reverseButtons: true,
};

export async function confirmAction({
  title,
  text,
  confirmText,
  cancelText,
  icon = "warning",
}) {
  const result = await Swal.fire({
    ...sharedOptions,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
}

export async function showError(message, title = "Error") {
  await Swal.fire({
    ...sharedOptions,
    icon: "error",
    title,
    text: message,
    showCancelButton: false,
    confirmButtonText: "OK",
  });
}

export async function showSuccess(message, title = "Success") {
  await Swal.fire({
    ...sharedOptions,
    icon: "success",
    title,
    text: message,
    showCancelButton: false,
    confirmButtonText: "OK",
  });
}

export async function showInfo(message, title = "Info") {
  await Swal.fire({
    ...sharedOptions,
    icon: "info",
    title,
    text: message,
    showCancelButton: false,
    confirmButtonText: "OK",
  });
}

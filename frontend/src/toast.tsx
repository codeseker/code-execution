import toast, { Toaster } from "react-hot-toast";


export const successToast = (message = "Successfully created!") =>
  toast.success(message);

export const errorToast = (message = "Something went wrong. Please try again.") =>
  toast.error(message);

export default function Toast() {
  return <Toaster
    position="top-right"
    gutter={10}
    containerStyle={{ top: 20, right: 20 }}
    toastOptions={{
      duration: 3500,
      style: {
        background: "#ffffff",
        color: "#1f2937",
        padding: "12px 16px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 500,
        maxWidth: "380px",
        boxShadow:
          "0 10px 25px -5px rgba(0,0,0,0.12), 0 4px 10px -6px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      },

      // ✅ Success
      success: {
        duration: 3000,
        style: { borderLeft: "4px solid #16a34a" },
        iconTheme: { primary: "#16a34a", secondary: "#ffffff" },
      },

      // ❌ Error
      error: {
        duration: 5000,
        style: { borderLeft: "4px solid #dc2626" },
        iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
      },
    }}
  />
}
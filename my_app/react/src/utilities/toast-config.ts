import type { DefaultToastOptions } from "react-hot-toast";

export const defaultToastOptions: DefaultToastOptions = {
  duration: 2000,
  style: {
    background:
      "radial-gradient(circle, #f91e43 0%, #e01f3f 40%, #a31e34 100%)",
    color: "#fef3c7",
    borderRadius: "10px",
    border: "1px solid #ca8a04",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    padding: "0.5rem",
    fontStyle: "italic",
    minWidth: "250px",
  },
};

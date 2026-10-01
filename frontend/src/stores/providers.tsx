import { type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "../theme";
import Toast from "../toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProvidersProps {
    children: ReactNode;
}

const queryClient = new QueryClient();

export default function Providers({ children }: ProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <Toast />
                <BrowserRouter>
                    {children}
                </BrowserRouter>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
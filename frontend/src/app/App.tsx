import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/layouts/AppLayout";
import {
  ArchivePage,
  BookmarksPage,
  FavoritesPage,
  FolderPage,
  RecentPage,
} from "@/pages/BookmarksPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SettingsPage } from "@/pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } },
});

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <BookmarksPage /> },
      { path: "favorites", element: <FavoritesPage /> },
      { path: "recent", element: <RecentPage /> },
      { path: "archive", element: <ArchivePage /> },
      { path: "folder/:id", element: <FolderPage /> },
    ],
  },
  {
    path: "/settings",
    element: <AppLayout />,
    children: [{ index: true, element: <SettingsPage /> }],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="bottom-right" />
    </QueryClientProvider>
  );
}

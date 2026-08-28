import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider, ThemeSync } from "@/components/ThemeProvider";
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
import { SavePage } from "@/pages/SavePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TagsPage } from "@/pages/TagsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: false } },
});

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/save", element: <SavePage /> },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <BookmarksPage /> },
      { path: "favorites", element: <FavoritesPage /> },
      { path: "recent", element: <RecentPage /> },
      { path: "archive", element: <ArchivePage /> },
      { path: "folder/:id", element: <FolderPage /> },
      { path: "tags", element: <TagsPage /> },
    ],
  },
  {
    path: "/settings",
    element: <AppLayout />,
    children: [
      { index: true, element: <SettingsPage /> },
      { path: ":section", element: <SettingsPage /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemeSync />
        <RouterProvider router={router} />
        <Toaster richColors position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

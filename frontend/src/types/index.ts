export type User = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  last_login_at: string | null;
};

export type Tag = {
  id: string;
  name: string;
  created_at: string;
};

export type Folder = {
  id: string;
  parent_id: string | null;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  folder_id: string | null;
  url: string;
  normalized_url: string;
  title: string;
  description: string | null;
  notes: string | null;
  favicon_url: string | null;
  page_domain: string | null;
  metadata_status: string;
  is_favorite: boolean;
  is_archived: boolean;
  visit_count: number;
  last_visited_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  folder: Folder | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type BookmarkFilters = {
  folder_id?: string;
  tag?: string;
  favorite?: boolean;
  archived?: boolean;
  search?: string;
  sort?: "created_at" | "title" | "url" | "visit_count" | "last_visited_at";
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
  recent?: "added" | "visited";
};

export type ImportReport = {
  bookmarks_imported: number;
  folders_created: number;
  duplicates_detected: number;
  invalid_entries_skipped: number;
};

export type BookmarkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  page_domain: string | null;
  metadata_status: string;
};

export type ApiError = {
  status: number;
  message: string;
  duplicate?: Bookmark;
};

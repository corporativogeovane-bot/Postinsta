export interface Feed {
  id: number;
  name: string;
  url: string;
  active: 0 | 1;
  created_at: string;
}

export type PostStatus = "processing" | "ready" | "error";

export interface Post {
  id: number;
  feed_id: number;
  feed_name: string;
  guid: string;
  title: string;
  link: string;
  source_image_url: string | null;
  image_path: string | null;
  caption: string | null;
  hashtags: string | null;
  status: PostStatus;
  error_message: string | null;
  dropbox_path: string | null;
  dropbox_link: string | null;
  created_at: string;
}

export interface Settings {
  image_format: "square" | "portrait";
  ai_enabled: boolean;
  dropbox_auto_save: boolean;
  dropbox_folder_path: string;
  dropbox_configured: boolean;
}

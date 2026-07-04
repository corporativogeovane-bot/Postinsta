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
  drive_file_id: string | null;
  drive_file_link: string | null;
  created_at: string;
}

export interface Settings {
  image_format: "square" | "portrait";
  ai_enabled: boolean;
  drive_auto_save: boolean;
  drive_folder_id: string;
  drive_credentials_present: boolean;
}

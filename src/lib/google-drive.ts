/**
 * Google Drive Service for VistoriaTech
 * Handles photo upload and organization to Google Drive
 */

export interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  accessToken?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  parents: string[];
}

export interface UploadResult {
  success: boolean;
  file?: DriveFile;
  error?: string;
}

/**
 * Google Drive API Service
 * Provides methods for interacting with Google Drive API
 */
export class GoogleDriveService {
  private config: GoogleDriveConfig;
  private baseUrl = "https://www.googleapis.com/drive/v3";

  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFolder | null> {
    try {
      const metadata = {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId ? [parentId] : undefined
      };

      const response = await fetch(`${this.baseUrl}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.accessToken || this.config.apiKey}`
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        mimeType: data.mimeType
      };
    } catch (error) {
      console.error("Error creating folder:", error);
      return null;
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    file: File | string,
    folderId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      const fileName = typeof file === "string" ? `photo_${Date.now()}.jpg` : file.name;
      
      // For string URLs, we fetch and convert to blob
      let blob: Blob;
      if (typeof file === "string") {
        const response = await fetch(file);
        blob = await response.blob();
      } else {
        blob = file;
      }

      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      form.append("file", blob);

      const response = await fetch(`${this.baseUrl}/files?uploadType=multipart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken || this.config.apiKey}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        file: {
          id: data.id,
          name: data.name,
          mimeType: data.mimeType,
          webViewLink: data.webViewLink,
          webContentLink: data.webContentLink,
          parents: data.parents
        }
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Create organized folder structure for an inspection
   * Structure: /{Asset Number}/{OS Number}/photos
   */
  async createInspectionFolderStructure(
    assetNumber: string,
    osNumber: string
  ): Promise<{ assetFolder?: DriveFolder; osFolder?: DriveFolder; error?: string }> {
    try {
      // Create asset folder
      const assetFolder = await this.createFolder(assetNumber);
      if (!assetFolder) {
        return { error: "Failed to create asset folder" };
      }

      // Create OS folder inside asset folder
      const osFolder = await this.createFolder(osNumber, assetFolder.id);
      if (!osFolder) {
        return { error: "Failed to create OS folder" };
      }

      return { assetFolder, osFolder };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Upload all inspection photos to Google Drive
   */
  async uploadInspectionPhotos(
    assetNumber: string,
    osNumber: string,
    photos: (File | string)[]
  ): Promise<{ success: boolean; uploadedFiles?: DriveFile[]; error?: string }> {
    try {
      // Create folder structure
      const folderStructure = await this.createInspectionFolderStructure(assetNumber, osNumber);
      if (folderStructure.error || !folderStructure.osFolder) {
        return { success: false, error: folderStructure.error || "Failed to create folder structure" };
      }

      // Upload all photos
      const uploadedFiles: DriveFile[] = [];
      for (const photo of photos) {
        const result = await this.uploadFile(photo, folderStructure.osFolder.id);
        if (result.success && result.file) {
          uploadedFiles.push(result.file);
        }
      }

      return {
        success: true,
        uploadedFiles
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Generate a shareable link for a file
   */
  async generateShareableLink(fileId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.accessToken || this.config.apiKey}`
        },
        body: JSON.stringify({
          permissions: [
            {
              type: "anyone",
              role: "reader"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate shareable link: ${response.statusText}`);
      }

      const data = await response.json();
      return data.webViewLink;
    } catch (error) {
      console.error("Error generating shareable link:", error);
      return null;
    }
  }
}

/**
 * Get Google Drive service instance from environment/config
 */
export function getGoogleDriveService(): GoogleDriveService | null {
  // This will be populated from secrets/config
  const config = {
    apiKey: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || "",
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    accessToken: import.meta.env.VITE_GOOGLE_ACCESS_TOKEN
  };

  if (!config.apiKey && !config.accessToken) {
    return null;
  }

  return new GoogleDriveService(config);
}
interface UploadBlobOptions {
  blobUrl: string | null;       
  signedUrl: string;     
  contentType: string;  
}

async function uploadBlobToR2({ blobUrl, signedUrl, contentType }: UploadBlobOptions) {
  try {
    if (!blobUrl) return false
    const response = await fetch(blobUrl);
    const binaryData = await response.blob();


    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      body: binaryData,
      headers: {
        "Content-Type": contentType, 
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`R2 Upload Failed: ${uploadResponse.statusText}`);
    }

    console.log("🎯 File uploaded to Cloudflare R2 successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error uploading blob structure:", error);
    throw error;
  }
}
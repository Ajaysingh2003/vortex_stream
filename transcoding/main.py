import os
from feature.download import download_file
from feature.transcode import transcode
from feature.upload import upload_to_r2
# print(os.getenv("R2_ACCOUNT_ID"))


def main():
    # temp

    video_key = "uploads/44a4ec4a-43f1-4a03-a0cf-5197ff639a44-main-motion.mp4"

    video_id  = "34234342432"

    input_path = "/tmp/input.mp4"

    download_file(video_key=video_key,output_path="/tmp/input.mp4")

    output_dir = transcode(input_path=input_path, video_id=video_id)

    upload_to_r2(local_folder=output_dir,video_id=video_id)
    
    print("pipeline complete ✅")

if __name__ == "__main__":
    
    main()


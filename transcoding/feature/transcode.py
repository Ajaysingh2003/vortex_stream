import subprocess
import os
import sys

resolutions=[
    {"name":"360p","width":640,"height":360,"bitrate":"800k"},
    {"name":"480p","width":854,"height":480,"bitrate":"1400k"},
    {"name":"720p","width":1280,"height":720,"bitrate":"2800k"},
    {"name":"1080p","width":1920,"height":1080,"bitrate":"5000k"},
]


def transcode(input_path:str,video_id :str):
    output_dir=f"/tmp/hls/{video_id}"
    os.makedirs(output_dir,exist_ok=True)


    print(f"starting transcoding video for video id :{video_id}")

    for res in resolutions:
        process(res,input_path,output_dir)
    
    generate_master_playlist(output_dir)

    return output_dir

def process(res:dict,input_path:str,output_path:str):

    name=res["name"]
    width=res["width"]
    height=res["height"]
    bitrate=res["bitrate"]

    res_dir=f"{output_path}/{name}"
    os.makedirs(res_dir,exist_ok=True)

    output_playlist = f"{res_dir}/index.m3u8"
    output_segments = f"{res_dir}/seg%03d.ts"

    print(f"transcoding {name}...")

    bitrate_value = int(res["bitrate"].replace("k", ""))

    cmd = [
    "ffmpeg", "-i", input_path,
    
    # Scaling & Quality
    "-vf", f"scale={width}:{height}",
    "-c:v", "libx264",
    "-preset", "veryfast", # Faster processing for your worker
    "-crf", "20",          # Keeps quality high
    
    # Bitrate Control 
    "-b:v", bitrate,
    "-maxrate", bitrate,
    "-bufsize", f"{bitrate_value * 2}k",
    
    # Audio
    "-c:a", "aac",
    "-b:a", "128k",
    
    "-g", "48",             #  keyframe 
    "-sc_threshold", "0",  
    
    "-f", "hls",
    "-hls_time", "2",
    "-hls_flags", "independent_segments",
    "-hls_list_size", "0",
    "-hls_segment_filename", output_segments,
    "-hls_playlist_type", "vod",
    
    "-y", output_playlist
    ]

    try:
        result=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=3600)

        if result.returncode !=0:
            error=result.stderr.decode()
            print(f"FFmpeg error for {name}: {error}")
            sys.exit(1)

        print(f"{name} complete ✅")
    
    except subprocess.TimeoutExpired:
        print(f"error: FFmpeg timed out for {name}")
        sys.exit(1)

    except FileNotFoundError:
        print("error: FFmpeg not found — check Dockerfile")
        sys.exit(1)

    except Exception as e:
        print(f"error: unexpected error transcoding {name} — {e}")
        sys.exit(1)

def generate_master_playlist(output_dir: str):
    print("generating master playlist...")

    master_path = f"{output_dir}/master.m3u8"

    lines = ["#EXTM3U", "#EXT-X-VERSION:3", ""]

    for res in resolutions:
        name    = res["name"]
        width   = res["width"]
        height  = res["height"]
        bitrate = int(res["bitrate"].replace("k", "")) * 1000

        lines.append(f'#EXT-X-STREAM-INF:BANDWIDTH={bitrate},RESOLUTION={width}x{height}')
        lines.append(f'{name}/index.m3u8')
        lines.append("")

    with open(master_path, "w") as f:
        f.write("\n".join(lines))

    print(f"master playlist generated ✅ — {master_path}")
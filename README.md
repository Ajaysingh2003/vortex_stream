# vortex_stream

pending task in this project 

(1) have to remove the workspace table , currently i have two table assosiate with the same workspace but due to a some name change in the configuration , now i have 2 table , who do the same job of managing multiple user workspace.





{
    "id": "69c65c54e018a8d703808af0", done
    "name": "My Workspace",done
    "type": "proxy",
    "created_at": "2026-03-27T10:30:44.248Z",
    "updated_at": "2026-05-09T18:44:32.419Z",
    "video_protection": {},
    "player_config": {
        "preload": true,
        "autoplay": true,
        "disable_seek": false,
        "disable_player_controls": false,
        "powered_by_gumlet_overlay": true,
        "allow_drm_protected_videos": true,
        "loop": false,
        "player_color": "#6658ea",
        "include_seo": true,
        "enable_download_button": false,
        "caption_enabled": true,
        "pixel_tags": {
            "facebook_pixel_id": "vbvbvbv"
        },
        "logo_width": 100,
        "logo_height": 100,
        "dynamic_watermark": false,
        "watermark_font_size": 12,
        "watermark_font_color": "#ffffffff",
        "watermark_bg_color": "#00000019",
        "watermark_interval": 10000,
        "show_video_title": false,
        "cast": true,
        "resume_where_left": false,
        "widevine_min_security_level": "L3"
    },
    "default_profile_id": "69c65c54e018a8d703808ae9",
    "insight_property_id": "69c65c53e018a8d703808ab5",
    "insights_enabled": true,
    "proxy": {
        "whitelisted_domains": []
    },
    "embed_details": {
        "preload": true,
        "autoplay": true,
        "logo_width": 100,
        "logo_height": 100,
        "player_color": "#6658ea",
        "is_seo": true,
        "dynamic_watermark": false,
        "watermark_font_size": 12,
        "watermark_font_color": "#ffffffff",
        "watermark_bg_color": "#00000019",
        "watermark_interval": 10000,
        "disable_seek": false,
        "disable_player_controls": false,
        "powered_by_gumlet_overlay": true,
        "allow_drm_protected_videos": true,
        "pixel_tags": {
            "facebook_pixel_id": "vbvbvbv"
        },
        "loop": false,
        "caption_enabled": true,
        "enable_download_button": false,
        "show_video_title": false,
        "cast": true,
        "resume_where_left": false,
        "widevine_min_security_level": "L3"
    },
    "folders": [],
    "channel_settings": {
        "active": false,
        "privacy_type": "private",
        "channel_access_control": "public",
        "visible_playlists": [],
        "dynamic_watermark_type": "ip"
    }
}



now our main source will be importing video from many video sources like wistia,dropbox or many other

key platform which offer there api :

1 google drive
2 wistia
3 dropbox
4 s3
5
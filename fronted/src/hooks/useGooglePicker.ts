import { GooglePickerFile } from '@/modules/types'
import { access } from 'fs'
import { useEffect, useCallback, useRef } from 'react'

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID! 
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly'

export function useGooglePicker(onFilePicked: (file: GooglePickerFile, access_token: string) => void) {
    const tokenClientRef = useRef<any>(null);
    let access_token;
    useEffect(() => {
        const gapiScript = document.createElement('script')
        gapiScript.src = 'https://apis.google.com/js/api.js'
        gapiScript.async = true
        gapiScript.defer = true
        gapiScript.onload = () => {
            window.gapi.load('picker', () => {
                console.log('GAPI Picker library fully initialized');
            })
        }
        document.body.appendChild(gapiScript)

        const gisScript = document.createElement('script')
        gisScript.src = 'https://accounts.google.com/gsi/client'
        gisScript.async = true
        gisScript.defer = true
        gisScript.onload = () => {
            tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.error) {
                        console.error('OAuth token capture failed:', response);
                        return;
                    }
                    access_token = response.access_token;
                    console.log('OAuth token captured:', access_token);
                    buildPicker(response.access_token, onFilePicked);
                },
            });
        }
        document.body.appendChild(gisScript)

        return () => {
            document.body.removeChild(gapiScript)
            document.body.removeChild(gisScript)
        }
    }, [onFilePicked])

    const openPicker = useCallback(() => {
        if (!tokenClientRef.current) {
            console.error('Google Identity Services SDK has not initialized on the window stack yet.');
            return;
        }
        
        tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }, [])

    return { openPicker ,access_token }
}

function buildPicker(
    accessToken: string,
    onFilePicked: (file: GooglePickerFile, access_token: string) => void
) {
    if (!window.gapi || !window.google) {
        console.error('Scripts are missing from execution window.');
        return;
    }

    const picker = new window.google.picker.PickerBuilder()
       
        .addView(
            new window.google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(false)
                .setMimeTypes('video/mp4,video/quicktime,video/x-msvideo,video/mkv')
        )
        .addView(
            new window.google.picker.DocsView()
                .setEnableDrives(true)
                .setMimeTypes('video/mp4,video/quicktime,video/x-msvideo,video/mkv')
        )
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setTitle('Select a video to upload')
        .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
                const file = data.docs[0]
                onFilePicked({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    url: file.url,
                    sizeBytes: Number(file.sizeBytes || 0),
                }, accessToken);
            }
        })
        .build()

    picker.setVisible(true)
}
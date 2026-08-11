import { useCallback, useState, useEffect, useRef } from 'react'

export const useVideoThumbnail = () => {
    const [thumbnail, setThumbnail] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const thumbnailURLRef = useRef<string | null>(null)
    const isGeneratingRef = useRef(false)

    useEffect(() => {
        return () => {
            if (thumbnailURLRef.current) {
                URL.revokeObjectURL(thumbnailURLRef.current)
            }
        }
    }, [])

    const generateThumbnail = useCallback((
        file: File,
        seekTo: number = 1
    ): Promise<string> => {

        if (isGeneratingRef.current) return Promise.resolve('')
        isGeneratingRef.current = true

        return new Promise((resolve, reject) => {
            setLoading(true)

            const video = document.createElement('video')
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                isGeneratingRef.current = false
                setLoading(false)
                reject(new Error('Canvas not supported'))
                return
            }

            const blobURL = URL.createObjectURL(file)
            let retryCount = 0          // ← track retries
            const MAX_RETRIES = 3
            let isSeeking = false       // ← prevent onseeked loop
            let captureStarted = false
            let requestedSeek = 0
            let seekFallbackId: ReturnType<typeof setTimeout> | undefined
            let seekStarted = false

            const cleanup = () => {
                URL.revokeObjectURL(blobURL)
                video.onloadedmetadata = null
                video.onseeked = null
                video.onerror = null
                video.src = ''
                video.load()
                clearTimeout(timeoutId)
                if (seekFallbackId) clearTimeout(seekFallbackId)
                isGeneratingRef.current = false
            }

            const capture = () => {
                if (captureStarted) return
                // A seek event can arrive before the decoded frame is ready.
                if (video.readyState < 2) return
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    cleanup()
                    setLoading(false)
                    reject(new Error('Video has zero dimensions'))
                    return
                }
                captureStarted = true

                canvas.width = video.videoWidth
                canvas.height = video.videoHeight

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                            const pixel = ctx.getImageData(0, 0, 1, 1).data
                            const isBlack = pixel[0] < 10 && pixel[1] < 10 && pixel[2] < 10

                            if (isBlack && retryCount < MAX_RETRIES) {
                                retryCount++
                                const nextSeek = Math.min(
                                    video.currentTime + 2,
                                    video.duration - 0.1
                                )
                                console.warn(`black frame retry ${retryCount} — seeking to ${nextSeek}`)
                                // ← set flag so onseeked knows this is a retry
                                isSeeking = true
                                video.currentTime = nextSeek
                                return
                            }

                            // either not black or max retries hit — save whatever we have
                            canvas.toBlob((blob) => {
                                cleanup()

                                if (!blob) {
                                    setLoading(false)
                                    reject(new Error('Blob generation failed'))
                                    return
                                }

                                const thumbURL = URL.createObjectURL(blob)

                                if (thumbnailURLRef.current) {
                                    URL.revokeObjectURL(thumbnailURLRef.current)
                                }

                                thumbnailURLRef.current = thumbURL
                                setThumbnail(thumbURL)
                                setLoading(false)
                                resolve(thumbURL)

                            }, 'image/jpeg', 0.85)
                        })
                    })
                })
            }

            video.muted = true
            video.playsInline = true
            video.preload = 'auto'

            const startSeek = () => {
                if (seekStarted) return
                seekStarted = true
                console.log('metadata:', video.videoWidth, video.videoHeight, video.duration)
                requestedSeek = Math.min(
                    Math.max(0, seekTo),
                    Math.max(0, video.duration - 0.1),
                )
                isSeeking = true
                try {
                    video.currentTime = requestedSeek
                } catch {
                    isSeeking = false
                    capture()
                }

                // Some browsers decode the frame but never dispatch `seeked`
                // for a local Blob URL on the first attempt.
                seekFallbackId = setTimeout(() => {
                    if (!captureStarted && isSeeking) {
                        isSeeking = false
                        capture()
                    }
                }, 5000)
            }

            video.onloadedmetadata = startSeek

            video.onseeked = () => {
                if (!isSeeking) return   // ← ignore spurious seeked events
                isSeeking = false
                console.log('seeked at:', video.currentTime)
                // Playback is not required to draw a decoded video frame and
                // can remain pending because of browser autoplay policies.
                capture()
            }

            video.onloadeddata = () => {
                // A few browsers emit loadeddata without a usable metadata
                // event for local Blob URLs. Start the same seek path there.
                startSeek()
                // Seeking to time zero does not always emit `seeked`.
                if (isSeeking && requestedSeek === 0) {
                    isSeeking = false
                    capture()
                }
                if (!captureStarted && video.readyState >= 2 && !isSeeking) capture()
            }

            video.onerror = () => {
                console.error('video error:', video.error?.code, video.error?.message)
                cleanup()
                setLoading(false)
                reject(new Error(`MediaError: ${video.error?.code}`))
            }

            video.src = blobURL
            const timeoutId = setTimeout(() => {
                cleanup()
                setLoading(false)
                reject(new Error('Thumbnail generation timed out'))
            }, 60000)
        })
    }, [])

    const reset = useCallback(() => {
        isGeneratingRef.current = false
        if (thumbnailURLRef.current) {
            URL.revokeObjectURL(thumbnailURLRef.current)
            thumbnailURLRef.current = null
        }
        setThumbnail(null)
        setLoading(false)
    }, [])

    return { thumbnail, loading, generateThumbnail, reset }
}

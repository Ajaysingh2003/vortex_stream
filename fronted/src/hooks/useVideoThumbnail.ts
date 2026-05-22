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

            const cleanup = () => {
                URL.revokeObjectURL(blobURL)
                video.onloadedmetadata = null
                video.onseeked = null
                video.onerror = null
                video.src = ''
                video.load()
                isGeneratingRef.current = false
            }

            const capture = () => {
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    cleanup()
                    setLoading(false)
                    reject(new Error('Video has zero dimensions'))
                    return
                }

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
            video.crossOrigin = 'anonymous'

            video.onloadedmetadata = () => {
                console.log('metadata:', video.videoWidth, video.videoHeight, video.duration)
                const safeSeek = Math.min(Math.max(1, seekTo), video.duration - 0.1)
                isSeeking = true
                video.currentTime = safeSeek
            }

            video.onseeked = () => {
                if (!isSeeking) return   // ← ignore spurious seeked events
                isSeeking = false
                console.log('seeked at:', video.currentTime)

                const playPromise = video.play()
                if (playPromise) {
                    playPromise
                        .then(() => {
                            video.pause()
                            capture()
                        })
                        .catch(() => capture())
                } else {
                    capture()
                }
            }

            video.onerror = () => {
                console.error('video error:', video.error?.code, video.error?.message)
                cleanup()
                setLoading(false)
                reject(new Error(`MediaError: ${video.error?.code}`))
            }

            video.src = blobURL
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